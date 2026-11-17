import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { BadRequestError, AppError } from "../../utils/errors";
import { logger } from "../../utils/logger";

export interface StoredFileResult {
  url: string;
  publicId?: string;
  provider: "local" | "s3" | "cloudinary";
}

export class StorageService {
  private localUploadDir: string;
  private cloudinaryConfigured: boolean = false;

  constructor() {
    this.localUploadDir = path.resolve(process.cwd(), "uploads", "avatars");
    this.initCloudinary();
  }

  private initCloudinary() {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (cloudinaryUrl) {
      try {
        // cloudinary SDK auto-parses CLOUDINARY_URL — credentials never logged
        cloudinary.config({ cloudinary_url: cloudinaryUrl });
        const cfg = cloudinary.config();
        if (cfg.cloud_name && cfg.api_key && cfg.api_secret) {
          this.cloudinaryConfigured = true;
          logger.info("[Storage] Cloudinary configured successfully");
        } else {
          logger.error("[Storage] CLOUDINARY_URL is set but parsed config is incomplete");
        }
      } catch (err: any) {
        logger.error("[Storage] Failed to configure Cloudinary: " + err.message);
      }
    }
  }

  private ensureLocalDir() {
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }
  }

  /**
   * Validate image buffer magic bytes against allowed image formats (JPEG, PNG, WebP)
   */
  validateImageMagicBytes(buffer: Buffer): {
    isValid: boolean;
    extension: string;
    mimeType: string;
  } {
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
   * Save an uploaded avatar buffer securely.
   * Production: Cloudinary only. Dev/test: local fallback allowed.
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
    const filename = `avatar-${userId}-${uniqueId}`;

    // 3. Cloudinary upload (primary persistent storage)
    if (this.cloudinaryConfigured) {
      let previousError: string | undefined;
      try {
        const result = await this.uploadToCloudinary(
          buffer,
          `mrbilal-avatars/${filename}`,
          validation.mimeType
        );
        logger.info(`[Storage] Avatar uploaded to Cloudinary: ${result.publicId}`);
        return { url: result.url, publicId: result.publicId, provider: "cloudinary" };
      } catch (err: any) {
        previousError = err.message;
        logger.error(`[Storage] Cloudinary upload failed: ${err.message}`);
      }

      // In production, Cloudinary is the ONLY persistent option — fail hard
      if (process.env.NODE_ENV === "production") {
        throw new AppError(
          503,
          "Avatar upload failed. Cloud storage is temporarily unavailable. Your previous avatar has been preserved."
        );
      }
      // In dev/test fall through to local
    } else if (process.env.NODE_ENV === "production") {
      // Production with no cloud storage configured = hard failure
      throw new AppError(
        503,
        "Avatar storage is not configured for production. Please configure CLOUDINARY_URL."
      );
    }

    // 4. Local storage (dev/test only)
    this.ensureLocalDir();
    const localFilename = `${filename}${validation.extension}`;
    const filePath = path.join(this.localUploadDir, localFilename);
    await fs.promises.writeFile(filePath, buffer);
    logger.info(`[Storage] Avatar saved locally (dev): ${localFilename}`);
    return { url: `/uploads/avatars/${localFilename}`, provider: "local" };
  }

  /**
   * Delete an existing avatar when replaced or removed.
   * Accepts optional publicId for direct Cloudinary deletion.
   */
  async deleteAvatar(
    avatarUrl: string | null | undefined,
    publicId?: string | null
  ): Promise<void> {
    if (!avatarUrl) return;

    // Cloudinary deletion by public_id (fastest path)
    if (publicId && this.cloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(publicId);
        logger.info(`[Storage] Cloudinary avatar deleted: ${publicId}`);
      } catch (err: any) {
        logger.warn(`[Storage] Could not delete Cloudinary avatar ${publicId}: ${err.message}`);
      }
      return;
    }

    // Fallback: extract public_id from Cloudinary URL
    if (avatarUrl.includes("cloudinary.com") && this.cloudinaryConfigured) {
      try {
        // Extract public_id from: .../upload/[transformations/]<public_id>.<ext>
        const match = avatarUrl.match(/\/upload\/(?:[^/]+\/)*(.+?)\.[a-z]+$/i);
        if (match) {
          await cloudinary.uploader.destroy(match[1]);
          logger.info(`[Storage] Cloudinary avatar deleted via URL: ${match[1]}`);
        }
      } catch (err: any) {
        logger.warn(`[Storage] Could not delete Cloudinary avatar from URL: ${err.message}`);
      }
      return;
    }

    // Local file cleanup
    if (avatarUrl.startsWith("/uploads/avatars/")) {
      const fname = path.basename(avatarUrl);
      const filePath = path.join(this.localUploadDir, fname);
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (err: any) {
        logger.warn(`[Storage] Could not delete local avatar file ${filePath}: ${err.message}`);
      }
    }
  }

  /**
   * Upload buffer to Cloudinary via streaming upload.
   * Strips EXIF, enforces max dimensions, never logs credentials.
   */
  private uploadToCloudinary(
    buffer: Buffer,
    publicId: string,
    mimeType: string
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const format =
        mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: "image",
          format,
          overwrite: true,
          invalidate: true,
          // Strip EXIF metadata for privacy
          transformation: [{ strip_profile: true }],
          // Enforce max dimensions without upscaling
          eager: [{ width: 400, height: 400, crop: "limit" }]
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload returned no result"));
          } else {
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        }
      );

      uploadStream.end(buffer);
    });
  }
}

export const storageService = new StorageService();
