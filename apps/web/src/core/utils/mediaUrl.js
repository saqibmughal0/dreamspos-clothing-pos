export const NO_PRODUCT_IMAGE = "/assets/img/products/no-product-image.svg";

/**
 * Resolves any stored product/avatar image URL safely:
 * - Absolute URLs (Cloudinary https://..., http://..., blob:, data:) are returned untouched.
 * - Local backend uploads (/uploads/...) are prefixed with the backend origin when VITE_API_URL
 *   is an absolute URL, or kept as /uploads/... (proxied by Vite dev server to Express :5000).
 * - Empty or invalid values fall back to the neutral "No Product Image" placeholder.
 */
export function resolveMediaUrl(rawUrl, fallback = NO_PRODUCT_IMAGE) {
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return fallback;
  }

  const trimmed = rawUrl.trim();

  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    const apiUrl = (import.meta.env.VITE_API_URL || "").trim();
    if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
      const origin = apiUrl.replace(/\/api\/?$/, "");
      return `${origin}${trimmed}`;
    }
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed}`;
}
