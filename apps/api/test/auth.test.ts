import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "../src/modules/auth/auth.service";
import { prisma } from "@dreamspos/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../src/config";
import { AppError, UnauthorizedError } from "../src/utils/errors";
import { errorHandler } from "../src/middleware/errorHandler";

describe("AuthService & Authentication Error Handling", () => {
  const mockUser = {
    id: "user-123",
    companyId: "company-123",
    storeId: "store-123",
    name: "Admin Manager",
    email: "admin@dreamspos.com",
    passwordHash: "",
    isActive: true,
    role: { name: "SUPER_ADMIN" },
    company: { id: "company-123", name: "Dreams Apparel" },
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    avatar: null
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    mockUser.passwordHash = await bcrypt.hash("Admin@12345", 10);
  });

  it("1. Successfully logs in with valid credentials and returns JWT tokens", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser as any);

    const result = await authService.login({
      email: "admin@dreamspos.com",
      password: "Admin@12345"
    });

    expect(result).toBeDefined();
    expect(result.user.email).toBe("admin@dreamspos.com");
    expect(result.user.role).toBe("SUPER_ADMIN");
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    const decoded = jwt.verify(result.accessToken, config.jwt.secret) as any;
    expect(decoded.id).toBe(mockUser.id);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.role).toBe("SUPER_ADMIN");
  });

  it("2. Fails login with invalid password and throws UnauthorizedError (401)", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser as any);

    await expect(
      authService.login({
        email: "admin@dreamspos.com",
        password: "WrongPassword123"
      })
    ).rejects.toThrow("Invalid email or password");

    try {
      await authService.login({
        email: "admin@dreamspos.com",
        password: "WrongPassword123"
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
    }
  });

  it("3. Fails login when user does not exist and throws UnauthorizedError (401)", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    try {
      await authService.login({
        email: "nonexistent@dreamspos.com",
        password: "Admin@12345"
      });
      expect.fail("Should have thrown UnauthorizedError");
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe("Invalid email or password");
    }
  });

  it("4. Fails login when user is deactivated (isActive = false)", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      ...mockUser,
      isActive: false
    } as any);

    try {
      await authService.login({
        email: "admin@dreamspos.com",
        password: "Admin@12345"
      });
      expect.fail("Should have thrown UnauthorizedError");
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe("Invalid email or password");
    }
  });

  it("5. Refreshes token successfully with valid refresh token", async () => {
    const validRefreshToken = jwt.sign(
      {
        id: mockUser.id,
        companyId: mockUser.companyId,
        storeId: mockUser.storeId,
        role: "SUPER_ADMIN",
        email: mockUser.email
      },
      config.jwt.refreshSecret,
      { expiresIn: "7d" }
    );

    const result = await authService.refreshToken(validRefreshToken);
    expect(result.accessToken).toBeDefined();

    const decoded = jwt.verify(result.accessToken, config.jwt.secret) as any;
    expect(decoded.id).toBe(mockUser.id);
  });

  it("6. Fails refresh with invalid or forged refresh token with status 401", async () => {
    try {
      await authService.refreshToken("invalid-token-string");
      expect.fail("Should have thrown UnauthorizedError");
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe("Invalid or expired refresh token");
    }
  });

  it("7. Central error handler maps AppError to exact HTTP status code without 500 fallback", () => {
    const mockReq = { method: "POST", originalUrl: "/api/auth/login" } as any;
    let responseStatus = 0;
    let responseBody: any = null;

    const mockRes = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(body: any) {
        responseBody = body;
        return this;
      }
    } as any;

    const unauthErr = new UnauthorizedError("Invalid email or password");
    errorHandler(unauthErr, mockReq, mockRes, (() => {}) as any);

    expect(responseStatus).toBe(401);
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toBe("Invalid email or password");
  });
});
