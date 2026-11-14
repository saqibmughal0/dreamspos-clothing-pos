import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@dreamspos/database";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../utils/errors";
import { emailService } from "../email/email.service";
import { storageService } from "../storage/storage.service";
import { config } from "../../config";
import {
  OTP_CONFIG,
  generateNumericOtp,
  hashOtp,
  verifyOtpHash
} from "../../utils/security";

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}

export class UserService {
  private googleClient = new OAuth2Client(config.google.clientId || undefined);

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        company: true,
        store: true
      }
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      pendingEmail: user.pendingEmail,
      phone: user.phone || "",
      avatar: user.avatar,
      role: user.role.name,
      companyId: user.companyId,
      companyName: user.company?.name || "MR Bilal Boutique",
      storeId: user.storeId,
      storeName: user.store?.name || "Main Store",
      emailVerified: user.emailVerified,
      googleLinked: !!user.googleId,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString()
    };
  }

  /**
   * Strictly whitelisted profile update preventing modification of role, companyId, permissions, or email directly.
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, company: true, store: true }
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updateData: any = {};

    // Strictly whitelist editable fields
    if (typeof input.name === "string" && input.name.trim().length > 0) {
      updateData.name = input.name.trim();
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone.trim();
    }

    // Handle password change if requested
    if (input.newPassword) {
      if (!input.currentPassword) {
        throw new BadRequestError("Current password is required to set a new password");
      }

      const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestError("Incorrect current password");
      }

      if (input.newPassword.length < 6) {
        throw new BadRequestError("New password must be at least 6 characters long");
      }

      updateData.passwordHash = await bcrypt.hash(input.newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true,
        company: true,
        store: true
      }
    });

    // If password was changed, revoke all user refresh tokens and send security notification
    if (input.newPassword) {
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });
      emailService.sendPasswordChangedEmail(user.email, updatedUser.name).catch(() => {});
    }

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      pendingEmail: updatedUser.pendingEmail,
      phone: updatedUser.phone || "",
      avatar: updatedUser.avatar,
      role: updatedUser.role.name,
      companyId: updatedUser.companyId,
      companyName: updatedUser.company?.name || "MR Bilal Boutique",
      storeId: updatedUser.storeId,
      storeName: updatedUser.store?.name || "Main Store",
      emailVerified: updatedUser.emailVerified,
      googleLinked: !!updatedUser.googleId,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt.toISOString()
    };
  }

  /**
   * Request email change: verifies current password, validates new email uniqueness, sends OTP to new address
   */
  async requestEmailChange(userId: string, newEmail: string, currentPassword?: string) {
    const normalizedEmail = newEmail.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new BadRequestError("A valid new email address is required");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.email.toLowerCase() === normalizedEmail) {
      throw new BadRequestError("New email address cannot be identical to your current email");
    }

    // Require current password for security verification
    if (!currentPassword) {
      throw new BadRequestError("Current password is required to initiate an email change");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError("Incorrect current password");
    }

    // Check if new email is already registered by another account
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing && existing.id !== userId) {
      throw new BadRequestError("This email address is already in use by another account");
    }

    // Rate limit OTP requests
    const now = new Date();
    if (
      user.verificationSentAt &&
      now.getTime() - user.verificationSentAt.getTime() < OTP_CONFIG.RATE_LIMIT_COOLDOWN_MS
    ) {
      throw new BadRequestError("Please wait 60 seconds before requesting another verification code.");
    }

    const rawOtp = generateNumericOtp();
    const tokenHash = hashOtp("email-change", rawOtp);
    const expires = new Date(Date.now() + OTP_CONFIG.EXPIRATION_MS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: normalizedEmail,
        verificationTokenHash: tokenHash,
        verificationTokenExpires: expires,
        verificationAttempts: 0,
        verificationSentAt: now
      }
    });

    await emailService.sendEmailChangeOtp(normalizedEmail, user.name, rawOtp);

    return {
      success: true,
      pendingEmail: normalizedEmail,
      message: `A verification code has been sent to ${normalizedEmail}. Please enter the code to confirm the email change.`
    };
  }

  /**
   * Verify email change OTP and update user's email address
   */
  async verifyEmailChange(userId: string, otp: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.pendingEmail) {
      throw new BadRequestError("No pending email change request found");
    }

    if (user.verificationAttempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          pendingEmail: null,
          verificationTokenHash: null,
          verificationTokenExpires: null
        }
      });
      throw new BadRequestError("Too many failed attempts. The email change request has been cancelled.");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { verificationAttempts: { increment: 1 } }
    });

    if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
      throw new BadRequestError("Verification code has expired. Please initiate email change again.");
    }

    const isValid = verifyOtpHash("email-change", otp.trim(), user.verificationTokenHash);
    if (!isValid) {
      throw new BadRequestError("Invalid verification code");
    }

    // Commit email change
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: user.pendingEmail,
        emailVerified: true,
        pendingEmail: null,
        verificationTokenHash: null,
        verificationTokenExpires: null,
        verificationAttempts: 0
      }
    });

    return {
      success: true,
      email: updatedUser.email,
      message: "Email address updated successfully!"
    };
  }

  /**
   * Link Google account securely for an already authenticated user
   */
  async linkGoogleAccount(userId: string, credential: string) {
    let payload: any = null;

    try {
      if (config.google.clientId) {
        const ticket = await this.googleClient.verifyIdToken({
          idToken: credential,
          audience: config.google.clientId
        });
        payload = ticket.getPayload();
      } else {
        payload = jwt.decode(credential) as any;
      }
    } catch (err: any) {
      throw new BadRequestError("Invalid Google credential: " + err.message);
    }

    if (!payload || !payload.sub) {
      throw new BadRequestError("Invalid Google token payload");
    }

    const googleId = payload.sub as string;

    // Check if another account is already linked to this Google ID
    const existing = await prisma.user.findUnique({
      where: { googleId }
    });

    if (existing && existing.id !== userId) {
      throw new BadRequestError("This Google account is already linked to another user account");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { googleId }
    });

    return {
      success: true,
      googleLinked: true,
      message: "Google account successfully linked!"
    };
  }

  /**
   * Unlink Google account
   */
  async unlinkGoogleAccount(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.googleId) {
      throw new BadRequestError("No Google account is currently linked");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { googleId: null }
    });

    return {
      success: true,
      googleLinked: false,
      message: "Google account unlinked successfully."
    };
  }

  /**
   * Upload and set profile avatar with validation and previous file cleanup
   */
  async updateAvatar(userId: string, buffer: Buffer, originalName: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Delete existing avatar file if stored
    if (user.avatar) {
      await storageService.deleteAvatar(user.avatar);
    }

    // Store new avatar through modular storage service
    const stored = await storageService.saveAvatar(userId, buffer, originalName);

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: stored.url }
    });

    return {
      avatar: stored.url,
      provider: stored.provider
    };
  }

  /**
   * Remove profile avatar and delete underlying stored file
   */
  async removeAvatar(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user?.avatar) {
      await storageService.deleteAvatar(user.avatar);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null }
    });

    return {
      avatar: null
    };
  }
}

export const userService = new UserService();
