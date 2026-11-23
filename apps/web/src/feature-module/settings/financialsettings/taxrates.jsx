import React, { useState, useEffect, useCallback } from "react";
import SettingsSideBar from "../settingssidebar";
import RefreshIcon from "../../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../../core/common/tooltip-content/collapes";
import CommonFooter from "../../../core/common/footer/commonFooter";
import { apiClient } from "../../../core/apiClient";
import { extractApiError } from "../../../core/utils/businessSettings";

const DEFAULT_TAX = {
  rate: 0,
  type: "EXCLUSIVE",
};

const TaxRates = () => {
  const [tax, setTax] = useState(DEFAULT_TAX);
  const [savedTax, setSavedTax] = useState(DEFAULT_TAX);
  const [taxNumber, setTaxNumber] = useState("");
  const [savedTaxNumber, setSavedTaxNumber] = useState("");
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
      const loadedTax = {
        rate: Number(s.tax?.rate ?? 0),
        type: s.tax?.type === "INCLUSIVE" ? "INCLUSIVE" : "EXCLUSIVE",
      };
      const loadedTaxNumber = s.taxNumber || "";
      setTax(loadedTax);
      setSavedTax(loadedTax);
      setTaxNumber(loadedTaxNumber);
      setSavedTaxNumber(loadedTaxNumber);
    } catch (err) {
      setError(extractApiError(err, "Failed to load tax settings."));
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

    const numericRate = Number(tax.rate);
    if (Number.isNaN(numericRate) || numericRate < 0 || numericRate > 100) {
      setError("Tax rate must be a number between 0 and 100.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tax: {
          rate: numericRate,
          type: tax.type,
        },
        taxNumber: taxNumber.trim(),
      };
      const res = await apiClient.put("/settings", payload);
      const updated = res.data?.data;
      if (updated) {
        const syncedTax = {
          rate: Number(updated.tax?.rate ?? numericRate),
          type: updated.tax?.type === "INCLUSIVE" ? "INCLUSIVE" : "EXCLUSIVE",
        };
        const syncedTaxNum = updated.taxNumber || "";
        setTax(syncedTax);
        setSavedTax(syncedTax);
        setTaxNumber(syncedTaxNum);
        setSavedTaxNumber(syncedTaxNum);
      }
      setSuccess("Tax settings saved successfully. New POS sales will use this rate without altering historical sales.");
    } catch (err) {
      setError(extractApiError(err, "Failed to save tax settings."));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTax(savedTax);
    setTaxNumber(savedTaxNumber);
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
                <h6>Configure default sales tax rate and registration details</h6>
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
                  <div className="card-header">
                    <h4 className="fs-18 fw-bold mb-0">Tax Settings</h4>
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
                        <p className="mt-2 text-muted mb-0">Loading tax settings...</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} noValidate>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">
                                Default Sales Tax Rate (%) <span className="text-danger">*</span>
                              </label>
                              <div className="input-group">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  className="form-control"
                                  value={tax.rate}
                                  onChange={(e) => {
                                    setTax((prev) => ({ ...prev, rate: e.target.value }));
                                    setSuccess("");
                                  }}
                                />
                                <span className="input-group-text">%</span>
                              </div>
                              <small className="text-muted">
                                Set to 0 if your store does not charge separate sales tax.
                              </small>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Tax Registration / NTN Number (Optional)</label>
                              <input
                                type="text"
                                className="form-control"
                                value={taxNumber}
                                onChange={(e) => {
                                  setTaxNumber(e.target.value);
                                  setSuccess("");
                                }}
                                placeholder="Optional NTN / STRN / Tax ID"
                              />
                              <small className="text-muted">
                                Printed on thermal receipts and invoices when set.
                              </small>
                            </div>
                          </div>

                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className="form-label d-block">Tax Calculation Mode</label>
                              <div className="d-flex gap-4">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="taxType"
                                    id="taxExclusive"
                                    value="EXCLUSIVE"
                                    checked={tax.type === "EXCLUSIVE"}
                                    onChange={() => {
                                      setTax((prev) => ({ ...prev, type: "EXCLUSIVE" }));
                                      setSuccess("");
                                    }}
                                  />
                                  <label className="form-check-label" htmlFor="taxExclusive">
                                    <strong>Exclusive</strong> — Tax is added on top of item prices at checkout
                                  </label>
                                </div>
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="taxType"
                                    id="taxInclusive"
                                    value="INCLUSIVE"
                                    checked={tax.type === "INCLUSIVE"}
                                    onChange={() => {
                                      setTax((prev) => ({ ...prev, type: "INCLUSIVE" }));
                                      setSuccess("");
                                    }}
                                  />
                                  <label className="form-check-label" htmlFor="taxInclusive">
                                    <strong>Inclusive</strong> — Item prices already include tax
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-end settings-bottom-btn mt-3">
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

export default TaxRates;
