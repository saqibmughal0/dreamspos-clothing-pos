import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "../src/modules/auth/auth.service";
import { userService } from "../src/modules/users/user.service";
import { storageService } from "../src/modules/storage/storage.service";
import { prisma } from "@dreamspos/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../src/config";
import {
  OTP_CONFIG,
  hashOtp,
  verifyOtpHash,
  generateNumericOtp,
  hashToken
} from "../src/utils/security";
import { BadRequestError, UnauthorizedError } from "../src/utils/errors";

describe("Authentication & User Profile Security Audit Tests", () => {
  const dummyUserId = "user-sec-999";
  let samplePasswordHash: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    samplePasswordHash = await bcrypt.hash("SecurePass@2026", 10);
    vi.spyOn(prisma.refreshToken, "create").mockResolvedValue({} as any);
    vi.spyOn(prisma.refreshToken, "delete").mockResolvedValue({} as any);
    vi.spyOn(prisma.refreshToken, "deleteMany").mockResolvedValue({ count: 1 } as any);
  });

  describe("1. OTP Hashing, Verification & Expiration Security", () => {
    it("Domain-separated hashes are unique across purposes even with identical OTPs", () => {
      const otp = "123456";
      const hashVerify = hashOtp("verify", otp);
      const hashReset = hashOtp("reset", otp);
      const hashEmailChange = hashOtp("email-change", otp);

      expect(hashVerify).not.toBe(hashReset);
      expect(hashReset).not.toBe(hashEmailChange);
      expect(hashVerify).not.toBe(hashEmailChange);

      // Plaintext OTP is never equal to stored hash
      expect(hashVerify).not.toBe(otp);
    });

    it("Rejects incorrect OTP securely via timingSafeEqual", () => {
      const otp = "654321";
      const storedHash = hashOtp("verify", otp);

      expect(verifyOtpHash("verify", "654321", storedHash)).toBe(true);
      expect(verifyOtpHash("verify", "111111", storedHash)).toBe(false);
      expect(verifyOtpHash("verify", "", storedHash)).toBe(false);
      expect(verifyOtpHash("verify", "654321", null)).toBe(false);
    });

    it("Rejects expired verification OTP", async () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 sec in the past
      const otp = "555666";
      const storedHash = hashOtp("verify", otp);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: dummyUserId,
        email: "user@example.com",
        name: "Test User",
        emailVerified: false,
        verificationTokenHash: storedHash,
        verificationTokenExpires: expiredDate,
        verificationAttempts: 0,
        role: { name: "CASHIER" },
        company: { name: "MR Bilal Boutique" }
      } as any);
      vi.spyOn(prisma.user, "update").mockResolvedValue({} as any);

      await expect(
        authService.verifyEmail({
          email: "user@example.com",
          token: otp
        })
      ).rejects.toThrow("Verification code has expired");
    });

    it("Enforces lockout after max 5 failed verification attempts", async () => {
      const otp = "999888";
      const storedHash = hashOtp("verify", otp);

      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: dummyUserId,
        email: "lockout@example.com",
        name: "Lockout Test",
        emailVerified: false,
        verificationTokenHash: storedHash,
        verificationTokenExpires: new Date(Date.now() + 100000),
        verificationAttempts: 5, // Already reached limit
        role: { name: "CASHIER" },
        company: { name: "MR Bilal Boutique" }
      } as any);

      const updateSpy = vi.spyOn(prisma.user, "update").mockResolvedValue({} as any);

      await expect(
        authService.verifyEmail({
          email: "lockout@example.com",
          token: otp
        })
      ).rejects.toThrow("Too many failed attempts");

      // Verify that the token hash is invalidated in database
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            verificationTokenHash: null,
            verificationTokenExpires: null
          })
        })
      );
    });

    it("Enforces 60-second rate-limiting cooldown on resend verification", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: dummyUserId,
        email: "ratelimit@example.com",
        name: "Rate Limit Test",
        emailVerified: false,
        verificationSentAt: new Date(Date.now() - 20 * 1000) // 20s ago (within 60s cooldown)
      } as any);

      await expect(
        authService.resendVerification("ratelimit@example.com")
      ).rejects.toThrow("Please wait 60 seconds");
    });
  });

  describe("2. Account Enumeration Prevention", () => {
    it("Forgot password returns identical generic response for non-existent email", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      const res = await authService.forgotPassword("nonexistent@domain.com");
      expect(res.message).toContain("If an account with that email exists");
    });

    it("Resend verification returns generic message for non-existent email", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

      const res = await authService.resendVerification("nonexistent@domain.com");
      expect(res.message).toContain("If an unverified account with this email exists");
    });
  });

  describe("3. Google Account Linking Protection", () => {
    it("Rejects auto-linking when an account with matching email already exists without googleId", async () => {
      // Mock existing password account
      vi.spyOn(prisma.user, "findUnique").mockImplementation(async (args: any) => {
        if (args.where.googleId) return null;
        if (args.where.email === "boutique.owner@gmail.com") {
          return {
            id: "existing-owner-id",
            email: "boutique.owner@gmail.com",
            googleId: null, // Not linked yet!
            role: { name: "SUPER_ADMIN" },
            isActive: true
          } as any;
        }
        return null;
      });

      // Construct fake Google ID token with sub and email
      const fakeGoogleToken = jwt.sign(
        {
          sub: "google-sub-1234567890",
          email: "boutique.owner@gmail.com",
          name: "Boutique Owner"
        },
        "temporary-secret"
      );

      try {
        await authService.googleAuth(fakeGoogleToken);
        expect.fail("Should have blocked auto-linking");
      } catch (err: any) {
        expect(err).toBeInstanceOf(UnauthorizedError);
        expect(err.code).toBe("ACCOUNT_EXISTS_LINKING_REQUIRED");
        expect(err.message).toContain("An account with this email already exists");
      }
    });

    it("Assigns restricted default role CASHIER to brand new Google accounts", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
      vi.spyOn(prisma.company, "findFirst").mockResolvedValue({ id: "comp-1", name: "MR Bilal" } as any);
      vi.spyOn(prisma.store, "findFirst").mockResolvedValue({ id: "store-1", name: "Store 1" } as any);
      vi.spyOn(prisma.role, "findFirst").mockResolvedValue({ id: "role-cashier", name: "CASHIER" } as any);

      let createdData: any = null;
      vi.spyOn(prisma.user, "create").mockImplementation(async (args: any) => {
        createdData = args.data;
        return {
          id: "new-google-user",
          ...args.data,
          role: { name: "CASHIER" },
          company: { name: "MR Bilal Boutique" },
          store: { name: "Main Store" },
          createdAt: new Date()
        } as any;
      });

      const fakeGoogleToken = jwt.sign(
        {
          sub: "google-sub-brand-new",
          email: "newcustomer@gmail.com",
          name: "New Customer"
        },
        "temporary-secret"
      );

      const res = await authService.googleAuth(fakeGoogleToken);
      expect(res.user.role).toBe("CASHIER");
      expect(createdData.googleId).toBe("google-sub-brand-new");
      expect(createdData.emailVerified).toBe(true);
    });
  });

  describe("4. Profile Security & Parameter Pollution Prevention", () => {
    it("Strictly ignores any attempt to modify role, companyId, or permissions via updateProfile", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: dummyUserId,
        name: "Cashier Bilal",
        phone: "12345",
        email: "bilal@mrbilal.com",
        passwordHash: samplePasswordHash,
        companyId: "company-original",
        storeId: "store-original",
        role: { name: "CASHIER" },
        company: { name: "MR Bilal Boutique" },
        store: { name: "Main Store" },
        emailVerified: true,
        createdAt: new Date()
      } as any);

      let updatePayload: any = null;
      vi.spyOn(prisma.user, "update").mockImplementation(async (args: any) => {
        updatePayload = args.data;
        return {
          id: dummyUserId,
          name: args.data.name || "Cashier Bilal",
          phone: args.data.phone || "12345",
          email: "bilal@mrbilal.com",
          role: { name: "CASHIER" },
          company: { name: "MR Bilal Boutique" },
          store: { name: "Main Store" },
          emailVerified: true,
          createdAt: new Date()
        } as any;
      });

      // Attempt privilege escalation and parameter pollution
      await userService.updateProfile(dummyUserId, {
        name: "Updated Name",
        phone: "+92 300 1234567",
        // @ts-ignore - passing unauthorized fields
        role: "SUPER_ADMIN",
        roleId: "hacked-role-id",
        companyId: "hacked-company",
        email: "hacked@example.com"
      });

      expect(updatePayload).toBeDefined();
      expect(updatePayload.name).toBe("Updated Name");
      expect(updatePayload.phone).toBe("+92 300 1234567");
      expect(updatePayload.role).toBeUndefined();
      expect(updatePayload.roleId).toBeUndefined();
      expect(updatePayload.companyId).toBeUndefined();
      expect(updatePayload.email).toBeUndefined();
    });

    it("Changing password requires correct current password and revokes all refresh tokens", async () => {
      vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
        id: dummyUserId,
        name: "Test User",
        email: "test@user.com",
        passwordHash: samplePasswordHash,
        role: { name: "CASHIER" },
        company: { name: "MR Bilal" },
        createdAt: new Date()
      } as any);

      const deleteManySpy = vi.spyOn(prisma.refreshToken, "deleteMany").mockResolvedValue({ count: 3 } as any);
      vi.spyOn(prisma.user, "update").mockResolvedValue({
        id: dummyUserId,
        name: "Test User",
        email: "test@user.com",
        role: { name: "CASHIER" },
        company: { name: "MR Bilal" },
        createdAt: new Date()
      } as any);

      // Incorrect current password must fail
      await expect(
        userService.updateProfile(dummyUserId, {
          currentPassword: "WrongPassword999!",
          newPassword: "BrandNewPassword123!"
        })
      ).rejects.toThrow("Incorrect current password");

      // Correct current password succeeds and deletes all user sessions
      await userService.updateProfile(dummyUserId, {
        currentPassword: "SecurePass@2026",
        newPassword: "BrandNewPassword123!"
      });

      expect(deleteManySpy).toHaveBeenCalledWith({
        where: { userId: dummyUserId }
      });
    });
  });

  describe("5. Two-Step Email Change Security", () => {
    it("Requires password reauth, ensures new email uniqueness, and sends OTP", async () => {
      vi.spyOn(prisma.user, "findUnique").mockImplementation(async (args: any) => {
        if (args.where.id === dummyUserId) {
          return {
            id: dummyUserId,
            name: "Bilal",
            email: "current@bilal.com",
            passwordHash: samplePasswordHash
          } as any;
        }
        if (args.where.email === "taken@bilal.com") {
          return { id: "other-user-id", email: "taken@bilal.com" } as any;
        }
        return null;
      });

      // Cannot change to existing email
      await expect(
        userService.requestEmailChange(dummyUserId, "taken@bilal.com", "SecurePass@2026")
      ).rejects.toThrow("already in use by another account");

      // Cannot change without current password
      await expect(
        userService.requestEmailChange(dummyUserId, "fresh@bilal.com", "WrongPass")
      ).rejects.toThrow("Incorrect current password");

      // Valid request stores in pendingEmail and sets verification hash
      let updateData: any = null;
      vi.spyOn(prisma.user, "update").mockImplementation(async (args: any) => {
        updateData = args.data;
        return {} as any;
      });

      const res = await userService.requestEmailChange(dummyUserId, "fresh@bilal.com", "SecurePass@2026");
      expect(res.success).toBe(true);
      expect(updateData.pendingEmail).toBe("fresh@bilal.com");
      expect(updateData.verificationTokenHash).toBeDefined();
    });
  });

  describe("6. Avatar File Magic Byte Validation & Cleanup", () => {
    it("Validates authentic JPEG magic bytes (FF D8 FF)", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const validation = storageService.validateImageMagicBytes(jpegBuffer);
      expect(validation.isValid).toBe(true);
      expect(validation.mimeType).toBe("image/jpeg");
    });

    it("Validates authentic PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)", () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const validation = storageService.validateImageMagicBytes(pngBuffer);
      expect(validation.isValid).toBe(true);
      expect(validation.mimeType).toBe("image/png");
    });

    it("Rejects spoofed files (e.g. executable disguised as PNG or JPG)", async () => {
      // An executable or HTML script disguised as image
      const fakeBuffer = Buffer.from("<html><script>alert('xss')</script></html>");
      const validation = storageService.validateImageMagicBytes(fakeBuffer);
      expect(validation.isValid).toBe(false);

      await expect(
        storageService.saveAvatar("user-1", fakeBuffer, "avatar.png")
      ).rejects.toThrow("Invalid file format");
    });
  });

  describe("7. Refresh Token Rotation & Replay Attack Prevention", () => {
    it("Deletes used refresh token and stores hash of newly rotated refresh token", async () => {
      const initialRefreshToken = jwt.sign(
        {
          id: dummyUserId,
          companyId: "c1",
          role: "CASHIER",
          email: "test@user.com"
        },
        config.jwt.refreshSecret,
        { expiresIn: "7d" }
      );

      const initialHash = hashToken(initialRefreshToken);

      vi.spyOn(prisma.refreshToken, "findFirst").mockResolvedValue({
        id: "refresh-db-entry-1",
        userId: dummyUserId,
        tokenHash: initialHash,
        expiresAt: new Date(Date.now() + 1000000)
      } as any);

      const deleteSpy = vi.spyOn(prisma.refreshToken, "delete").mockResolvedValue({} as any);
      const createSpy = vi.spyOn(prisma.refreshToken, "create").mockResolvedValue({} as any);

      const result = await authService.refreshToken(initialRefreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(initialRefreshToken);

      // Deleted old token
      expect(deleteSpy).toHaveBeenCalledWith({
        where: { id: "refresh-db-entry-1" }
      });

      // Created new rotated token
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: dummyUserId,
            tokenHash: hashToken(result.refreshToken)
          })
        })
      );
    });
  });
});
