import crypto from "crypto";
import { config } from "../config";

export const OTP_CONFIG = {
  EXPIRATION_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_COOLDOWN_MS: 60 * 1000, // 60 seconds
  MAX_ATTEMPTS: 5
};

export type OtpPurpose = "verify" | "reset" | "email-change";

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
export function generateNumericOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP using domain-separated HMAC-SHA256 with the application secret
 */
export function hashOtp(purpose: OtpPurpose, otp: string): string {
  const secret = config.jwt.secret || "fallback_security_salt";
  const payload = `${purpose}:${otp.trim()}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Constant-time verification of OTP against stored HMAC hash
 */
export function verifyOtpHash(
  purpose: OtpPurpose,
  otp: string,
  storedHash: string | null | undefined
): boolean {
  if (!storedHash || !otp) {
    return false;
  }

  const computedHash = hashOtp(purpose, otp);

  try {
    const computedBuf = Buffer.from(computedHash, "hex");
    const storedBuf = Buffer.from(storedHash, "hex");

    if (computedBuf.length !== storedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuf, storedBuf);
  } catch {
    return false;
  }
}

/**
 * Hash any token (e.g. Refresh Token) using SHA-256 for secure database storage
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}
