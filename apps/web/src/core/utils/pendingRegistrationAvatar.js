const STORAGE_KEY = "mrbilal_pending_reg_avatar";
const MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes (matches OTP expiry)
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// In-memory store preserves the exact File object during SPA navigation without base64 overhead
let memoryEntry = null;

export function validateAvatarFile(file) {
  if (!file) return { valid: false, error: "No file selected." };
  if (!ALLOWED_TYPES.includes(String(file.type || "").toLowerCase())) {
    return { valid: false, error: "Accepted image formats are JPG, PNG, and WebP." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: "Image size exceeds the 2 MB limit. Please select a smaller photo." };
  }
  return { valid: true, error: null };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read selected image."));
    reader.readAsDataURL(file);
  });
}

async function dataUrlToFile(dataUrl, filename, mimeType) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename || "avatar.jpg", { type: mimeType || blob.type || "image/jpeg" });
}

/**
 * Temporarily stores the user's selected registration avatar bound strictly to their email
 * with a 15-minute expiry so it can be uploaded via the authenticated /users/me/avatar
 * endpoint immediately after OTP verification.
 */
export async function savePendingRegistrationAvatar(email, file) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !file) return;

  const expiresAt = Date.now() + MAX_AGE_MS;
  memoryEntry = { email: normalizedEmail, file, expiresAt };

  try {
    const dataUrl = await fileToDataUrl(file);
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        email: normalizedEmail,
        name: file.name,
        type: file.type,
        dataUrl,
        expiresAt,
      })
    );
  } catch {
    // sessionStorage quota fallback: in-memory entry still works across SPA navigation
  }
}

export async function consumePendingRegistrationAvatar(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const now = Date.now();

  if (memoryEntry) {
    const entry = memoryEntry;
    memoryEntry = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    if (entry.email === normalizedEmail && entry.expiresAt > now) {
      return entry.file;
    }
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.email !== normalizedEmail || !parsed.expiresAt || parsed.expiresAt <= now) {
      return null;
    }
    if (!parsed.dataUrl) return null;
    return await dataUrlToFile(parsed.dataUrl, parsed.name, parsed.type);
  } catch {
    return null;
  }
}

export function clearPendingRegistrationAvatar() {
  memoryEntry = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
