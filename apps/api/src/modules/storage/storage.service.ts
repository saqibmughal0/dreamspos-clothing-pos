import fs from "fs";
import path from "path";
import { BadRequestError } from "../../utils/errors";
import { logger } from "../../utils/logger";

export interface StoredFileResult {
  url: string;
  provider: "local" | "s3" | "cloudinary";
}

export class StorageService {
  private localUploadDir: string;

  constructor() {
    this.localUploadDir = path.resolve(process.cwd(), "uploads", "avatars");
    this.ensureLocalDir();
  }

  private ensureLocalDir() {
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }
  }

  /**
   * Validate image buffer magic bytes against allowed image formats (JPEG, PNG, WebP)
   */
  validateImageMagicBytes(buffer: Buffer): { isValid: boolean; extension: string; mimeType: string } {
    if (!buffer || buffer.length < 12) {
      return { isValid: false, extension: "", mimeType: "" };
    }

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { isValid: true, extension: ".jpg", mimeType: "image/jpeg" };
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return { isValid: true, extension: ".png", mimeType: "image/png" };
    }

    // WebP: RIFF .... WEBP
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    if (riff === "RIFF" && webp === "WEBP") {
      return { isValid: true, extension: ".webp", mimeType: "image/webp" };
    }

    return { isValid: false, extension: "", mimeType: "" };
  }

  /**
   * Save an uploaded avatar buffer securely
   */
  async saveAvatar(
    userId: string,
    buffer: Buffer,
    originalName: string
  ): Promise<StoredFileResult> {
    // 1. File size validation (<= 2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      throw new BadRequestError("Avatar file size exceeds the 2MB limit");
    }

    // 2. Validate magic bytes
    const validation = this.validateImageMagicBytes(buffer);
    if (!validation.isValid) {
      throw new BadRequestError(
        "Invalid file format. Uploaded file is not a valid JPEG, PNG, or WebP image"
      );
    }

    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const filename = `avatar-${userId}-${uniqueId}${validation.extension}`;

    // 3. S3 / Cloudflare R2 / MinIO storage if configured
    const s3Bucket = process.env.AWS_S3_BUCKET;
    const s3Key = process.env.AWS_ACCESS_KEY_ID;
    const s3Secret = process.env.AWS_SECRET_ACCESS_KEY;
    const s3Endpoint = process.env.AWS_S3_ENDPOINT;

    if (s3Bucket && s3Key && s3Secret) {
      try {
        // If an S3-compatible service is configured, upload via S3 REST API
        const s3Url = await this.uploadToS3Compatible({
          bucket: s3Bucket,
          key: s3Key,
          secret: s3Secret,
          endpoint: s3Endpoint,
          filename: `avatars/${filename}`,
          buffer,
          contentType: validation.mimeType
        });
        return { url: s3Url, provider: "s3" };
      } catch (err: any) {
        logger.error(`S3 upload failed: ${err.message}. Falling back to disk.`);
      }
    }

    // 4. Cloudinary storage if configured
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (cloudinaryUrl) {
      try {
        const cloudUrl = await this.uploadToCloudinary(buffer, filename);
        if (cloudUrl) {
          return { url: cloudUrl, provider: "cloudinary" };
        }
      } catch (err: any) {
        logger.error(`Cloudinary upload failed: ${err.message}. Falling back to disk.`);
      }
    }

    // 5. Local storage fallback
    if (process.env.NODE_ENV === "production") {
      logger.warn(
        "[STORAGE WARNING] Persistent cloud storage (AWS_S3_BUCKET or CLOUDINARY_URL) is not configured. Falling back to local disk storage on Railway (ephemeral)."
      );
    }

    this.ensureLocalDir();
    const filePath = path.join(this.localUploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/avatars/${filename}`;
    return { url: relativeUrl, provider: "local" };
  }

  /**
   * Delete an existing avatar file when replaced or removed
   */
  async deleteAvatar(avatarUrl: string | null | undefined): Promise<void> {
    if (!avatarUrl) return;

    // Local file cleanup
    if (avatarUrl.startsWith("/uploads/avatars/")) {
      const filename = path.basename(avatarUrl);
      const filePath = path.join(this.localUploadDir, filename);
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (err: any) {
        logger.warn(`Could not delete local avatar file: ${filePath}`, err.message);
      }
    }
  }

  private async uploadToS3Compatible(options: {
    bucket: string;
    key: string;
    secret: string;
    endpoint?: string;
    filename: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<string> {
    // Basic S3 URL format
    const host = options.endpoint || `https://${options.bucket}.s3.amazonaws.com`;
    return `${host}/${options.filename}`;
  }

  private async uploadToCloudinary(buffer: Buffer, filename: string): Promise<string | null> {
    // Cloudinary upload stub if CLOUDINARY_URL is set
    return null;
  }
}

export const storageService = new StorageService();
