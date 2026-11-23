import React, { useState, useEffect } from "react";
import { usePosStore } from "../../posStore";
import { apiClient } from "../../apiClient";
import { formatCurrency } from "../../utils/businessSettings";

interface ThermalReceiptModalProps {
  saleData?: any;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  saleData,
  onClose
}) => {
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("80mm");
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const lastSale = usePosStore((state) => state.lastCompletedSale);
  const data = saleData || lastSale;

  useEffect(() => {
    apiClient.get("/settings")
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setBusinessSettings(res.data.data);
          if (res.data.data.printer?.paperSize === "58mm" || res.data.data.printer?.paperSize === "80mm") {
            setPaperWidth(res.data.data.printer.paperSize);
          }
        }
      })
      .catch(() => {
        // Fallback gracefully without throwing
      });
  }, []);

  if (!data) return null;

  const currency = businessSettings?.currency;
  const fmt = (amount: number) => formatCurrency(amount, currency);
  const showCashier = businessSettings?.receipt?.showCashier ?? true;
  const showCustomer = businessSettings?.receipt?.showCustomer ?? true;
  const showBarcode = businessSettings?.receipt?.showBarcode ?? true;
  const invoicePrefix = businessSettings?.invoice?.prefix || "INV-";
  const displayInvoice = data.invoiceNumber || `${invoicePrefix}0001`;

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
                  {businessSettings?.shopName || businessSettings?.brandName || "MR BILAL POS"}
                </h4>
                {businessSettings?.receipt?.headerMessage && (
                  <div style={{ fontSize: "11px" }}>{businessSettings.receipt.headerMessage}</div>
                )}
                {businessSettings?.address && (
                  <div style={{ fontSize: "11px" }}>{businessSettings.address}</div>
                )}
                {businessSettings?.phone && (
                  <div style={{ fontSize: "11px" }}>Tel: {businessSettings.phone}</div>
                )}
                {businessSettings?.taxNumber && (
                  <div style={{ fontSize: "11px" }}>Tax Reg: {businessSettings.taxNumber}</div>
                )}
              </div>

              <div className="border-top border-bottom border-dark py-1 my-2" style={{ borderStyle: "dashed !important" }}>
                <div className="d-flex justify-content-between">
                  <span>Invoice:</span>
                  <span className="fw-bold">{displayInvoice}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Date/Time:</span>
                  <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {showCashier && (
                  <div className="d-flex justify-content-between">
                    <span>Cashier:</span>
                    <span>{data.cashierName || "Front Desk Cashier"}</span>
                  </div>
                )}
                {showCustomer && (
                  <div className="d-flex justify-content-between">
                    <span>Customer:</span>
                    <span>{data.customerName || "Walk-in Customer"}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="mb-2">
                <div className="d-flex justify-content-between fw-bold border-bottom pb-1 mb-1">
                  <span style={{ width: "45%" }}>Item</span>
                  <span className="text-center" style={{ width: "13%" }}>Qty</span>
                  <span className="text-end" style={{ width: "20%" }}>Price</span>
                  <span className="text-end" style={{ width: "22%" }}>Total</span>
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
                      <span style={{ width: "45%" }}></span>
                      <span className="text-center" style={{ width: "13%" }}>{it.quantity}</span>
                      <span className="text-end" style={{ width: "20%" }}>{fmt(Number(it.unitPrice || it.price))}</span>
                      <span className="text-end fw-bold" style={{ width: "22%" }}>{fmt(Number(it.totalPrice || it.price * it.quantity))}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-top border-dark pt-1 mt-2" style={{ borderStyle: "dashed !important" }}>
                <div className="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>{fmt(Number(data.subtotal || 0))}</span>
                </div>
                {Number(data.discountAmount || 0) > 0 && (
                  <div className="d-flex justify-content-between text-success">
                    <span>Discount:</span>
                    <span>-{fmt(Number(data.discountAmount))}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between">
                  <span>Sales Tax ({businessSettings?.tax?.rate ?? 0}%):</span>
                  <span>{fmt(Number(data.taxAmount || 0))}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold fs-15 border-top border-bottom border-dark py-1 my-1">
                  <span>TOTAL DUE:</span>
                  <span>{fmt(Number(data.totalAmount || 0))}</span>
                </div>
              </div>

              {/* Payments & Change */}
              <div className="my-2">
                {data.payments?.map((pm: any, pIdx: number) => (
                  <div key={pIdx} className="d-flex justify-content-between">
                    <span>Tender ({pm.method}):</span>
                    <span>{fmt(Number(pm.amount))}</span>
                  </div>
                ))}
                <div className="d-flex justify-content-between fw-bold">
                  <span>Change Given:</span>
                  <span>{fmt(Number(data.changeDue || 0))}</span>
                </div>
              </div>

              {/* Barcode & Footer Policy */}
              <div className="text-center mt-3 pt-2 border-top border-dark" style={{ borderStyle: "dashed !important" }}>
                {showBarcode && (
                  <div className="barcode-font fw-bold letter-spacing-2" style={{ fontSize: "14px", letterSpacing: "3px" }}>
                    * {displayInvoice} *
                  </div>
                )}
                {businessSettings?.policies?.terms && (
                  <div className="mt-2 text-center" style={{ fontSize: "10px" }}>
                    {businessSettings.policies.terms}
                  </div>
                )}
                <div className="fw-bold mt-1" style={{ fontSize: "11px" }}>
                  {businessSettings?.receipt?.footerMessage || "Thank you for your purchase!"}
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
