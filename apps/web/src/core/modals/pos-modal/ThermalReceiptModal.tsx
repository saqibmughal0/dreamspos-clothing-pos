import React, { useState } from "react";
import { usePosStore } from "../../posStore";

interface ThermalReceiptModalProps {
  saleData?: any;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  saleData,
  onClose
}) => {
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("80mm");
  const lastSale = usePosStore((state) => state.lastCompletedSale);
  const data = saleData || lastSale;

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: paperWidth === "58mm" ? "340px" : "440px" }}>
        <div className="modal-content">
          <div className="modal-header border-bottom py-2">
            <h5 className="modal-title fs-16 fw-bold text-dark">
              <i className="feather-printer me-2 text-primary"></i> Thermal Receipt Preview
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>

          {/* Width selector switch */}
          <div className="d-flex justify-content-center gap-2 p-2 bg-light border-bottom no-print">
            <button
              className={`btn btn-sm ${paperWidth === "58mm" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setPaperWidth("58mm")}
            >
              58 mm Format
            </button>
            <button
              className={`btn btn-sm ${paperWidth === "80mm" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setPaperWidth("80mm")}
            >
              80 mm Format
            </button>
          </div>

          <div className="modal-body p-3">
            {/* The printable receipt area */}
            <div
              id="thermal-receipt"
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: paperWidth === "58mm" ? "11px" : "13px",
                color: "#000",
                width: "100%",
                lineHeight: "1.4"
              }}
            >
              <div className="text-center mb-2">
                <h4 className="fw-bold mb-0" style={{ fontSize: paperWidth === "58mm" ? "15px" : "18px" }}>
                  DREAMS APPAREL
                </h4>
                <div style={{ fontSize: "11px" }}>Flagship Clothing Retail</div>
                <div style={{ fontSize: "11px" }}>100 Fashion Avenue, Suite 10</div>
                <div style={{ fontSize: "11px" }}>Tel: +1 (800) 555-0101</div>
                <div style={{ fontSize: "11px" }}>Tax Reg: US-987654321-TX</div>
              </div>

              <div className="border-top border-bottom border-dark py-1 my-2" style={{ borderStyle: "dashed !important" }}>
                <div className="d-flex justify-content-between">
                  <span>Invoice:</span>
                  <span className="fw-bold">{data.invoiceNumber || "INV-0001"}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Date/Time:</span>
                  <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Cashier:</span>
                  <span>{data.cashierName || "Front Desk Cashier"}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Customer:</span>
                  <span>{data.customerName || "Walk-in Customer"}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="mb-2">
                <div className="d-flex justify-content-between fw-bold border-bottom pb-1 mb-1">
                  <span style={{ width: "50%" }}>Item</span>
                  <span className="text-center" style={{ width: "15%" }}>Qty</span>
                  <span className="text-end" style={{ width: "15%" }}>Price</span>
                  <span className="text-end" style={{ width: "20%" }}>Total</span>
                </div>

                {data.items?.map((it: any, idx: number) => (
                  <div key={idx} className="mb-1">
                    <div className="fw-bold text-truncate">{it.name}</div>
                    {(it.size || it.color) && (
                      <div className="text-muted" style={{ fontSize: "10px" }}>
                        Variant: {it.color || ""} {it.size ? `[${it.size}]` : ""}
                      </div>
                    )}
                    <div className="d-flex justify-content-between">
                      <span style={{ width: "50%" }}></span>
                      <span className="text-center" style={{ width: "15%" }}>{it.quantity}</span>
                      <span className="text-end" style={{ width: "15%" }}>${Number(it.unitPrice || it.price).toFixed(2)}</span>
                      <span className="text-end fw-bold" style={{ width: "20%" }}>${Number(it.totalPrice || it.price * it.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-top border-dark pt-1 mt-2" style={{ borderStyle: "dashed !important" }}>
                <div className="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>${Number(data.subtotal || 0).toFixed(2)}</span>
                </div>
                {Number(data.discountAmount || 0) > 0 && (
                  <div className="d-flex justify-content-between text-success">
                    <span>Discount:</span>
                    <span>-${Number(data.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between">
                  <span>Sales Tax (8.5%):</span>
                  <span>${Number(data.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold fs-15 border-top border-bottom border-dark py-1 my-1">
                  <span>TOTAL DUE:</span>
                  <span>${Number(data.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Payments & Change */}
              <div className="my-2">
                {data.payments?.map((pm: any, pIdx: number) => (
                  <div key={pIdx} className="d-flex justify-content-between">
                    <span>Tender ({pm.method}):</span>
                    <span>${Number(pm.amount).toFixed(2)}</span>
                  </div>
                ))}
                <div className="d-flex justify-content-between fw-bold">
                  <span>Change Given:</span>
                  <span>${Number(data.changeDue || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Barcode & Footer Policy */}
              <div className="text-center mt-3 pt-2 border-top border-dark" style={{ borderStyle: "dashed !important" }}>
                <div className="barcode-font fw-bold letter-spacing-2" style={{ fontSize: "14px", letterSpacing: "3px" }}>
                  * {data.invoiceNumber || "INV-0001"} *
                </div>
                <div className="mt-2 text-center" style={{ fontSize: "10px" }}>
                  Clothing Returns & Size/Color Exchanges Accepted within 14 Days with Original Tags.
                </div>
                <div className="fw-bold mt-1" style={{ fontSize: "11px" }}>
                  *** THANK YOU FOR SHOPPING! ***
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer justify-content-between no-print py-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
              <i className="feather-printer me-1"></i> Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
