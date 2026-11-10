import React, { useState, useEffect } from "react";
import { apiClient } from "../../apiClient";

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [openingFloat, setOpeningFloat] = useState<number>(200);
  const [closingCash, setClosingCash] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const fetchActiveRegister = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/pos/register/active");
      if (res.data?.success) {
        setActiveSession(res.data.data);
        if (res.data.data?.expectedCash) {
          setClosingCash(res.data.data.expectedCash);
        }
      }
    } catch (err) {
      console.error("Failed to load active cash register", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActiveRegister();
    }
  }, [isOpen]);

  const handleOpenRegister = async () => {
    try {
      setSubmitting(true);
      const res = await apiClient.post("/pos/register/open", { openingFloat });
      if (res.data?.success) {
        setMessage("Cash register opened successfully!");
        fetchActiveRegister();
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to open register");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseRegister = async () => {
    if (!activeSession) return;
    try {
      setSubmitting(true);
      const res = await apiClient.post("/pos/register/close", {
        sessionId: activeSession.id,
        closingCash
      });
      if (res.data?.success) {
        setMessage("Cash register closed and reconciled!");
        setActiveSession(null);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to close register");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "500px" }}>
        <div className="modal-content">
          <div className="modal-header border-bottom py-3">
            <h5 className="modal-title fs-16 fw-bold">
              <i className="feather-inbox me-2 text-primary"></i> Cash Register & Shift Reconciliation
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-4">
            {message && (
              <div className="alert alert-info py-2 fs-13 mb-3">{message}</div>
            )}

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="mt-2 text-muted fs-13">Loading register status...</div>
              </div>
            ) : activeSession ? (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                  <div>
                    <h6 className="fw-bold mb-1">{activeSession.registerName || "Register 01"}</h6>
                    <small className="text-muted">
                      Opened: {new Date(activeSession.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </small>
                  </div>
                  <span className="badge bg-success-transparent text-success px-3 py-2 fw-bold">
                    Shift Active
                  </span>
                </div>

                <div className="table-responsive mb-3">
                  <table className="table table-sm fs-13">
                    <tbody>
                      <tr>
                        <td className="text-muted">Opening Float:</td>
                        <td className="text-end fw-bold">${Number(activeSession.openingFloat).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Cash Sales:</td>
                        <td className="text-end fw-bold text-success">+${Number(activeSession.cashSalesTotal).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Card Payments:</td>
                        <td className="text-end fw-bold">+${Number(activeSession.cardSalesTotal).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Total Sales Count:</td>
                        <td className="text-end fw-bold">{activeSession.salesCount} Orders</td>
                      </tr>
                      <tr className="table-active">
                        <td className="fw-bold">Expected Drawer Cash:</td>
                        <td className="text-end fw-bold text-primary fs-15">
                          ${Number(activeSession.expectedCash).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">Physical Counted Cash ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-lg"
                    value={closingCash}
                    onChange={(e) => setClosingCash(parseFloat(e.target.value) || 0)}
                  />
                  <div className="d-flex justify-content-between mt-1 fs-12">
                    <span className="text-muted">Difference / Discrepancy:</span>
                    <span
                      className={`fw-bold ${
                        closingCash - activeSession.expectedCash >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {closingCash - activeSession.expectedCash >= 0 ? "+" : ""}
                      ${(closingCash - activeSession.expectedCash).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-danger w-100 py-2 fw-semibold"
                  onClick={handleCloseRegister}
                  disabled={submitting}
                >
                  {submitting ? "Closing Shift..." : "Close Register & Reconcile Shift"}
                </button>
              </div>
            ) : (
              <div>
                <p className="fs-13 text-muted mb-3">
                  No active shift open. Enter the opening float cash to begin processing POS sales.
                </p>
                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">Opening Float Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-lg"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary w-100 py-2 fw-semibold"
                  onClick={handleOpenRegister}
                  disabled={submitting}
                >
                  {submitting ? "Opening..." : "Open Cash Drawer & Start Shift"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
