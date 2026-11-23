import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { EventEmitter } from "events";
import { config } from "../src/config";
import { UserRole } from "@dreamspos/shared";
import { productRouter } from "../src/modules/products/product.routes";
import { productController } from "../src/modules/products/product.controller";
import { storageService } from "../src/modules/storage/storage.service";

// Minimal valid 1x1 PNG buffer (authentic PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A)
const VALID_PNG_BUFFER = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c49444154789c63f80f00000101000518d84e0000000049454e44ae426082",
  "hex"
);

function runRouter(
  router: any,
  method: string,
  urlPath: string,
  opts: { headers?: Record<string, string>; body?: any } = {}
) {
  return new Promise<{ status: number; body: any }>((resolve) => {
    const req: any = {
      method: method.toUpperCase(),
      url: urlPath,
      originalUrl: urlPath,
      path: urlPath,
      headers: opts.headers || {},
      body: opts.body || {},
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
      if (err) {
        resolve({ status: err.statusCode || 500, body: { success: false, message: err.message } });
      } else {
        resolve({ status: 404, body: { message: "Not Found" } });
      }
    });
  });
}

describe("Product Image Upload & Persistence Verification", () => {
  const createdFiles: string[] = [];
  const companyA = "aaaa1111-1111-4111-8111-111111111111";

  const cashierToken = jwt.sign(
    { id: "u-cashier", companyId: companyA, role: UserRole.CASHIER, email: "cashier@test.local" },
    config.jwt.secret
  );

  afterEach(async () => {
    for (const filePath of createdFiles.splice(0)) {
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch {
        // ignore cleanup error
      }
    }
  });

  it("1. Rejects unauthenticated (401) and CASHIER (403) product image uploads", async () => {
    const unauth = await runRouter(productRouter, "POST", "/upload-image");
    expect(unauth.status).toBe(401);

    const forbidden = await runRouter(productRouter, "POST", "/upload-image", {
      headers: { authorization: `Bearer ${cashierToken}` },
    });
    expect(forbidden.status).toBe(403);
  });

  it("2. Rejects invalid / spoofed non-image files with 400", async () => {
    const fakeBuffer = Buffer.from("not-a-real-image-file-content-12345");
    await expect(
      storageService.saveProductImage(companyA, fakeBuffer, "spoof.png")
    ).rejects.toThrow(/Invalid file format/i);
  });

  it("3. Uploads valid PNG via productController.uploadImage, returns accurate provider + URL, and persists readable PNG bytes", async () => {
    const req: any = {
      user: { id: "u-admin", companyId: companyA, role: UserRole.ADMIN, email: "admin@test.local" },
      file: {
        buffer: VALID_PNG_BUFFER,
        originalname: "polo-shirt.png",
        mimetype: "image/png",
      },
    };

    let statusCode = 0;
    let payload: any = null;
    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: any) {
        payload = body;
        return this;
      },
    };

    await productController.uploadImage(req, res, (err: any) => {
      if (err) throw err;
    });

    expect(statusCode).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.url).toBeTruthy();
    expect(["local", "cloudinary"]).toContain(payload.data.provider);

    if (payload.data.provider === "local") {
      const url: string = payload.data.url;
      expect(url.startsWith("/uploads/products/")).toBe(true);

      const diskPath = path.resolve(process.cwd(), "uploads", "products", path.basename(url));
      createdFiles.push(diskPath);
      expect(fs.existsSync(diskPath)).toBe(true);

      const savedBytes = await fs.promises.readFile(diskPath);
      expect(savedBytes.equals(VALID_PNG_BUFFER)).toBe(true);
    }
  });
});
