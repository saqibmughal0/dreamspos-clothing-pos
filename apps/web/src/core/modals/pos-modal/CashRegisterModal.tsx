import React, { useState, useEffect } from "react";
import { apiClient } from "../../apiClient";
import { formatCurrency } from "../../utils/businessSettings";

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandatoryOpen?: boolean;
  currency?: any;
  hasUnpaidCart?: boolean;
  heldOrdersCount?: number;
  onSessionChanged?: (session: any | null, notification?: string) => void;
  onReturnToDashboard?: () => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  isOpen,
  onClose,
  mandatoryOpen = false,
  currency,
  hasUnpaidCart = false,
  heldOrdersCount = 0,
  onSessionChanged,
  onReturnToDashboard,
}) => {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Explicit user input (no hardcoded default opening cash)
  const [openingFloatInput, setOpeningFloatInput] = useState<string>("");
  const [closingCashInput, setClosingCashInput] = useState<string>("");
  const [closingNotes, setClosingNotes] = useState<string>("");
  const [acknowledgePendingOrders, setAcknowledgePendingOrders] = useState<boolean>(false);

  // Cash In / Cash Out inline movement state
  const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
  const [movementAmountInput, setMovementAmountInput] = useState<string>("");
  const [recordingMovement, setRecordingMovement] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const fmt = (val: number) => formatCurrency(val, currency);

  const fetchActiveRegister = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient.get("/pos/register/active");
      if (res.data?.success) {
        const session = res.data.data || null;
        setActiveSession(session);
        setClosingCashInput("");
        setClosingNotes("");
        setAcknowledgePendingOrders(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load active cash register status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccessMsg("");
      setOpeningFloatInput("");
      fetchActiveRegister();
    }
  }, [isOpen]);

  // Block Escape key dismissal while opening cash is mandatory
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mandatoryOpen && !activeSession) {
          e.preventDefault();
          e.stopPropagation();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, mandatoryOpen, activeSession, onClose]);

  const handleOpenRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    const trimmed = openingFloatInput.trim();
    if (trimmed === "") {
      setError("Please enter the opening cash float amount (enter 0 if starting with zero cash).");
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Opening cash must be a valid non-negative number.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post("/pos/register/open", { openingFloat: parsed });
      if (res.data?.success && res.data.data) {
        const openedSession = res.data.data;
        setActiveSession(openedSession);
        setOpeningFloatInput("");
        if (onSessionChanged) {
          onSessionChanged(openedSession, `Cash register shift opened with ${fmt(openedSession.openingFloat)} float.`);
        }
        onClose();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to open cash register.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordCashMovement = async () => {
    if (!activeSession) return;
    setError("");
    setSuccessMsg("");
    const trimmed = movementAmountInput.trim();
    const parsed = Number(trimmed);
    if (trimmed === "" || !Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid positive amount for Cash In / Cash Out.");
      return;
    }

    try {
      setRecordingMovement(true);
      const res = await apiClient.post("/pos/register/cash-movement", {
        sessionId: activeSession.id,
        type: movementType,
        amount: parsed,
      });
      if (res.data?.success && res.data.data) {
        setActiveSession(res.data.data);
        setMovementAmountInput("");
        setSuccessMsg(`Cash ${movementType === "IN" ? "In" : "Out"} of ${fmt(parsed)} recorded.`);
        if (onSessionChanged) {
          onSessionChanged(res.data.data);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to record cash movement.");
    } finally {
      setRecordingMovement(false);
    }
  };

  const handleCloseRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeSession) return;
    setError("");
    setSuccessMsg("");

    if ((hasUnpaidCart || heldOrdersCount > 0) && !acknowledgePendingOrders) {
      setError("Please review the unpaid cart / held orders warning and confirm before closing the shift.");
      return;
    }

    const trimmed = closingCashInput.trim();
    if (trimmed === "") {
      setError("Please enter the actual counted closing cash amount.");
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Actual closing cash must be a valid non-negative number.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post("/pos/register/close", {
        sessionId: activeSession.id,
        closingCash: parsed,
        closingNotes: closingNotes.trim() || undefined,
      });
      if (res.data?.success) {
        setActiveSession(null);
        setClosingCashInput("");
        setClosingNotes("");
        if (onSessionChanged) {
          onSessionChanged(null, "Cash register shift closed and reconciled successfully.");
        }
        onClose();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to close register.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isLockedOpening = mandatoryOpen && !activeSession;
  const parsedClosing = closingCashInput.trim() !== "" && Number.isFinite(Number(closingCashInput))
    ? Number(closingCashInput)
    : null;
  const liveDiff =
    activeSession && parsedClosing !== null
      ? Math.round((parsedClosing - Number(activeSession.expectedCash || 0)) * 100) / 100
      : null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLockedOpening) {
          onClose();
        }
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
        style={{ maxWidth: activeSession ? "600px" : "480px" }}
      >
        <div className="modal-content">
          <div className="modal-header border-bottom py-3">
            <h5 className="modal-title fs-16 fw-bold">
              <i className="feather-inbox me-2 text-primary"></i> Cash Register &amp; Shift Reconciliation
            </h5>
            {!isLockedOpening && (
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            )}
          </div>

          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger py-2 fs-13 mb-3">
                <i className="ti ti-alert-circle me-1" />
                {error}
              </div>
            )}
            {successMsg && (
              <div className="alert alert-success py-2 fs-13 mb-3">
                <i className="ti ti-circle-check me-1" />
                {successMsg}
              </div>
            )}

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="mt-2 text-muted fs-13">Checking active register shift...</div>
              </div>
            ) : activeSession ? (
              <form onSubmit={handleCloseRegister} noValidate>
                <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded border">
                  <div>
                    <h6 className="fw-bold mb-1">{activeSession.registerName || "Checkout Register"}</h6>
                    <div className="fs-12 text-muted">
                      Cashier: <strong>{activeSession.cashierName}</strong>
                    </div>
                    <div className="fs-12 text-muted">
                      Opened: {new Date(activeSession.openedAt).toLocaleDateString()}{" "}
                      {new Date(activeSession.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span className="badge bg-success-transparent text-success px-3 py-2 fw-bold">
                    Shift Open
                  </span>
                </div>

                {/* Cash Drawer Reconciliation Breakdown */}
                <div className="table-responsive mb-3">
                  <table className="table table-sm fs-13 mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted">Opening Cash (Float):</td>
                        <td className="text-end fw-bold">{fmt(Number(activeSession.openingFloat || 0))}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Total Cash Sales ({activeSession.salesCount || 0} Orders):</td>
                        <td className="text-end fw-bold text-success">+{fmt(Number(activeSession.cashSalesTotal || 0))}</td>
                      </tr>
                      {Number(activeSession.splitCashTotal || 0) > 0 && (
                        <tr>
                          <td className="text-muted ps-3">↳ Cash Component of Split Payments (included above):</td>
                          <td className="text-end text-muted">{fmt(Number(activeSession.splitCashTotal))}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Cash Refunds:</td>
                        <td className="text-end fw-bold text-danger">-{fmt(Number(activeSession.cashRefundsTotal || 0))}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Cash In:</td>
                        <td className="text-end fw-bold text-success">+{fmt(Number(activeSession.cashIn || 0))}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Cash Out:</td>
                        <td className="text-end fw-bold text-danger">-{fmt(Number(activeSession.cashOut || 0))}</td>
                      </tr>
                      <tr className="table-active">
                        <td className="fw-bold">Expected Cash in Drawer:</td>
                        <td className="text-end fw-bold text-primary fs-15">
                          {fmt(Number(activeSession.expectedCash || 0))}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted pt-2">Card Payments (Non-Drawer):</td>
                        <td className="text-end text-muted pt-2">{fmt(Number(activeSession.cardSalesTotal || 0))}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Bank Payments (Non-Drawer):</td>
                        <td className="text-end text-muted">{fmt(Number(activeSession.bankSalesTotal || 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Quick Cash In / Cash Out Entry */}
                <div className="p-2 mb-3 bg-light rounded border">
                  <label className="form-label fs-12 fw-semibold mb-1">Record Cash In / Cash Out (Optional)</label>
                  <div className="input-group input-group-sm">
                    <select
                      className="form-select"
                      style={{ maxWidth: "110px" }}
                      value={movementType}
                      onChange={(e) => setMovementType(e.target.value as "IN" | "OUT")}
                    >
                      <option value="IN">Cash In</option>
                      <option value="OUT">Cash Out</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      placeholder="Amount"
                      value={movementAmountInput}
                      onChange={(e) => setMovementAmountInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleRecordCashMovement}
                      disabled={recordingMovement}
                    >
                      {recordingMovement ? "..." : "Record"}
                    </button>
                  </div>
                </div>

                {/* Warning for unpaid cart / held orders */}
                {(hasUnpaidCart || heldOrdersCount > 0) && (
                  <div className="alert alert-warning py-2 fs-12 mb-3">
                    <div className="fw-bold mb-1">
                      <i className="ti ti-alert-triangle me-1" />
                      Active Unpaid Items Detected
                    </div>
                    <p className="mb-2">
                      {hasUnpaidCart ? "You currently have unpaid items in the POS cart. " : ""}
                      {heldOrdersCount > 0 ? `You have ${heldOrdersCount} held order(s). ` : ""}
                      Closing the shift will lock POS selling until a new shift is opened.
                    </p>
                    <div className="form-check mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="ack-pending-orders"
                        checked={acknowledgePendingOrders}
                        onChange={(e) => setAcknowledgePendingOrders(e.target.checked)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="ack-pending-orders">
                        I confirm I want to close this register shift now.
                      </label>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">
                    Actual Counted Closing Cash ({currency?.symbol || "Rs"}) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control form-control-lg"
                    placeholder="Enter counted physical cash in drawer"
                    value={closingCashInput}
                    onChange={(e) => setClosingCashInput(e.target.value)}
                    required
                  />
                  {liveDiff !== null && (
                    <div className="d-flex justify-content-between mt-1 fs-12">
                      <span className="text-muted">Cash Difference ({liveDiff === 0 ? "Balanced" : liveDiff > 0 ? "Excess" : "Shortage"}):</span>
                      <span
                        className={`fw-bold ${
                          liveDiff === 0 ? "text-primary" : liveDiff > 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {liveDiff > 0 ? "+" : ""}
                        {fmt(liveDiff)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">Closing Notes (Optional)</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="Optional notes regarding drawer count or variance"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                  />
                </div>

                <div className="d-flex gap-2">
                  {onReturnToDashboard && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary flex-fill py-2"
                      onClick={onReturnToDashboard}
                      disabled={submitting}
                    >
                      Return to Dashboard
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-danger flex-fill py-2 fw-semibold"
                    disabled={submitting}
                  >
                    {submitting ? "Closing Shift..." : "Close Register & End Shift"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOpenRegister} noValidate>
                <div className="alert alert-light border fs-13 mb-3">
                  <strong>Shift Required:</strong> Please count and enter your actual opening cash float to unlock POS selling. Enter <strong>0</strong> if starting with zero cash.
                </div>
                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">
                    Opening Cash Float ({currency?.symbol || "Rs"}) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control form-control-lg"
                    placeholder="Enter actual opening cash amount"
                    value={openingFloatInput}
                    onChange={(e) => setOpeningFloatInput(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold mb-2"
                  disabled={submitting}
                >
                  {submitting ? "Opening Register..." : "Open Cash Drawer & Start Shift"}
                </button>
                {onReturnToDashboard && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 py-2"
                    onClick={onReturnToDashboard}
                    disabled={submitting}
                  >
                    <i className="ti ti-arrow-left me-1" />
                    Return to Dashboard
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
