import nodemailer, { Transporter } from "nodemailer";
import { config } from "../../config";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/errors";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter | any = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (config.email.host && config.email.user) {
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

  async sendMail(options: EmailOptions): Promise<boolean> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: config.email.from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html
        });
        logger.info(`Email sent successfully to ${options.to}: "${options.subject}"`);
        return true;
      } catch (err: any) {
        logger.error(`Error sending email to ${options.to}: ${err?.message || err}`);
        if (config.env === "production") {
          throw new AppError(503, "Email delivery failed. Please check SMTP settings or try again later.");
        }
        return false;
      }
    } else {
      if (config.env === "production") {
        logger.error("CRITICAL: SMTP credentials are not configured in production environment.");
        throw new AppError(
          503,
          "Email service is not configured. Please configure SMTP credentials in environment variables."
        );
      }

      // Development / Testing environment only:
      console.log("==================== [MR BILAL TRANSACTIONAL EMAIL PREVIEW] ====================");
      console.log(`Environment: ${config.env} (Non-production preview)`);
      console.log(`To: ${options.to}`);
      console.log(`From: ${config.email.from}`);
      console.log(`Subject: ${options.subject}`);
      if (options.text) {
        console.log(`Text Body:\n${options.text}`);
      }
      console.log("=================================================================================");
      return true;
    }
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

    return this.sendMail({ to: email, subject, html, text });
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

    return this.sendMail({ to: email, subject, html, text });
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

    return this.sendMail({ to: email, subject, html, text });
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

    return this.sendMail({ to: email, subject, html, text });
  }
}

export const emailService = new EmailService();
