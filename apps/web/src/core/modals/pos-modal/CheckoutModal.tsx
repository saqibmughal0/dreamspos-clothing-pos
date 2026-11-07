import React, { useState } from "react";
import { usePosStore } from "../../posStore";
import { apiClient } from "../../apiClient";

export const PaymentMethod = {
  CASH: "CASH",
  CARD: "CARD",
  BANK_TRANSFER: "BANK_TRANSFER",
  GIFT_CARD: "GIFT_CARD",
  POINTS: "POINTS",
  SPLIT: "SPLIT"
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const SalesChannel = {
  POS: "POS",
  ONLINE: "ONLINE",
  MANUAL: "MANUAL"
} as const;
export type SalesChannel = typeof SalesChannel[keyof typeof SalesChannel];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saleData: any) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { cart, customer, orderDiscount, shippingFee, getGrandTotal, getSubtotal, getTotalTax, clearCart, setLastCompletedSale } = usePosStore();
  const grandTotal = getGrandTotal();

  const [paymentMode, setPaymentMode] = useState<"CASH" | "CARD" | "BANK_TRANSFER" | "SPLIT">("CASH");
  const [tenderAmount, setTenderAmount] = useState<number>(grandTotal);
  const [splitCash, setSplitCash] = useState<number>(grandTotal / 2);
  const [splitCard, setSplitCard] = useState<number>(grandTotal / 2);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const handlePresetCash = (amount: number) => {
    setTenderAmount(amount);
  };

  const calculateChange = () => {
    if (paymentMode === "CASH") {
      return Math.max(0, tenderAmount - grandTotal);
    }
    return 0;
  };

  const handleCompleteSale = async () => {
    setError("");
    setSubmitting(true);

    try {
      let payments: { method: PaymentMethod; amount: number }[] = [];

      if (paymentMode === "CASH") {
        payments = [{ method: PaymentMethod.CASH, amount: tenderAmount }];
      } else if (paymentMode === "CARD") {
        payments = [{ method: PaymentMethod.CARD, amount: grandTotal }];
      } else if (paymentMode === "BANK_TRANSFER") {
        payments = [{ method: PaymentMethod.BANK_TRANSFER, amount: grandTotal }];
      } else if (paymentMode === "SPLIT") {
        if (splitCash + splitCard < grandTotal) {
          setError(`Split payments ($${(splitCash + splitCard).toFixed(2)}) cannot be less than Grand Total ($${grandTotal.toFixed(2)})`);
          setSubmitting(false);
          return;
        }
        payments = [
          { method: PaymentMethod.CASH, amount: splitCash },
          { method: PaymentMethod.CARD, amount: splitCard }
        ];
      }

      // Payload matching PosCheckoutSchema
      const payload = {
        storeId: "00000000-0000-0000-0000-000000000001", // fallback store UUID or active store
        customerId: customer?.id || null,
        channel: SalesChannel.POS,
        items: cart.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          size: i.size || undefined,
          color: i.color || undefined,
          quantity: i.quantity,
          unitPrice: i.price,
          discountAmount: i.discount,
          taxAmount: i.taxAmount
        })),
        orderDiscount,
        shippingFee,
        payments
      };

      const res = await apiClient.post("/pos/checkout", payload);
      if (res.data?.success) {
        const saleResult = {
          ...res.data.data,
          subtotal: getSubtotal(),
          taxAmount: getTotalTax(),
          discountAmount: orderDiscount,
          totalAmount: grandTotal,
          items: cart,
          payments,
          changeDue: calculateChange(),
          customerName: customer?.name || "Walk-in Customer"
        };

        setLastCompletedSale(saleResult);
        clearCart();
        onSuccess(saleResult);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to process sale");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "600px" }}>
        <div className="modal-content">
          <div className="modal-header border-bottom py-3">
            <h5 className="modal-title fs-16 fw-bold">
              <i className="feather-credit-card me-2 text-primary"></i> POS Checkout & Multi-Tender Payment
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-4">
            {error && <div className="alert alert-danger py-2 fs-13 mb-3">{error}</div>}

            {/* Total Display Banner */}
            <div className="d-flex justify-content-between align-items-center p-3 mb-3 bg-light rounded border">
              <div>
                <span className="text-muted fs-13">Customer:</span>
                <h6 className="fw-bold mb-0 text-dark">{customer?.name || "Walk-in Customer"}</h6>
              </div>
              <div className="text-end">
                <span className="text-muted fs-13">Total Due:</span>
                <h3 className="fw-bold text-primary mb-0">${grandTotal.toFixed(2)}</h3>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <label className="form-label fs-13 fw-semibold">Payment Tender Method</label>
            <div className="row g-2 mb-3">
              <div className="col-3">
                <button
                  type="button"
                  className={`btn w-100 py-2 fs-13 ${paymentMode === "CASH" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setPaymentMode("CASH");
                    setTenderAmount(grandTotal);
                  }}
                >
                  <i className="feather-dollar-sign d-block mb-1"></i> Cash
                </button>
              </div>
              <div className="col-3">
                <button
                  type="button"
                  className={`btn w-100 py-2 fs-13 ${paymentMode === "CARD" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setPaymentMode("CARD")}
                >
                  <i className="feather-credit-card d-block mb-1"></i> Card
                </button>
              </div>
              <div className="col-3">
                <button
                  type="button"
                  className={`btn w-100 py-2 fs-13 ${paymentMode === "BANK_TRANSFER" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setPaymentMode("BANK_TRANSFER")}
                >
                  <i className="feather-send d-block mb-1"></i> Bank
                </button>
              </div>
              <div className="col-3">
                <button
                  type="button"
                  className={`btn w-100 py-2 fs-13 ${paymentMode === "SPLIT" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setPaymentMode("SPLIT");
                    setSplitCash(grandTotal / 2);
                    setSplitCard(grandTotal / 2);
                  }}
                >
                  <i className="feather-shuffle d-block mb-1"></i> Split
                </button>
              </div>
            </div>

            {/* Mode-Specific Controls */}
            {paymentMode === "CASH" && (
              <div>
                <label className="form-label fs-13 fw-semibold">Cash Tendered ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-lg mb-2"
                  value={tenderAmount}
                  onChange={(e) => setTenderAmount(parseFloat(e.target.value) || 0)}
                />

                {/* Quick Presets */}
                <div className="d-flex gap-2 mb-3">
                  <button type="button" className="btn btn-sm btn-outline-dark flex-fill" onClick={() => handlePresetCash(grandTotal)}>
                    Exact (${grandTotal.toFixed(2)})
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-dark flex-fill" onClick={() => handlePresetCash(50)}>
                    $50
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-dark flex-fill" onClick={() => handlePresetCash(100)}>
                    $100
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-dark flex-fill" onClick={() => handlePresetCash(200)}>
                    $200
                  </button>
                </div>

                <div className="p-2 bg-success-transparent rounded text-success fw-bold d-flex justify-content-between fs-14">
                  <span>Change Given to Customer:</span>
                  <span>${calculateChange().toFixed(2)}</span>
                </div>
              </div>
            )}

            {paymentMode === "CARD" && (
              <div className="p-3 bg-light rounded text-center my-2">
                <i className="feather-check-circle fs-32 text-success mb-2"></i>
                <div className="fw-bold">Ready for Card Terminal Insertion / Tap</div>
                <small className="text-muted">Charge Total: ${grandTotal.toFixed(2)}</small>
              </div>
            )}

            {paymentMode === "BANK_TRANSFER" && (
              <div className="p-3 bg-light rounded my-2">
                <div className="fw-bold mb-1">Direct Bank Wire / Online Transfer</div>
                <small className="text-muted">Dreams Retail Operating Account: ****-9921</small>
              </div>
            )}

            {paymentMode === "SPLIT" && (
              <div>
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label fs-12 fw-semibold">Cash Portion ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={splitCash}
                      onChange={(e) => setSplitCash(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fs-12 fw-semibold">Card Portion ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={splitCard}
                      onChange={(e) => setSplitCard(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-between p-2 bg-light rounded fs-13">
                  <span>Combined Tender:</span>
                  <span className={splitCash + splitCard >= grandTotal ? "text-success fw-bold" : "text-danger fw-bold"}>
                    ${(splitCash + splitCard).toFixed(2)} / ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer border-top py-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm px-4 fw-bold"
              disabled={submitting || (paymentMode === "CASH" && tenderAmount < grandTotal)}
              onClick={handleCompleteSale}
            >
              {submitting ? "Processing..." : `Complete Sale ($${grandTotal.toFixed(2)})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
