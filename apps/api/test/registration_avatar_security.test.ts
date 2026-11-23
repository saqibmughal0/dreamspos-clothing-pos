import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import { prisma } from "@dreamspos/database";
import { UserRole } from "@dreamspos/shared";
import { userRouter } from "../src/modules/users/user.routes";
import { userController } from "../src/modules/users/user.controller";
import { storageService } from "../src/modules/storage/storage.service";

const VALID_PNG_BUFFER = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c49444154789c63f80f00000101000518d84e0000000049454e44ae426082",
  "hex"
);

function runRouter(router: any, method: string, urlPath: string) {
  return new Promise<{ status: number; body: any }>((resolve) => {
    const req: any = {
      method: method.toUpperCase(),
      url: urlPath,
      originalUrl: urlPath,
      path: urlPath,
      headers: {},
      body: {},
      query: {},
      params: {},
    };
    const res: any = new EventEmitter();
    res.statusCode = 200;
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data: any) => {
      resolve({ status: res.statusCode, body: data });
      return res;
    };
    res.send = (data: any) => {
      resolve({ status: res.statusCode, body: data });
      return res;
    };

    router.handle(req, res, (err: any) => {
      if (err) resolve({ status: err.statusCode || 500, body: { success: false, message: err.message } });
      else resolve({ status: 404, body: { message: "Not Found" } });
    });
  });
}

describe("Registration & Profile Avatar Security Verification", () => {
  const createdFiles: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    for (const f of createdFiles.splice(0)) {
      try {
        if (fs.existsSync(f)) await fs.promises.unlink(f);
      } catch {
        // ignore
      }
    }
  });

  it("1. Rejects unauthenticated avatar upload (401) — no public upload endpoint", async () => {
    const res = await runRouter(userRouter, "POST", "/me/avatar");
    expect(res.status).toBe(401);
  });

  it("2. Rejects oversized (> 2MB) and spoofed non-image avatar files", async () => {
    const oversized = Buffer.alloc(2 * 1024 * 1024 + 100, 0);
    await expect(
      storageService.saveAvatar("u-new-verified", oversized, "huge.png")
    ).rejects.toThrow(/2MB/i);

    const spoofed = Buffer.from("MZ-not-a-valid-image-file-payload");
    await expect(
      storageService.saveAvatar("u-new-verified", spoofed, "fake.jpg")
    ).rejects.toThrow(/Invalid file format/i);
  });

  it("3. Associates uploaded avatar strictly with authenticated req.user.id (ignores spoofed body userId)", async () => {
    const verifiedUserId = "u-verified-owner";
    const otherUserId = "u-someone-else";

    vi.spyOn(prisma.user, "findUnique").mockResolvedValueOnce({
      id: verifiedUserId,
      avatar: null,
    } as any);

    const updateSpy = vi.spyOn(prisma.user, "update").mockImplementation(async (args: any) => {
      return {
        id: args.where.id,
        name: "Verified User",
        email: "verified@mrbilal.com",
        avatar: args.data.avatar,
        role: { name: UserRole.CASHIER },
        company: { name: "MR Bilal" },
        store: { name: "Main Store" },
      } as any;
    });

    const req: any = {
      user: { id: verifiedUserId, companyId: "comp-1", role: UserRole.CASHIER, email: "verified@mrbilal.com" },
      body: { userId: otherUserId }, // spoofed attempt to overwrite another user
      file: {
        buffer: VALID_PNG_BUFFER,
        originalname: "profile.png",
        mimetype: "image/png",
      },
    };

    let statusCode = 0;
    let body: any = null;
    const res: any = {
      status(c: number) {
        statusCode = c;
        return this;
      },
      json(b: any) {
        body = b;
        return this;
      },
    };

    await userController.uploadAvatar(req, res, (err: any) => {
      if (err) throw err;
    });

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.avatar).toBeTruthy();
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: verifiedUserId },
      })
    );

    if (String(body.data.avatar).startsWith("/uploads/avatars/")) {
      const diskPath = path.resolve(process.cwd(), "uploads", "avatars", path.basename(body.data.avatar));
      createdFiles.push(diskPath);
      expect(fs.existsSync(diskPath)).toBe(true);
    }
  });
});
