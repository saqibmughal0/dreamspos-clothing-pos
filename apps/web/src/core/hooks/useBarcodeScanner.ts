import { useEffect, useRef } from "react";
import { apiClient } from "../apiClient";
import { usePosStore } from "../posStore";

interface BarcodeScannerOptions {
  onScanSuccess?: (item: any) => void;
  onScanError?: (barcode: string) => void;
  enabled?: boolean;
}

export const useBarcodeScanner = ({
  onScanSuccess,
  onScanError,
  enabled = true
}: BarcodeScannerOptions = {}) => {
  const addItem = usePosStore((state) => state.addItem);
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        // Allow scanner in barcode search field, but don't intercept standard text edits
        if (target.getAttribute("data-barcode-input") !== "true") {
          return;
        }
      }

      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const barcode = bufferRef.current.trim();
        bufferRef.current = "";

        if (barcode.length >= 3) {
          try {
            const res = await apiClient.get(`/products/barcode/${encodeURIComponent(barcode)}`);
            if (res.data?.success && res.data.data) {
              const item = res.data.data;
              addItem({
                id: item.id,
                variantId: item.variantId || null,
                name: item.name,
                size: item.size || null,
                color: item.color || null,
                sku: item.sku,
                sellingPrice: item.sellingPrice,
                taxRate: item.taxRate,
                image: item.image,
                stockQty: item.stockQuantity
              });
              if (onScanSuccess) onScanSuccess(item);
            } else {
              if (onScanError) onScanError(barcode);
            }
          } catch (err) {
            if (onScanError) onScanError(barcode);
          }
        }
        return;
      }

      // If delay between keys was too long (> 100ms), reset buffer (likely human typing)
      if (elapsed > 100) {
        bufferRef.current = "";
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, addItem, onScanSuccess, onScanError]);
};
