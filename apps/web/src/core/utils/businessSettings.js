import { apiClient } from "../apiClient";

export const DEFAULT_CURRENCY = {
  code: "PKR",
  symbol: "Rs",
  position: "PREFIX",
};

/**
 * Formats a numeric amount using the company's configured currency settings.
 * Defaults to PKR ("Rs ") prefix formatting.
 */
export function formatCurrency(amount, currency, options = {}) {
  const num = Number(amount || 0);
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const symbol = currency?.symbol || DEFAULT_CURRENCY.symbol;
  const position = currency?.position || DEFAULT_CURRENCY.position;

  const isNegative = num < 0;
  const formatted = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const valueWithSymbol =
    position === "SUFFIX" ? `${formatted} ${symbol}` : `${symbol} ${formatted}`;

  return isNegative ? `-${valueWithSymbol}` : valueWithSymbol;
}

/**
 * Loads business settings for the authenticated company from GET /settings.
 */
export async function fetchBusinessSettings() {
  const res = await apiClient.get("/settings");
  if (res.data?.success && res.data.data) {
    return res.data.data;
  }
  return null;
}

/**
 * Extracts a user-friendly error message from an Axios/API error,
 * including clear messaging for 403 Forbidden role restrictions.
 */
export function extractApiError(err, fallback = "Operation failed. Please try again.") {
  const status = err?.response?.status;
  if (status === 403) {
    return err?.response?.data?.message || "Access denied. Only Admin or Super Admin users can modify settings.";
  }
  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  return err?.response?.data?.message || err?.message || fallback;
}
