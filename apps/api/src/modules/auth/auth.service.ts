import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@dreamspos/database";
import { config } from "../../config";
import { LoginInput, UserRole } from "@dreamspos/shared";
import { UnauthorizedError, BadRequestError, NotFoundError } from "../../utils/errors";
import { emailService } from "../email/email.service";
import {
  OTP_CONFIG,
  generateNumericOtp,
  hashOtp,
  verifyOtpHash,
  hashToken
} from "../../utils/security";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  email: string;
  token: string;
}

export interface ResetPasswordInput {
  email: string;
  token: string;
  newPassword: string;
}

export class AuthService {
  private googleClient = new OAuth2Client(config.google.clientId || undefined);

  private async createSession(user: any) {
    const roleName = user.role.name as UserRole;
    const tokenPayload = {
      id: user.id,
      companyId: user.companyId,
      storeId: user.storeId,
      role: roleName,
      email: user.email
    };

    const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any
    });

    const refreshTokenPayload = {
      ...tokenPayload,
      jti: crypto.randomUUID()
    };

    const refreshToken = jwt.sign(refreshTokenPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any
    });

    // Store hashed refresh token in database for rotation and revocation
    const refreshTokenHash = hashToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshExpiresAt
      }
    });

    return {
      user: {
        id: user.id,
        companyId: user.companyId,
        companyName: user.company?.name || "MR Bilal Boutique",
        storeId: user.storeId,
        storeName: user.store?.name || "Main Store",
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: roleName,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString()
      },
      accessToken,
      refreshToken
    };
  }

  async login(input: LoginInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: true, company: true, store: true }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Auto-verify legacy admin account or system super admin to prevent lockouts
    if (!user.emailVerified && (normalizedEmail === "admin@dreamspos.com" || user.role.name === "SUPER_ADMIN")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      });
      user.emailVerified = true;
    }

    // Check email verification for accounts
    if (!user.emailVerified) {
      // Check cooldown before sending a fresh OTP
      const now = new Date();
      const lastSent = user.verificationSentAt ? user.verificationSentAt.getTime() : 0;
      const canSend = now.getTime() - lastSent >= OTP_CONFIG.RATE_LIMIT_COOLDOWN_MS;

      if (canSend) {
        const rawOtp = generateNumericOtp();
        const verificationTokenHash = hashOtp("verify", rawOtp);
        const verificationExpires = new Date(Date.now() + OTP_CONFIG.EXPIRATION_MS);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationTokenHash,
            verificationTokenExpires: verificationExpires,
            verificationAttempts: 0,
            verificationSentAt: now
          }
        });

        emailService.sendVerificationEmail(user.email, user.name, rawOtp).catch(() => {});
      }

      const error: any = new UnauthorizedError(
        "Please verify your email address before logging in. A verification code has been sent to your email."
      );
      error.requiresVerification = true;
      error.email = user.email;
      throw error;
    }

    return this.createSession(user);
  }

  async refreshToken(token: string) {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret) as {
        id: string;
        companyId: string;
        storeId?: string | null;
        role: UserRole;
        email: string;
      };

      const tokenHash = hashToken(token);
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          userId: payload.id,
          tokenHash
        }
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        if (storedToken) {
          await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        }
        throw new UnauthorizedError("Invalid or expired refresh token");
      }

      // Single-use token rotation: revoke used refresh token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });

      // Generate new pair
      const tokenPayload = {
        id: payload.id,
        companyId: payload.companyId,
        storeId: payload.storeId,
        role: payload.role,
        email: payload.email
      };

      const newAccessToken = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as any
      });

      const newRefreshToken = jwt.sign(
        {
          ...tokenPayload,
          jti: crypto.randomUUID()
        },
        config.jwt.refreshSecret,
        {
          expiresIn: config.jwt.refreshExpiresIn as any
        }
      );

      // Save new refresh token in DB
      await prisma.refreshToken.create({
        data: {
          userId: payload.id,
          tokenHash: hashToken(newRefreshToken),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }

  async register(input: RegisterInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedName = input.name.trim();

    if (!normalizedName) {
      throw new BadRequestError("Name is required");
    }

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new BadRequestError("A valid email address is required");
    }

    if (!input.password || input.password.length < 6) {
      throw new BadRequestError("Password must be at least 6 characters long");
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    const now = new Date();
    const rawOtp = generateNumericOtp();
    const verificationTokenHash = hashOtp("verify", rawOtp);
    const verificationExpires = new Date(Date.now() + OTP_CONFIG.EXPIRATION_MS);

    if (existing) {
      if (existing.emailVerified) {
        throw new BadRequestError("An account with this email already exists");
      }

      // Rate limit resending OTP
      if (
        existing.verificationSentAt &&
        now.getTime() - existing.verificationSentAt.getTime() < OTP_CONFIG.RATE_LIMIT_COOLDOWN_MS
      ) {
        throw new BadRequestError("Please wait 60 seconds before requesting a new verification code.");
      }

      // If user exists but is not verified, refresh verification token and update password
      const passwordHash = await bcrypt.hash(input.password, 10);
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: normalizedName,
          passwordHash,
          verificationTokenHash,
          verificationTokenExpires: verificationExpires,
          verificationAttempts: 0,
          verificationSentAt: now
        }
      });

      await emailService.sendVerificationEmail(normalizedEmail, normalizedName, rawOtp);

      return {
        requiresVerification: true,
        email: normalizedEmail,
        message: "A verification code has been sent to your email. Please verify to continue."
      };
    }

    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "MR Bilal Boutique",
          code: "MRB-01",
          email: "admin@mrbilal.com",
          currency: "USD"
        }
      });
    }

    let store = await prisma.store.findFirst({ where: { companyId: company.id } });
    if (!store) {
      store = await prisma.store.create({
        data: {
          name: "Main Boutique Store",
          code: "STORE-01",
          companyId: company.id
        }
      });
    }

    // Newly registered accounts get restricted role (CASHIER) by default
    let role = await prisma.role.findFirst({
      where: { name: "CASHIER" }
    });
    if (!role) {
      role = await prisma.role.findFirst({
        where: { name: { in: ["SUPER_ADMIN", "STORE_MANAGER"] } }
      });
      if (!role) {
        role = await prisma.role.create({
          data: {
            name: "SUPER_ADMIN",
            description: "Super Administrator / Owner",
            isSystem: true
          }
        });
      }
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
        companyId: company.id,
        storeId: store.id,
        roleId: role.id,
        emailVerified: false,
        verificationTokenHash,
        verificationTokenExpires: verificationExpires,
        verificationAttempts: 0,
        verificationSentAt: now,
        isActive: true
      }
    });

    // Send verification email with raw OTP
    await emailService.sendVerificationEmail(normalizedEmail, normalizedName, rawOtp);

    return {
      requiresVerification: true,
      email: normalizedEmail,
      message: "Registration successful. Please verify your email with the code sent to your inbox."
    };
  }

  async verifyEmail(input: VerifyEmailInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const token = input.token.trim();

    if (!normalizedEmail || !token) {
      throw new BadRequestError("Email and verification code are required");
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: true, company: true, store: true }
    });

    if (!user) {
      throw new NotFoundError("Account not found");
    }

    if (user.emailVerified) {
      return {
        alreadyVerified: true,
        message: "Email is already verified. You can sign in now."
      };
    }

    // Check attempt lockout limit (max 5 attempts)
    if (user.verificationAttempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationTokenHash: null,
          verificationTokenExpires: null
        }
      });
      throw new BadRequestError("Too many failed attempts. This code has been invalidated. Please request a new verification code.");
    }

    // Increment attempts count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationAttempts: { increment: 1 }
      }
    });

    // Check expiration (15 minutes)
    if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
      throw new BadRequestError("Verification code has expired. Please request a new one.");
    }

    // Validate OTP hash
    const isValid = verifyOtpHash("verify", token, user.verificationTokenHash);
    if (!isValid) {
      throw new BadRequestError("Invalid verification code");
    }

    // Mark as verified, clear verification hash and reset attempts
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationTokenHash: null,
        verificationTokenExpires: null,
        verificationAttempts: 0
      },
      include: { role: true, company: true, store: true }
    });

    const session = await this.createSession(updatedUser);

    return {
      success: true,
      message: "Email verified successfully! You are now logged in.",
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken
    };
  }

  async resendVerification(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestError("Email address is required");
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      // Don't leak user existence to prevent account enumeration
      return {
        message: "If an unverified account with this email exists, a new verification code has been sent."
      };
    }

    if (user.emailVerified) {
      return {
        alreadyVerified: true,
        message: "Email is already verified. You can sign in directly."
      };
    }

    // Check 60-second rate-limiting cooldown
    const now = new Date();
    if (
      user.verificationSentAt &&
      now.getTime() - user.verificationSentAt.getTime() < OTP_CONFIG.RATE_LIMIT_COOLDOWN_MS
    ) {
      throw new BadRequestError("Please wait 60 seconds before requesting another verification code.");
    }

    const rawOtp = generateNumericOtp();
    const verificationTokenHash = hashOtp("verify", rawOtp);
    const verificationExpires = new Date(Date.now() + OTP_CONFIG.EXPIRATION_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationTokenHash,
        verificationTokenExpires: verificationExpires,
        verificationAttempts: 0,
        verificationSentAt: now
      }
    });

    await emailService.sendVerificationEmail(normalizedEmail, user.name, rawOtp);

    return {
      message: "A new verification code has been sent to your email."
    };
  }

  async googleAuth(credential: string) {
    if (!credential) {
      throw new BadRequestError("Google credential is required");
    }

    let payload: any = null;

    try {
      if (config.google.clientId) {
        const ticket = await this.googleClient.verifyIdToken({
          idToken: credential,
          audience: config.google.clientId
        });
        payload = ticket.getPayload();
      } else {
        // Fallback decoder when Google client ID is not yet configured in local env
        const decoded = jwt.decode(credential) as any;
        if (decoded && decoded.email) {
          payload = decoded;
        } else {
          throw new Error("Unable to decode Google token");
        }
      }
    } catch (err: any) {
      throw new UnauthorizedError("Google authentication failed: " + (err?.message || "Invalid token"));
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedError("Google token does not contain a valid email address");
    }

    const googleId = payload.sub as string;
    const email = payload.email.toLowerCase();
    const name = payload.name || payload.given_name || "Google User";
    const picture = payload.picture || null;

    // 1. Look up user by Google ID (sub)
    let user = await prisma.user.findUnique({
      where: { googleId },
      include: { role: true, company: true, store: true }
    });

    if (user) {
      // Existing verified Google user - log in securely
      if (!user.isActive) {
        throw new UnauthorizedError("User account is deactivated");
      }
      return this.createSession(user);
    }

    // 2. User not found by googleId. Check if user with this email already exists
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      include: { role: true, company: true, store: true }
    });

    if (existingByEmail) {
      // SECURITY ENFORCEMENT:
      // Do NOT automatically link account solely because emails match!
      // Require the user to sign in with password first and link Google via Settings.
      const error: any = new UnauthorizedError(
        "An account with this email already exists. Please sign in with your email and password, then link your Google account in Settings."
      );
      error.code = "ACCOUNT_EXISTS_LINKING_REQUIRED";
      throw error;
    }

    // 3. Brand new user created via Google:
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "MR Bilal Boutique",
          code: "MRB-01",
          email: "admin@mrbilal.com",
          currency: "USD"
        }
      });
    }

    let store = await prisma.store.findFirst({ where: { companyId: company.id } });
    if (!store) {
      store = await prisma.store.create({
        data: {
          name: "Main Boutique Store",
          code: "STORE-01",
          companyId: company.id
        }
      });
    }

    // Assign restricted default role CASHIER to new Google sign-ups
    let role = await prisma.role.findFirst({
      where: { name: "CASHIER" }
    });
    if (!role) {
      role = await prisma.role.findFirst({
        where: { name: { in: ["SUPER_ADMIN", "STORE_MANAGER"] } }
      });
      if (!role) {
        role = await prisma.role.create({
          data: {
            name: "SUPER_ADMIN",
            description: "Super Administrator / Owner",
            isSystem: true
          }
        });
      }
    }

    const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: randomPasswordHash,
        companyId: company.id,
        storeId: store.id,
        roleId: role.id,
        googleId,
        avatar: picture,
        emailVerified: true, // Email ownership verified by Google ID token
        isActive: true
      },
      include: { role: true, company: true, store: true }
    });

    return this.createSession(newUser);
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestError("Email address is required");
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (user && user.isActive) {
      const now = new Date();

      // Enforce 60s cooldown
      if (
        user.resetSentAt &&
        now.getTime() - user.resetSentAt.getTime() < OTP_CONFIG.RATE_LIMIT_COOLDOWN_MS
      ) {
        // Return generic response without resending to prevent spamming
        return {
          message: "If an account with that email exists, password reset instructions have been sent."
        };
      }

      const rawOtp = generateNumericOtp();
      const resetPasswordTokenHash = hashOtp("reset", rawOtp);
      const resetExpires = new Date(Date.now() + OTP_CONFIG.EXPIRATION_MS);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordTokenHash,
          resetPasswordExpires: resetExpires,
          resetAttempts: 0,
          resetSentAt: now
        }
      });

      await emailService.sendPasswordResetEmail(user.email, user.name, rawOtp);
    }

    // Always return generic message to prevent account enumeration
    return {
      message: "If an account with that email exists, password reset instructions have been sent."
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const token = input.token.trim();

    if (!normalizedEmail || !token || !input.newPassword) {
      throw new BadRequestError("Email, reset code, and new password are required");
    }

    if (input.newPassword.length < 6) {
      throw new BadRequestError("New password must be at least 6 characters long");
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      throw new BadRequestError("Invalid or expired password reset code");
    }

    // Check attempts limit (max 5)
    if (user.resetAttempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordTokenHash: null,
          resetPasswordExpires: null
        }
      });
      throw new BadRequestError("Too many failed attempts. This reset code has been invalidated. Please request a new one.");
    }

    // Increment attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetAttempts: { increment: 1 }
      }
    });

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestError("Password reset code has expired. Please request a new one.");
    }

    const isValid = verifyOtpHash("reset", token, user.resetPasswordTokenHash);
    if (!isValid) {
      throw new BadRequestError("Invalid password reset code");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordTokenHash: null,
        resetPasswordExpires: null,
        resetAttempts: 0
      }
    });

    // Revoke all existing sessions / refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id }
    });

    // Send security notification
    emailService.sendPasswordChangedEmail(user.email, user.name).catch(() => {});

    return {
      message: "Password reset successful! You can now sign in with your new password."
    };
  }

  async logout(token?: string) {
    if (token) {
      const tokenHash = hashToken(token);
      await prisma.refreshToken.deleteMany({
        where: { tokenHash }
      });
    }
    return { success: true };
  }
}

export const authService = new AuthService();
