import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@dreamspos/database";
import { config } from "../../config";
import { LoginInput } from "@dreamspos/shared";
import { UserRole } from "@dreamspos/shared";
import { UnauthorizedError, BadRequestError } from "../../utils/errors";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export class AuthService {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { role: true, company: true }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
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
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }

  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email }
    });
    if (existing) {
      throw new BadRequestError("An account with this email already exists");
    }

    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "Dreams Retail",
          code: "DREAMS-01",
          email: "admin@dreamspos.com",
          currency: "USD"
        }
      });
    }

    let store = await prisma.store.findFirst({ where: { companyId: company.id } });
    if (!store) {
      store = await prisma.store.create({
        data: {
          name: "Main Retail Store",
          code: "STORE-01",
          companyId: company.id
        }
      });
    }

    let role = await prisma.role.findFirst({
      where: { name: { in: ["SUPER_ADMIN", "STORE_MANAGER", "CASHIER"] } }
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

    const passwordHash = await bcrypt.hash(input.password, 10);
    await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        companyId: company.id,
        storeId: store.id,
        roleId: role.id,
        isActive: true
      }
    });

    return this.login({ email: input.email, password: input.password });
  }
}

export const authService = new AuthService();
