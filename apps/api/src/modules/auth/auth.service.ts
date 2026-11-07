import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@dreamspos/database";
import { config } from "../../config";
import { LoginInput } from "@dreamspos/shared";
import { UserRole } from "@dreamspos/shared";

export class AuthService {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { role: true, company: true }
    });

    if (!user || !user.isActive) {
      throw new Error("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

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

    const refreshToken = jwt.sign(tokenPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any
    });

    return {
      user: {
        id: user.id,
        companyId: user.companyId,
        storeId: user.storeId,
        name: user.name,
        email: user.email,
        role: roleName,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString()
      },
      accessToken,
      refreshToken
    };
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

      const newAccessToken = jwt.sign(
        {
          id: payload.id,
          companyId: payload.companyId,
          storeId: payload.storeId,
          role: payload.role,
          email: payload.email
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn as any }
      );

      return { accessToken: newAccessToken };
    } catch {
      throw new Error("Invalid or expired refresh token");
    }
  }
}

export const authService = new AuthService();
