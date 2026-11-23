import React, { useState, useEffect, useCallback } from "react";
import SettingsSideBar from "../settingssidebar";
import CommonFooter from "../../../core/common/footer/commonFooter";
import RefreshIcon from "../../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../../core/common/tooltip-content/collapes";
import { apiClient } from "../../../core/apiClient";
import { extractApiError } from "../../../core/utils/businessSettings";

const DEFAULT_PRINTER = {
  paperSize: "80mm",
  autoCut: true,
  openCashDrawer: true,
};

const DEFAULT_BARCODE = {
  paperFormat: "40mm x 30mm",
  showStoreName: true,
  showPrice: true,
  showVariantSize: true,
  showVariantColor: true,
};

const PrinterSettings = () => {
  const [printer, setPrinter] = useState(DEFAULT_PRINTER);
  const [barcodeLabel, setBarcodeLabel] = useState(DEFAULT_BARCODE);
  const [savedState, setSavedState] = useState({ printer: DEFAULT_PRINTER, barcodeLabel: DEFAULT_BARCODE });
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
      const loadedPrinter = {
        paperSize: s.printer?.paperSize === "58mm" ? "58mm" : "80mm",
        autoCut: Boolean(s.printer?.autoCut ?? true),
        openCashDrawer: Boolean(s.printer?.openCashDrawer ?? true),
      };
      const loadedBarcode = {
        paperFormat: s.barcodeLabel?.paperFormat || "40mm x 30mm",
        showStoreName: Boolean(s.barcodeLabel?.showStoreName ?? true),
        showPrice: Boolean(s.barcodeLabel?.showPrice ?? true),
        showVariantSize: Boolean(s.barcodeLabel?.showVariantSize ?? true),
        showVariantColor: Boolean(s.barcodeLabel?.showVariantColor ?? true),
      };
      setPrinter(loadedPrinter);
      setBarcodeLabel(loadedBarcode);
      setSavedState({ printer: loadedPrinter, barcodeLabel: loadedBarcode });
    } catch (err) {
      setError(extractApiError(err, "Failed to load printer settings."));
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
    setSaving(true);
    try {
      const res = await apiClient.put("/settings", { printer, barcodeLabel });
      const updated = res.data?.data;
      if (updated) {
        const syncedPrinter = { ...DEFAULT_PRINTER, ...(updated.printer || {}) };
        const syncedBarcode = { ...DEFAULT_BARCODE, ...(updated.barcodeLabel || {}) };
        setPrinter(syncedPrinter);
        setBarcodeLabel(syncedBarcode);
        setSavedState({ printer: syncedPrinter, barcodeLabel: syncedBarcode });
      }
      setSuccess("Printer and barcode label settings saved successfully.");
    } catch (err) {
      setError(extractApiError(err, "Failed to save printer settings."));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPrinter(savedState.printer);
    setBarcodeLabel(savedState.barcodeLabel);
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
                <h6>Configure thermal receipt printer and barcode label defaults</h6>
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
                    <h4 className="fs-18 fw-bold mb-0">Thermal Printer &amp; Label Settings</h4>
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
                        <p className="mt-2 text-muted mb-0">Loading printer settings...</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit}>
                        <div className="border-bottom mb-3 pb-3">
                          <h6 className="fs-16 fw-bold mb-3">
                            <i className="ti ti-printer me-2" />
                            Receipt Printer Configuration
                          </h6>
                          <div className="row align-items-center mb-3">
                            <div className="col-sm-4">
                              <h6 className="mb-1 fw-medium">Thermal Paper Width</h6>
                              <p className="text-muted fs-13 mb-0">Default paper size for POS receipt preview and printing</p>
                            </div>
                            <div className="col-sm-6">
                              <div className="d-flex gap-3">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="paperSize"
                                    id="paper80mm"
                                    value="80mm"
                                    checked={printer.paperSize === "80mm"}
                                    onChange={() => {
                                      setPrinter((p) => ({ ...p, paperSize: "80mm" }));
                                      setSuccess("");
                                    }}
                                  />
                                  <label className="form-check-label fw-medium" htmlFor="paper80mm">
                                    80mm (Standard Thermal)
                                  </label>
                                </div>
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="paperSize"
                                    id="paper58mm"
                                    value="58mm"
                                    checked={printer.paperSize === "58mm"}
                                    onChange={() => {
                                      setPrinter((p) => ({ ...p, paperSize: "58mm" }));
                                      setSuccess("");
                                    }}
                                  />
                                  <label className="form-check-label fw-medium" htmlFor="paper58mm">
                                    58mm (Compact Thermal)
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="row align-items-center mb-3">
                            <div className="col-sm-4">
                              <h6 className="mb-1 fw-medium">Auto-Cut Paper</h6>
                              <p className="text-muted fs-13 mb-0">Automatically cut receipt after printing</p>
                            </div>
                            <div className="col-sm-4">
                              <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                                <input
                                  type="checkbox"
                                  id="printer-autocut"
                                  className="check"
                                  checked={printer.autoCut}
                                  onChange={(e) => {
                                    setPrinter((p) => ({ ...p, autoCut: e.target.checked }));
                                    setSuccess("");
                                  }}
                                />
                                <label htmlFor="printer-autocut" className="checktoggle" />
                              </div>
                            </div>
                          </div>

                          <div className="row align-items-center">
                            <div className="col-sm-4">
                              <h6 className="mb-1 fw-medium">Open Cash Drawer</h6>
                              <p className="text-muted fs-13 mb-0">Trigger cash drawer pulse when printing receipt</p>
                            </div>
                            <div className="col-sm-4">
                              <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                                <input
                                  type="checkbox"
                                  id="printer-drawer"
                                  className="check"
                                  checked={printer.openCashDrawer}
                                  onChange={(e) => {
                                    setPrinter((p) => ({ ...p, openCashDrawer: e.target.checked }));
                                    setSuccess("");
                                  }}
                                />
                                <label htmlFor="printer-drawer" className="checktoggle" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <h6 className="fs-16 fw-bold mb-3">
                            <i className="ti ti-barcode me-2" />
                            Barcode Label Defaults
                          </h6>
                          <div className="row align-items-center mb-3">
                            <div className="col-sm-4">
                              <h6 className="mb-1 fw-medium">Label Paper Format</h6>
                            </div>
                            <div className="col-sm-4">
                              <select
                                className="form-select"
                                value={barcodeLabel.paperFormat}
                                onChange={(e) => {
                                  setBarcodeLabel((b) => ({ ...b, paperFormat: e.target.value }));
                                  setSuccess("");
                                }}
                              >
                                <option value="40mm x 30mm">40mm x 30mm</option>
                                <option value="50mm x 25mm">50mm x 25mm</option>
                                <option value="58mm x 40mm">58mm x 40mm</option>
                                <option value="A4 Sheet">A4 Sheet</option>
                              </select>
                            </div>
                          </div>
                          <div className="row g-3">
                            {[
                              { key: "showStoreName", label: "Show Shop Name on Label" },
                              { key: "showPrice", label: "Show Price on Label" },
                              { key: "showVariantSize", label: "Show Size on Label" },
                              { key: "showVariantColor", label: "Show Color on Label" },
                            ].map((opt) => (
                              <div className="col-sm-6" key={opt.key}>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`label-${opt.key}`}
                                    checked={barcodeLabel[opt.key]}
                                    onChange={(e) => {
                                      setBarcodeLabel((b) => ({ ...b, [opt.key]: e.target.checked }));
                                      setSuccess("");
                                    }}
                                  />
                                  <label className="form-check-label" htmlFor={`label-${opt.key}`}>
                                    {opt.label}
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-end settings-bottom-btn mt-4">
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

export default PrinterSettings;
