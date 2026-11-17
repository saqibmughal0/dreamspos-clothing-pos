import nodemailer, { Transporter } from "nodemailer";
import { config } from "../../config";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/errors";

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface BrevoSender {
  name: string;
  email: string;
}

export interface BrevoRecipient {
  email: string;
  name?: string;
}

export interface BrevoSendPayload {
  sender: BrevoSender;
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Parses standard email sender strings into structured Brevo sender.
 * Examples:
 *   "MR Bilal POS <noreply@mrbilal.com>" -> { name: "MR Bilal POS", email: "noreply@mrbilal.com" }
 *   "noreply@mrbilal.com"                -> { name: "MR Bilal POS", email: "noreply@mrbilal.com" }
 */
export function parseSender(fromStr: string, defaultName = "MR Bilal POS"): BrevoSender {
  const trimmed = (fromStr || "").trim();
  const match = trimmed.match(/^(?:["']?([^"']+)["']?\s*)?<([^>]+)>$/);
  if (match) {
    return {
      name: match[1]?.trim() || defaultName,
      email: match[2]?.trim() || ""
    };
  }
  return {
    name: defaultName,
    email: trimmed
  };
}

export class EmailService {
  private transporter: Transporter | any = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    // Only initialize SMTP transporter if Brevo is NOT active and SMTP is configured
    if (!this.isBrevoConfigured && config.email.host && config.email.user) {
      try {
        this.transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure,
          auth: {
            user: config.email.user,
            pass: config.email.pass
          }
        });
      } catch (err) {
        logger.error("Failed to initialize Nodemailer transporter", err);
        this.transporter = null;
      }
    }
  }

  /**
   * Check whether Brevo HTTPS API is configured via environment variables
   */
  get isBrevoConfigured(): boolean {
    return Boolean(process.env.BREVO_API_KEY || config.brevo.apiKey);
  }

  /**
   * Resolve sender configuration from Brevo-specific variables or standard SMTP_FROM
   */
  getSender(): BrevoSender {
    const customEmail = process.env.BREVO_SENDER_EMAIL || config.brevo.senderEmail;
    const customName = process.env.BREVO_SENDER_NAME || config.brevo.senderName;

    if (customEmail) {
      return {
        name: customName || "MR Bilal POS",
        email: customEmail.trim()
      };
    }

    const fromConfig =
      process.env.SMTP_FROM || process.env.EMAIL_FROM || config.email.from || "MR Bilal POS <noreply@mrbilal.com>";
    return parseSender(fromConfig);
  }

  /**
   * Perform HTTP POST request to Brevo API with bounded retries for transient failures.
   * Permanent errors (400, 401, 403, 404) are NOT retried.
   */
  private async postBrevoWithRetry(
    url: string,
    headers: Record<string, string>,
    body: string,
    maxRetries = 2
  ): Promise<Response> {
    let attempt = 0;
    while (true) {
      attempt++;
      const controller = new AbortController();
      const timeoutMs = 10000; // 10 second timeout
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal
        });
        clearTimeout(timer);

        // Immediate return for success (201) or non-retryable client errors (400, 401, 403, 404)
        const isClientErrorNonRetryable =
          response.status >= 400 && response.status < 500 && response.status !== 429;

        if (response.ok || isClientErrorNonRetryable) {
          return response;
        }

        // Retry on 429 (rate limit) or 5xx (server error) if attempts remain
        if (attempt <= maxRetries) {
          const delayMs = process.env.NODE_ENV === "test" ? 5 : attempt * 500;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        return response;
      } catch (err: any) {
        clearTimeout(timer);
        if (attempt <= maxRetries) {
          const delayMs = process.env.NODE_ENV === "test" ? 5 : attempt * 500;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        throw err;
      }
    }
  }

  /**
   * Send transactional email using official Brevo HTTPS API (api.brevo.com/v3/smtp/email)
   */
  private async sendViaBrevo(options: EmailOptions): Promise<boolean> {
    const apiKey = process.env.BREVO_API_KEY || config.brevo.apiKey;
    if (!apiKey) {
      logger.error("[Email:Brevo] BREVO_API_KEY is missing in environment variables");
      if (config.env === "production") {
        throw new AppError(503, "Email delivery failed. Email service is not properly configured.");
      }
      return false;
    }

    const sender = this.getSender();
    if (!sender.email) {
      logger.error("[Email:Brevo] Verified sender email is missing or empty");
      if (config.env === "production") {
        throw new AppError(503, "Email delivery failed. Sender email is not properly configured.");
      }
      return false;
    }

    const payload: BrevoSendPayload = {
      sender: {
        name: sender.name,
        email: sender.email
      },
      to: [
        {
          email: options.to,
          ...(options.toName ? { name: options.toName } : {})
        }
      ],
      subject: options.subject,
      htmlContent: options.html,
      ...(options.text ? { textContent: options.text } : {})
    };

    try {
      const response = await this.postBrevoWithRetry(
        "https://api.brevo.com/v3/smtp/email",
        {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json"
        },
        JSON.stringify(payload)
      );

      // Brevo returns 201 Created on successful email submission
      if (response.status === 201) {
        const data: any = await response.json().catch(() => ({}));
        logger.info(
          `[Email:Brevo] Email sent successfully to ${options.to}: "${options.subject}" (messageId: ${
            data?.messageId || "accepted"
          })`
        );
        return true;
      }

      // Handle provider error diagnostics cleanly (never leak keys or OTPs)
      let errorCode = "UNKNOWN_ERROR";
      let rawMessage = "Provider rejected request";
      try {
        const errorData: any = await response.json();
        if (errorData?.code) errorCode = String(errorData.code);
        if (errorData?.message) rawMessage = String(errorData.message);
      } catch {
        rawMessage = response.statusText || `HTTP ${response.status}`;
      }

      // Sanitize any potential secrets or tokens from provider error message
      const sanitizedMessage = rawMessage.replace(/[\w-]{20,}/g, "[REDACTED]");
      logger.error(`[Email:Brevo] Delivery failed with HTTP ${response.status} (${errorCode}): ${sanitizedMessage}`);

      if (config.env === "production") {
        if (response.status === 429) {
          throw new AppError(503, "Email delivery rate limit reached. Please try again in a few minutes.");
        }
        throw new AppError(503, "Email delivery failed. Please check email settings or try again later.");
      }
      return false;
    } catch (err: any) {
      if (err instanceof AppError) throw err;

      const isTimeout = err?.name === "AbortError";
      const sanitizedErrMsg = isTimeout ? "Connection timeout" : err?.message || "Network error";
      logger.error(`[Email:Brevo] Transport error sending to ${options.to}: ${sanitizedErrMsg}`);

      if (config.env === "production") {
        throw new AppError(503, "Email delivery failed due to network timeout. Please try again later.");
      }
      return false;
    }
  }

  /**
   * Unified sendMail entry point:
   * 1. If BREVO_API_KEY is configured: Uses Brevo HTTPS API exclusively (no SMTP fallback).
   * 2. Else if SMTP transporter is configured: Uses Nodemailer SMTP.
   * 3. Else: In production fails closed with 503; in dev/test logs email preview to console.
   */
  async sendMail(options: EmailOptions): Promise<boolean> {
    // 1. Preferred Brevo HTTPS API
    if (this.isBrevoConfigured) {
      return this.sendViaBrevo(options);
    }

    // 2. Legacy SMTP Delivery (used only when Brevo is not configured)
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: config.email.from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html
        });
        logger.info(`Email sent successfully via SMTP to ${options.to}: "${options.subject}"`);
        return true;
      } catch (err: any) {
        logger.error(`Error sending email via SMTP to ${options.to}: ${err?.message || err}`);
        if (config.env === "production") {
          throw new AppError(503, "Email delivery failed. Please check SMTP settings or try again later.");
        }
        return false;
      }
    }

    // 3. Unconfigured Environment Handling
    if (config.env === "production") {
      logger.error("CRITICAL: Email service is not configured in production environment (missing BREVO_API_KEY).");
      throw new AppError(
        503,
        "Email service is not configured. Please configure BREVO_API_KEY in environment variables."
      );
    }

    // Development / Testing environment fallback preview:
    console.log("==================== [MR BILAL TRANSACTIONAL EMAIL PREVIEW] ====================");
    console.log(`Environment: ${config.env} (Non-production preview)`);
    console.log(`To: ${options.to}`);
    console.log(`From: ${this.getSender().name} <${this.getSender().email}>`);
    console.log(`Subject: ${options.subject}`);
    if (options.text) {
      console.log(`Text Body:\n${options.text}`);
    }
    console.log("=================================================================================");
    return true;
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
    const verificationUrl = `${config.frontendUrl}/email-verification?email=${encodeURIComponent(
      email
    )}&token=${encodeURIComponent(token)}`;

    const subject = "Verify Your MR Bilal Account";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0d1b2a; padding: 24px; text-align: center;">
          <h1 style="color: #ff9f43; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">MR BILAL POS</h1>
          <p style="color: #e2e8f0; margin: 6px 0 0 0; font-size: 13px;">Premium Boutique & Retail System</p>
        </div>
        <div style="padding: 32px 24px; color: #334155;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Welcome, ${name}!</h2>
          <p style="font-size: 15px; line-height: 1.6;">Thank you for registering with MR Bilal POS. Please verify your email address to activate your account and access the dashboard.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600;">Your Verification Code (OTP)</p>
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ff9f43; font-family: monospace;">${token}</span>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${verificationUrl}" style="background-color: #ff9f43; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Verify Email Address</a>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This verification code will expire in <strong>15 minutes</strong>. If you did not create an account on MR Bilal POS, please ignore this email.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">© ${new Date().getFullYear()} MR Bilal POS. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `Welcome, ${name}!\n\nYour MR Bilal POS verification code is: ${token}\n\nOr verify directly at:\n${verificationUrl}\n\nThis code expires in 15 minutes.`;

    return this.sendMail({ to: email, toName: name, subject, html, text });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${config.frontendUrl}/reset-password?email=${encodeURIComponent(
      email
    )}&token=${encodeURIComponent(token)}`;

    const subject = "Reset Your MR Bilal Password";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0d1b2a; padding: 24px; text-align: center;">
          <h1 style="color: #ff9f43; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">MR BILAL POS</h1>
          <p style="color: #e2e8f0; margin: 6px 0 0 0; font-size: 13px;">Security & Account Management</p>
        </div>
        <div style="padding: 32px 24px; color: #334155;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Password Reset Request</h2>
          <p style="font-size: 15px; line-height: 1.6;">Hello ${name}, we received a request to reset your password for your MR Bilal POS account.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600;">Your Reset Code (OTP)</p>
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ff9f43; font-family: monospace;">${token}</span>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background-color: #ff9f43; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password</a>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This password reset code will expire in <strong>15 minutes</strong>. If you did not request a password reset, please secure your account immediately or ignore this message.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">© ${new Date().getFullYear()} MR Bilal POS. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `Hello ${name},\n\nYour MR Bilal POS password reset code is: ${token}\n\nOr reset directly at:\n${resetUrl}\n\nThis code expires in 15 minutes. If you did not request this, please ignore.`;

    return this.sendMail({ to: email, toName: name, subject, html, text });
  }

  async sendEmailChangeOtp(email: string, name: string, token: string): Promise<boolean> {
    const subject = "Verify Your New Email Address - MR Bilal POS";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0d1b2a; padding: 24px; text-align: center;">
          <h1 style="color: #ff9f43; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">MR BILAL POS</h1>
          <p style="color: #e2e8f0; margin: 6px 0 0 0; font-size: 13px;">Email Address Verification</p>
        </div>
        <div style="padding: 32px 24px; color: #334155;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Email Change Verification</h2>
          <p style="font-size: 15px; line-height: 1.6;">Hello ${name}, a request was made to update your MR Bilal POS account email address to this one.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600;">Your Verification Code (OTP)</p>
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ff9f43; font-family: monospace;">${token}</span>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This verification code will expire in <strong>15 minutes</strong>. If you did not make this request, please contact your system administrator.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">© ${new Date().getFullYear()} MR Bilal POS. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `Hello ${name},\n\nYour MR Bilal POS email verification code is: ${token}\n\nThis code expires in 15 minutes.`;

    return this.sendMail({ to: email, toName: name, subject, html, text });
  }

  async sendPasswordChangedEmail(email: string, name: string): Promise<boolean> {
    const subject = "Security Alert: Your MR Bilal Password Was Changed";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0d1b2a; padding: 24px; text-align: center;">
          <h1 style="color: #ff9f43; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">MR BILAL POS</h1>
          <p style="color: #e2e8f0; margin: 6px 0 0 0; font-size: 13px;">Security Notification</p>
        </div>
        <div style="padding: 32px 24px; color: #334155;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Password Changed Successfully</h2>
          <p style="font-size: 15px; line-height: 1.6;">Hello ${name}, this email confirms that the password for your MR Bilal POS account was changed on ${new Date().toUTCString()}.</p>
          <p style="font-size: 14px; color: #e11d48; font-weight: 500;">If you did not perform this change, please contact support or reset your password immediately.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">© ${new Date().getFullYear()} MR Bilal POS. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `Hello ${name},\n\nThe password for your MR Bilal POS account was changed on ${new Date().toUTCString()}.\nIf you did not perform this change, please contact your administrator immediately.`;

    return this.sendMail({ to: email, toName: name, subject, html, text });
  }
}

export const emailService = new EmailService();
