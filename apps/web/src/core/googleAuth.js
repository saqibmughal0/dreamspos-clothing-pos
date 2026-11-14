/**
 * Google Identity Services (GIS) Helper for MR Bilal POS
 */

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "";

let scriptLoadingPromise = null;

export const loadGoogleScript = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  if (!scriptLoadingPromise) {
    scriptLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(new Error("Failed to load Google Sign-In SDK: " + err));
      document.body.appendChild(script);
    });
  }

  return scriptLoadingPromise;
};

export const triggerGoogleAuth = async ({ onSuccess, onError }) => {
  if (!GOOGLE_CLIENT_ID) {
    onError(
      "Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment variables."
    );
    return;
  }

  try {
    await loadGoogleScript();

    if (!window.google?.accounts?.id) {
      onError("Google Sign-In SDK is unavailable.");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          onSuccess(response.credential);
        } else {
          onError("No credential received from Google.");
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    // Render an invisible element or trigger prompt
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        console.warn("Google One Tap prompt not displayed:", notification.getNotDisplayedReason());
        // Fallback: render button inside a hidden modal or directly
        const container = document.getElementById("google-hidden-btn-container");
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: 250
          });
          const btn = container.querySelector("div[role=button]");
          if (btn) btn.click();
        }
      } else if (notification.isSkippedMoment()) {
        console.warn("Google prompt skipped:", notification.getSkippedReason());
      }
    });
  } catch (err) {
    console.error("Error triggering Google Auth:", err);
    onError(err?.message || "An unexpected error occurred during Google sign-in.");
  }
};
