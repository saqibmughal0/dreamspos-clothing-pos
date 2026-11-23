import React, { useState, useEffect, useCallback } from "react";
import SettingsSideBar from "../settingssidebar";
import RefreshIcon from "../../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../../core/common/tooltip-content/collapes";
import CommonFooter from "../../../core/common/footer/commonFooter";
import { apiClient } from "../../../core/apiClient";
import { extractApiError, formatCurrency } from "../../../core/utils/businessSettings";

const DEFAULT_CURRENCY = {
  code: "PKR",
  symbol: "Rs",
  position: "PREFIX",
};

const PRESETS = [
  { code: "PKR", symbol: "Rs", name: "Pakistani Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "SAR", symbol: "SAR", name: "Saudi Riyal" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

const CurrencySettings = () => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [savedCurrency, setSavedCurrency] = useState(DEFAULT_CURRENCY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/settings");
      const s = res.data?.data || {};
      const loaded = {
        code: s.currency?.code || "PKR",
        symbol: s.currency?.symbol || "Rs",
        position: s.currency?.position === "SUFFIX" ? "SUFFIX" : "PREFIX",
      };
      setCurrency(loaded);
      setSavedCurrency(loaded);
    } catch (err) {
      setError(extractApiError(err, "Failed to load currency settings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currency.code.trim()) {
      setError("Currency code is required (e.g. PKR).");
      return;
    }
    if (!currency.symbol.trim()) {
      setError("Currency symbol is required (e.g. Rs).");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        currency: {
          code: currency.code.trim().toUpperCase(),
          symbol: currency.symbol.trim(),
          position: currency.position === "SUFFIX" ? "SUFFIX" : "PREFIX",
        },
      };
      const res = await apiClient.put("/settings", payload);
      const updated = res.data?.data?.currency;
      if (updated) {
        const synced = { ...DEFAULT_CURRENCY, ...updated };
        setCurrency(synced);
        setSavedCurrency(synced);
      }
      setSuccess("Currency settings saved successfully.");
    } catch (err) {
      setError(extractApiError(err, "Failed to save currency settings."));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrency(savedCurrency);
    setError("");
    setSuccess("");
  };

  return (
    <div>
      <div className="page-wrapper">
        <div className="content settings-content">
          <div className="page-header settings-pg-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Settings</h4>
                <h6>Configure your active POS currency and formatting</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon onClick={loadSettings} />
              <CollapesIcon />
            </ul>
          </div>
          <div className="row">
            <div className="col-xl-12">
              <div className="settings-wrapper d-flex">
                <SettingsSideBar />
                <div className="card flex-fill mb-0">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h4 className="fs-18 fw-bold mb-0">Currency Settings</h4>
                    <span className="badge bg-success-transparent text-success">
                      Default: PKR (Rs)
                    </span>
                  </div>
                  <div className="card-body">
                    {error && (
                      <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="ti ti-alert-circle me-2" />
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError("")} aria-label="Close" />
                      </div>
                    )}
                    {success && (
                      <div className="alert alert-success alert-dismissible fade show" role="alert">
                        <i className="ti ti-circle-check me-2" />
                        {success}
                        <button type="button" className="btn-close" onClick={() => setSuccess("")} aria-label="Close" />
                      </div>
                    )}

                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status" />
                        <p className="mt-2 text-muted mb-0">Loading currency settings...</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} noValidate>
                        <div className="mb-4">
                          <label className="form-label fw-medium">Quick Currency Presets</label>
                          <div className="d-flex flex-wrap gap-2">
                            {PRESETS.map((p) => (
                              <button
                                key={p.code}
                                type="button"
                                className={`btn btn-sm ${currency.code === p.code ? "btn-primary" : "btn-outline-secondary"}`}
                                onClick={() => {
                                  setCurrency((prev) => ({ ...prev, code: p.code, symbol: p.symbol }));
                                  setSuccess("");
                                }}
                              >
                                {p.code} ({p.symbol}) — {p.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4 mb-3">
                            <label className="form-label">
                              Currency Code <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              maxLength={10}
                              value={currency.code}
                              onChange={(e) => {
                                setCurrency((prev) => ({ ...prev, code: e.target.value }));
                                setSuccess("");
                              }}
                              placeholder="PKR"
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label">
                              Currency Symbol <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              maxLength={10}
                              value={currency.symbol}
                              onChange={(e) => {
                                setCurrency((prev) => ({ ...prev, symbol: e.target.value }));
                                setSuccess("");
                              }}
                              placeholder="Rs"
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label">Symbol Position</label>
                            <select
                              className="form-select"
                              value={currency.position}
                              onChange={(e) => {
                                setCurrency((prev) => ({ ...prev, position: e.target.value }));
                                setSuccess("");
                              }}
                            >
                              <option value="PREFIX">Before Amount (e.g. {currency.symbol || "Rs"} 1,500.00)</option>
                              <option value="SUFFIX">After Amount (e.g. 1,500.00 {currency.symbol || "Rs"})</option>
                            </select>
                          </div>
                        </div>

                        <div className="alert alert-light border d-flex align-items-center justify-content-between mb-4">
                          <div>
                            <span className="text-muted">Receipt &amp; Invoice Preview:</span>
                            <strong className="ms-2 fs-16">{formatCurrency(4850, currency)}</strong>
                          </div>
                          <span className="text-muted fs-12">Applied across POS, Dashboard, Invoices &amp; Receipts</span>
                        </div>

                        <div className="text-end settings-bottom-btn mt-0">
                          <button
                            type="button"
                            className="btn btn-secondary me-2"
                            onClick={handleCancel}
                            disabled={saving}
                          >
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
    </div>
  );
};

export default CurrencySettings;
