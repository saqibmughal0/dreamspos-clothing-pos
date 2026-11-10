import React, { useState, useEffect } from "react";
import { apiClient } from "../../apiClient";

interface ClothingExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExchangeSuccess?: (summary: any) => void;
}

export const ClothingExchangeModal: React.FC<ClothingExchangeModalProps> = ({
  isOpen,
  onClose,
  onExchangeSuccess
}) => {
  const [sales, setSales] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [availableVariants, setAvailableVariants] = useState<any[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      apiClient.get("/sales").then((res) => {
        if (res.data?.success) setSales(res.data.data || []);
      }).catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSaleSelect = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    setSelectedSale(sale || null);
    setSelectedItem(null);
    setAvailableVariants([]);
    setSelectedVariantId("");
  };

  const handleItemSelect = async (item: any) => {
    setSelectedItem(item);
    setSelectedVariantId("");
    try {
      const res = await apiClient.get(`/products/barcode/${item.product.sku}`);
      if (res.data?.success && res.data.data?.variants) {
        // Exclude current variant
        const otherVariants = res.data.data.variants.filter((v: any) => v.id !== item.variantId);
        setAvailableVariants(otherVariants);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteExchange = async () => {
    if (!selectedSale || !selectedItem || !selectedVariantId) return;
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await apiClient.post("/sales/exchange", {
        saleId: selectedSale.id,
        originalSaleItemId: selectedItem.id,
        exchangeQuantity: quantity,
        newVariantId: selectedVariantId,
        reason: "Clothing size/color exchange"
      });

      if (res.data?.success) {
        setMessage("Exchange processed successfully! Inventory balances updated.");
        if (onExchangeSuccess) onExchangeSuccess(res.data.exchangeSummary);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Exchange failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "560px" }}>
        <div className="modal-content">
          <div className="modal-header border-bottom py-3">
            <h5 className="modal-title fs-16 fw-bold">
              <i className="feather-repeat me-2 text-primary"></i> Clothing Size & Color Exchange
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-4">
            {message && <div className="alert alert-success py-2 fs-13 mb-3">{message}</div>}
            {error && <div className="alert alert-danger py-2 fs-13 mb-3">{error}</div>}

            {/* Step 1: Select Sale */}
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold">1. Select Original Invoice</label>
              <select
                className="form-select form-select-sm"
                onChange={(e) => handleSaleSelect(e.target.value)}
                value={selectedSale?.id || ""}
              >
                <option value="">-- Choose Invoice --</option>
                {sales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.invoiceNumber} - ${Number(s.totalAmount).toFixed(2)} ({new Date(s.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Item to Exchange */}
            {selectedSale && (
              <div className="mb-3">
                <label className="form-label fs-13 fw-semibold">2. Select Item Being Returned</label>
                <div className="list-group">
                  {selectedSale.items?.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        selectedItem?.id === item.id ? "active" : ""
                      }`}
                      onClick={() => handleItemSelect(item)}
                    >
                      <div>
                        <div className="fw-bold">{item.product.name}</div>
                        <small className="opacity-75">
                          Variant: {item.color || "Standard"} / {item.size || "Standard"} (Qty: {Number(item.quantity)})
                        </small>
                      </div>
                      <span className="badge bg-primary rounded-pill">
                        ${Number(item.unitPrice).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Select New Size / Color */}
            {selectedItem && (
              <div className="mb-3">
                <label className="form-label fs-13 fw-semibold">3. Select Replacement Size & Color</label>
                {availableVariants.length > 0 ? (
                  <select
                    className="form-select"
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                  >
                    <option value="">-- Choose New Variant --</option>
                    {availableVariants.map((v) => (
                      <option key={v.id} value={v.id} disabled={v.stockQty <= 0}>
                        {v.color} - Size {v.size} (${v.price.toFixed(2)}) — {v.stockQty > 0 ? `${v.stockQty} in stock` : "Out of Stock"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="alert alert-warning py-2 fs-12">
                    No alternative variants currently configured for this product.
                  </div>
                )}
              </div>
            )}

            {/* Exchange Quantity */}
            {selectedVariantId && (
              <div className="mb-3">
                <label className="form-label fs-13 fw-semibold">Exchange Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={Number(selectedItem.quantity)}
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            )}
          </div>

          <div className="modal-footer border-top py-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={submitting || !selectedVariantId}
              onClick={handleExecuteExchange}
            >
              {submitting ? "Exchanging..." : "Confirm & Update Inventory"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
