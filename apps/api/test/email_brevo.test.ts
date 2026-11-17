import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EmailService, parseSender } from "../src/modules/email/email.service";
import { AppError } from "../src/utils/errors";
import { logger } from "../src/utils/logger";
import { config } from "../src/config";

describe("EmailService — Brevo HTTPS API (Task 1 & Task 2)", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalConfigEnv: string;
  let originalBrevoKey: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    originalEnv = { ...process.env };
    originalConfigEnv = config.env;
    originalBrevoKey = config.brevo.apiKey;
    process.env.BREVO_API_KEY = "xkeysib-mock-api-key-test-value";
  });

  afterEach(() => {
    process.env = originalEnv;
    (config as any).env = originalConfigEnv;
    config.brevo.apiKey = originalBrevoKey;
    vi.restoreAllMocks();
  });

  // ── parseSender Helper Tests ───────────────────────────────────────────────
  describe("parseSender helper", () => {
    it("parses full 'Name <email@domain.com>' format", () => {
      const parsed = parseSender("MR Bilal POS <noreply@mrbilal.com>");
      expect(parsed.name).toBe("MR Bilal POS");
      expect(parsed.email).toBe("noreply@mrbilal.com");
    });

    it("parses quoted '\"MR Bilal POS\" <noreply@mrbilal.com>' format", () => {
      const parsed = parseSender('"MR Bilal POS" <noreply@mrbilal.com>');
      expect(parsed.name).toBe("MR Bilal POS");
      expect(parsed.email).toBe("noreply@mrbilal.com");
    });

    it("parses plain email 'noreply@mrbilal.com' with default sender name", () => {
      const parsed = parseSender("noreply@mrbilal.com");
      expect(parsed.name).toBe("MR Bilal POS");
      expect(parsed.email).toBe("noreply@mrbilal.com");
    });

    it("parses email wrapped in angle brackets '<noreply@mrbilal.com>'", () => {
      const parsed = parseSender("<noreply@mrbilal.com>");
      expect(parsed.name).toBe("MR Bilal POS");
      expect(parsed.email).toBe("noreply@mrbilal.com");
    });
  });

  // ── 1. Successful Brevo Email Acceptance (201 Created) ──────────────────────
  describe("1. Successful Brevo Email Acceptance", () => {
    it("sends email via Brevo HTTPS API with api-key header and valid JSON payload", async () => {
      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ messageId: "<20261117.test@smtp-relay.mailin.fr>" })
      } as any);

      const emailService = new EmailService();
      const result = await emailService.sendMail({
        to: "customer@example.com",
        toName: "Customer Name",
        subject: "Welcome to MR Bilal POS",
        html: "<p>Hello Customer</p>",
        text: "Hello Customer"
      });

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledOnce();

      const [url, requestInit] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.brevo.com/v3/smtp/email");
      expect(requestInit?.method).toBe("POST");

      const headers = requestInit?.headers as Record<string, string>;
      expect(headers["api-key"]).toBe("xkeysib-mock-api-key-test-value");
      expect(headers["accept"]).toBe("application/json");
      expect(headers["content-type"]).toBe("application/json");

      const body = JSON.parse(requestInit?.body as string);
      expect(body.sender.name).toBe("MR Bilal POS");
      expect(body.sender.email).toBe("noreply@mrbilal.com");
      expect(body.to).toEqual([{ email: "customer@example.com", name: "Customer Name" }]);
      expect(body.subject).toBe("Welcome to MR Bilal POS");
      expect(body.htmlContent).toBe("<p>Hello Customer</p>");
      expect(body.textContent).toBe("Hello Customer");
    });
  });

  // ── 2. Registration OTP Delivery ───────────────────────────────────────────
  describe("2. Registration OTP Delivery", () => {
    it("sends registration OTP with branded templates and verification URL", async () => {
      let capturedPayload: any = null;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
        capturedPayload = JSON.parse(init?.body as string);
        return {
          ok: true,
          status: 201,
          json: async () => ({ messageId: "<reg-otp-id>" })
        } as any;
      });

      const emailService = new EmailService();
      const result = await emailService.sendVerificationEmail(
        "newuser@mrbilal.com",
        "Bilal Ahmad",
        "482910"
      );

      expect(result).toBe(true);
      expect(capturedPayload.to[0].email).toBe("newuser@mrbilal.com");
      expect(capturedPayload.to[0].name).toBe("Bilal Ahmad");
      expect(capturedPayload.subject).toBe("Verify Your MR Bilal Account");
      expect(capturedPayload.htmlContent).toContain("482910");
      expect(capturedPayload.htmlContent).toContain("MR BILAL POS");
      expect(capturedPayload.textContent).toContain("482910");
      expect(capturedPayload.textContent).toContain("expires in 15 minutes");
    });
  });

  // ── 3. Password Reset OTP Delivery ─────────────────────────────────────────
  describe("3. Password Reset OTP Delivery", () => {
    it("sends password reset OTP with secure action URL and warning message", async () => {
      let capturedPayload: any = null;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
        capturedPayload = JSON.parse(init?.body as string);
        return {
          ok: true,
          status: 201,
          json: async () => ({ messageId: "<reset-otp-id>" })
        } as any;
      });

      const emailService = new EmailService();
      const result = await emailService.sendPasswordResetEmail(
        "owner@mrbilal.com",
        "Store Owner",
        "991234"
      );

      expect(result).toBe(true);
      expect(capturedPayload.to[0].email).toBe("owner@mrbilal.com");
      expect(capturedPayload.to[0].name).toBe("Store Owner");
      expect(capturedPayload.subject).toBe("Reset Your MR Bilal Password");
      expect(capturedPayload.htmlContent).toContain("991234");
      expect(capturedPayload.textContent).toContain("991234");
      expect(capturedPayload.textContent).toContain("If you did not request this");
    });
  });

  // ── 4. Email Verification Resend ───────────────────────────────────────────
  describe("4. Email Verification Resend", () => {
    it("successfully sends repeated verification OTP via Brevo", async () => {
      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ messageId: "<resend-id>" })
      } as any);

      const emailService = new EmailService();
      const resend1 = await emailService.sendVerificationEmail("user@test.com", "User", "111222");
      const resend2 = await emailService.sendVerificationEmail("user@test.com", "User", "333444");

      expect(resend1).toBe(true);
      expect(resend2).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  // ── 5. Missing API Key ─────────────────────────────────────────────────────
  describe("5. Missing API Key", () => {
    it("throws AppError 503 in production when BREVO_API_KEY is missing", async () => {
      delete process.env.BREVO_API_KEY;
      config.brevo.apiKey = "";
      (config as any).env = "production";

      const emailService = new EmailService();
      // When Brevo key is missing, isBrevoConfigured is false; if SMTP is also unconfigured, production fails closed
      await expect(
        emailService.sendMail({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>"
        })
      ).rejects.toThrow(AppError);
    });
  });

  // ── 6. Invalid API Key (401) ───────────────────────────────────────────────
  describe("6. Invalid API Key (401 Unauthorized)", () => {
    it("does not retry 401 permanent error and throws 503 in production", async () => {
      (config as any).env = "production";

      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ code: "unauthorized", message: "Key not found in database" })
      } as any);

      const emailService = new EmailService();
      await expect(
        emailService.sendMail({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>"
        })
      ).rejects.toThrow(AppError);

      // Permanent error must NOT be retried
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── 7. Unverified Sender / Forbidden (403) ─────────────────────────────────
  describe("7. Unverified Sender / Forbidden Response (403)", () => {
    it("does not retry 403 forbidden error and throws 503 in production", async () => {
      (config as any).env = "production";

      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => ({ code: "permission_denied", message: "Sender domain unverified" })
      } as any);

      const emailService = new EmailService();
      await expect(
        emailService.sendMail({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>"
        })
      ).rejects.toThrow(AppError);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── 8. Invalid Request (400 Bad Request) ───────────────────────────────────
  describe("8. Invalid Request (400 Bad Request)", () => {
    it("does not retry 400 validation error and throws 503 in production", async () => {
      (config as any).env = "production";

      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ code: "invalid_parameter", message: "Invalid email format" })
      } as any);

      const emailService = new EmailService();
      await expect(
        emailService.sendMail({
          to: "invalid-email",
          subject: "Test",
          html: "<p>Test</p>"
        })
      ).rejects.toThrow(AppError);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── 9. Rate Limiting (429 Too Many Requests) ───────────────────────────────
  describe("9. Rate Limiting (429)", () => {
    it("handles 429 rate limit error gracefully and throws specific 503 message", async () => {
      (config as any).env = "production";

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => ({ code: "resourcelimit", message: "Rate limit exceeded" })
      } as any);

      const emailService = new EmailService();
      const err = await emailService
        .sendMail({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>"
        })
        .catch((e) => e);

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(503);
      expect(err.message).toContain("rate limit reached");
    });
  });

  // ── 10. Provider Server Error (5xx Transient) ──────────────────────────────
  describe("10. Provider Server Error (5xx)", () => {
    it("retries transient 5xx errors up to 2 times (3 total attempts) before failing", async () => {
      (config as any).env = "production";

      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ code: "server_error", message: "Backend error" })
      } as any);

      const emailService = new EmailService();
      await expect(
        emailService.sendMail({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>"
        })
      ).rejects.toThrow(AppError);

      // 1 initial attempt + 2 retries = 3 calls
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("succeeds on 2nd retry after an initial 502 Bad Gateway", async () => {
      let callCount = 0;
      vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 502,
            statusText: "Bad Gateway",
            json: async () => ({ message: "Gateway error" })
          } as any;
        }
        return {
          ok: true,
          status: 201,
          json: async () => ({ messageId: "<recovered-id>" })
        } as any;
      });

      const emailService = new EmailService();
      const result = await emailService.sendMail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>"
      });

      expect(result).toBe(true);
      expect(callCount).toBe(2);
    });
  });

  // ── 11. Network Timeout ────────────────────────────────────────────────────
  describe("11. Network Timeout", () => {
    it("catches timeout/abort error and retries before throwing AppError 503", async () => {
      (config as any).env = "production";

      const timeoutError = new Error("The operation was aborted");
      timeoutError.name = "AbortError";

      const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(timeoutError);

      const emailService = new EmailService();
      const err = await emailService
        .sendMail({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>"
        })
        .catch((e) => e);

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(503);
      expect(err.message).toContain("network timeout");
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  // ── 12. No Secrets or OTP Leaked Through Logs ──────────────────────────────
  describe("12. No Secrets or OTP Values Leaked in Logs", () => {
    it("never logs the BREVO_API_KEY, raw OTP or password reset links", async () => {
      const loggerErrorSpy = vi.spyOn(logger, "error");
      const loggerInfoSpy = vi.spyOn(logger, "info");

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          code: "unauthorized",
          message: "Key xkeysib-mock-api-key-test-value is invalid"
        })
      } as any);

      const emailService = new EmailService();
      await emailService
        .sendVerificationEmail("secure@example.com", "VIP User", "SECRET_OTP_999888")
        .catch(() => {});

      const allLoggedMessages = [
        ...loggerErrorSpy.mock.calls.map((c) => c.join(" ")),
        ...loggerInfoSpy.mock.calls.map((c) => c.join(" "))
      ].join(" ");

      // The secret Brevo API key must NEVER be printed
      expect(allLoggedMessages).not.toContain("xkeysib-mock-api-key-test-value");
      // The raw OTP value must NOT be logged in error logs
      expect(allLoggedMessages).not.toContain("SECRET_OTP_999888");
    });
  });

  // ── 13. No SMTP Fallback When Brevo Is Enabled ─────────────────────────────
  describe("13. No SMTP Fallback When Brevo Is Enabled", () => {
    it("never calls SMTP transporter when Brevo is configured, even if Brevo fails", async () => {
      // Force Brevo failure
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: "Internal Brevo outage" })
      } as any);

      const emailService = new EmailService();
      // Inject a mock SMTP transporter to test if it gets called
      const smtpSendMailSpy = vi.fn();
      (emailService as any).transporter = { sendMail: smtpSendMailSpy };

      await emailService
        .sendMail({
          to: "customer@example.com",
          subject: "Test",
          html: "<p>Test</p>"
        })
        .catch(() => {});

      // SMTP transporter MUST NOT be called!
      expect(smtpSendMailSpy).not.toHaveBeenCalled();
    });
  });

  // ── 14. Custom Brevo Sender Configuration ──────────────────────────────────
  describe("14. Custom Brevo Sender Configuration", () => {
    it("uses BREVO_SENDER_EMAIL and BREVO_SENDER_NAME when specified", async () => {
      process.env.BREVO_SENDER_EMAIL = "verified@boutique.com";
      process.env.BREVO_SENDER_NAME = "MR Bilal Boutique Official";

      let capturedPayload: any = null;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
        capturedPayload = JSON.parse(init?.body as string);
        return {
          ok: true,
          status: 201,
          json: async () => ({ messageId: "<custom-sender-id>" })
        } as any;
      });

      const emailService = new EmailService();
      await emailService.sendMail({
        to: "client@example.com",
        subject: "Hello",
        html: "<p>Hello</p>"
      });

      expect(capturedPayload.sender.email).toBe("verified@boutique.com");
      expect(capturedPayload.sender.name).toBe("MR Bilal Boutique Official");
    });
  });

  // ── 15. Password Changed Notification Email ────────────────────────────────
  describe("15. Password Changed Notification Email", () => {
    it("sends security alert notification via Brevo when password is changed", async () => {
      let capturedPayload: any = null;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
        capturedPayload = JSON.parse(init?.body as string);
        return {
          ok: true,
          status: 201,
          json: async () => ({ messageId: "<pw-changed-id>" })
        } as any;
      });

      const emailService = new EmailService();
      const result = await emailService.sendPasswordChangedEmail(
        "admin@mrbilal.com",
        "Saqib Mughal"
      );

      expect(result).toBe(true);
      expect(capturedPayload.to[0].email).toBe("admin@mrbilal.com");
      expect(capturedPayload.subject).toContain("Password Was Changed");
      expect(capturedPayload.htmlContent).toContain("Saqib Mughal");
      expect(capturedPayload.htmlContent).toContain("MR BILAL POS");
    });
  });

  // ── 16. Email Address Change OTP ───────────────────────────────────────────
  describe("16. Email Address Change OTP", () => {
    it("sends email change OTP via Brevo", async () => {
      let capturedPayload: any = null;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
        capturedPayload = JSON.parse(init?.body as string);
        return {
          ok: true,
          status: 201,
          json: async () => ({ messageId: "<email-change-id>" })
        } as any;
      });

      const emailService = new EmailService();
      const result = await emailService.sendEmailChangeOtp(
        "newaddress@domain.com",
        "Saqib",
        "555777"
      );

      expect(result).toBe(true);
      expect(capturedPayload.to[0].email).toBe("newaddress@domain.com");
      expect(capturedPayload.subject).toContain("Verify Your New Email Address");
      expect(capturedPayload.htmlContent).toContain("555777");
    });
  });
});
