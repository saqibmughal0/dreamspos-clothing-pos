import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";

// ── Cloudinary mock (must be defined BEFORE StorageService is imported) ──────
vi.mock("cloudinary", () => {
  const uploadStreamMock = vi.fn();
  return {
    v2: {
      config: vi.fn(),
      uploader: {
        upload_stream: uploadStreamMock,
        destroy: vi.fn().mockResolvedValue({ result: "ok" })
      }
    }
  };
});

import { v2 as cloudinaryMock } from "cloudinary";
import { StorageService } from "../src/modules/storage/storage.service";
import { BadRequestError, AppError } from "../src/utils/errors";

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeJpegBuffer(size = 100): Buffer {
  const buf = Buffer.alloc(size, 0);
  buf[0] = 0xff; buf[1] = 0xd8; buf[2] = 0xff;
  return buf;
}

function makePngBuffer(size = 100): Buffer {
  const buf = Buffer.alloc(size, 0);
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].forEach((b, i) => { buf[i] = b; });
  return buf;
}

function makeWebpBuffer(size = 20): Buffer {
  const buf = Buffer.alloc(size, 0);
  Buffer.from("RIFF").copy(buf, 0);
  Buffer.from("WEBP").copy(buf, 8);
  return buf;
}

function makeInvalidBuffer(): Buffer {
  return Buffer.from("%PDF-1.4 fake");
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("StorageService — Avatar Upload (B1)", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.restoreAllMocks();
    originalEnv = { ...process.env };
    // Reset cloudinary mock state
    vi.mocked(cloudinaryMock.config).mockReturnValue({} as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ── 1. Magic-byte validation ────────────────────────────────────────────────
  describe("validateImageMagicBytes", () => {
    it("accepts a valid JPEG buffer", () => {
      const svc = new StorageService();
      const result = svc.validateImageMagicBytes(makeJpegBuffer());
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.extension).toBe(".jpg");
    });

    it("accepts a valid PNG buffer", () => {
      const svc = new StorageService();
      const result = svc.validateImageMagicBytes(makePngBuffer());
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe("image/png");
      expect(result.extension).toBe(".png");
    });

    it("accepts a valid WebP buffer", () => {
      const svc = new StorageService();
      const result = svc.validateImageMagicBytes(makeWebpBuffer());
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe("image/webp");
      expect(result.extension).toBe(".webp");
    });

    it("rejects a PDF buffer", () => {
      const svc = new StorageService();
      const result = svc.validateImageMagicBytes(makeInvalidBuffer());
      expect(result.isValid).toBe(false);
    });

    it("rejects a buffer shorter than 12 bytes", () => {
      const svc = new StorageService();
      const result = svc.validateImageMagicBytes(Buffer.from([0xff, 0xd8]));
      expect(result.isValid).toBe(false);
    });
  });

  // ── 2. saveAvatar — size / format guards ───────────────────────────────────
  describe("saveAvatar — validation", () => {
    it("throws BadRequestError when buffer exceeds 2MB", async () => {
      const svc = new StorageService();
      const oversized = Buffer.alloc(2 * 1024 * 1024 + 1, 0xff);
      await expect(svc.saveAvatar("user-1", oversized, "pic.jpg")).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError for invalid magic bytes", async () => {
      const svc = new StorageService();
      await expect(svc.saveAvatar("user-1", makeInvalidBuffer(), "file.txt")).rejects.toThrow(
        BadRequestError
      );
    });
  });

  // ── 3. saveAvatar — production without cloud storage ───────────────────────
  describe("saveAvatar — production environment", () => {
    it("throws AppError 503 when CLOUDINARY_URL is not set in production", async () => {
      delete process.env.CLOUDINARY_URL;
      process.env.NODE_ENV = "production";

      // No config side-effect: cloudinary.config returns empty object
      vi.mocked(cloudinaryMock.config).mockReturnValue({} as any);

      const svc = new StorageService();
      const err = await svc.saveAvatar("user-1", makeJpegBuffer(), "pic.jpg").catch((e) => e);
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(503);
    });

    it("throws AppError 503 when Cloudinary upload fails in production", async () => {
      process.env.CLOUDINARY_URL = "cloudinary://key:secret@cloud";
      process.env.NODE_ENV = "production";

      // Make config return complete config so cloudinaryConfigured = true
      vi.mocked(cloudinaryMock.config).mockReturnValue({
        cloud_name: "cloud",
        api_key: "key",
        api_secret: "secret"
      } as any);

      // Simulate upload failure
      vi.mocked(cloudinaryMock.uploader.upload_stream).mockImplementation(
        (_opts: any, cb: any) => {
          const passthrough = { end: () => cb(new Error("Network error"), null) };
          return passthrough as any;
        }
      );

      const svc = new StorageService();
      const err = await svc.saveAvatar("user-1", makeJpegBuffer(), "pic.jpg").catch((e) => e);
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(503);
    });
  });

  // ── 4. saveAvatar — development local fallback ─────────────────────────────
  describe("saveAvatar — dev local fallback", () => {
    it("saves file locally in dev when CLOUDINARY_URL is not set", async () => {
      delete process.env.CLOUDINARY_URL;
      process.env.NODE_ENV = "test";

      vi.mocked(cloudinaryMock.config).mockReturnValue({} as any);

      // Stub fs operations so we don't write to disk
      const existsSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
      const writeSpy = vi.spyOn(fs.promises, "writeFile").mockResolvedValue(undefined);

      const svc = new StorageService();
      const result = await svc.saveAvatar("user-dev", makeJpegBuffer(), "pic.jpg");

      expect(result.provider).toBe("local");
      expect(result.url).toMatch(/^\/uploads\/avatars\//);
      expect(writeSpy).toHaveBeenCalledOnce();

      existsSpy.mockRestore();
      writeSpy.mockRestore();
    });
  });

  // ── 5. saveAvatar — Cloudinary success path ────────────────────────────────
  describe("saveAvatar — Cloudinary success", () => {
    it("returns cloudinary URL and publicId when upload succeeds", async () => {
      process.env.CLOUDINARY_URL = "cloudinary://key:secret@mycloud";
      process.env.NODE_ENV = "test";

      vi.mocked(cloudinaryMock.config).mockReturnValue({
        cloud_name: "mycloud",
        api_key: "key",
        api_secret: "secret"
      } as any);

      vi.mocked(cloudinaryMock.uploader.upload_stream).mockImplementation(
        (_opts: any, cb: any) => {
          const passthrough = {
            end: () =>
              cb(null, {
                secure_url: "https://res.cloudinary.com/mycloud/image/upload/mrbilal-avatars/avatar-user-1-123.jpg",
                public_id: "mrbilal-avatars/avatar-user-1-123"
              })
          };
          return passthrough as any;
        }
      );

      const svc = new StorageService();
      const result = await svc.saveAvatar("user-1", makeJpegBuffer(), "pic.jpg");

      expect(result.provider).toBe("cloudinary");
      expect(result.url).toMatch(/^https:\/\/res\.cloudinary\.com/);
      expect(result.publicId).toBe("mrbilal-avatars/avatar-user-1-123");
    });
  });

  // ── 6. deleteAvatar ────────────────────────────────────────────────────────
  describe("deleteAvatar", () => {
    it("is a no-op when avatarUrl is null", async () => {
      const svc = new StorageService();
      await expect(svc.deleteAvatar(null)).resolves.toBeUndefined();
    });

    it("is a no-op when avatarUrl is undefined", async () => {
      const svc = new StorageService();
      await expect(svc.deleteAvatar(undefined)).resolves.toBeUndefined();
    });

    it("deletes a local file when url starts with /uploads/avatars/", async () => {
      delete process.env.CLOUDINARY_URL;
      const svc = new StorageService();

      const existsSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
      const unlinkSpy = vi.spyOn(fs.promises, "unlink").mockResolvedValue(undefined);

      await svc.deleteAvatar("/uploads/avatars/avatar-user-1-123.jpg");
      expect(unlinkSpy).toHaveBeenCalledOnce();

      existsSpy.mockRestore();
      unlinkSpy.mockRestore();
    });

    it("calls cloudinary.uploader.destroy when publicId is provided", async () => {
      process.env.CLOUDINARY_URL = "cloudinary://key:secret@mycloud";
      vi.mocked(cloudinaryMock.config).mockReturnValue({
        cloud_name: "mycloud",
        api_key: "key",
        api_secret: "secret"
      } as any);

      const destroySpy = vi.mocked(cloudinaryMock.uploader.destroy).mockResolvedValue({
        result: "ok"
      } as any);

      const svc = new StorageService();
      await svc.deleteAvatar(
        "https://res.cloudinary.com/mycloud/image/upload/mrbilal-avatars/avatar-user-1.jpg",
        "mrbilal-avatars/avatar-user-1"
      );

      expect(destroySpy).toHaveBeenCalledWith("mrbilal-avatars/avatar-user-1");
    });
  });
});
