import React, { useState, useEffect, useCallback } from 'react';
import SettingsSideBar from '../settingssidebar';
import RefreshIcon from '../../../core/common/tooltip-content/refresh';
import CollapesIcon from '../../../core/common/tooltip-content/collapes';
import CommonFooter from '../../../core/common/footer/commonFooter';
import { apiClient } from '../../../core/apiClient';
import { extractApiError } from '../../../core/utils/businessSettings';

const DEFAULT_RECEIPT = {
    headerMessage: '',
    footerMessage: 'Thank you for your purchase!',
    showBarcode: true,
    showCashier: true,
    showCustomer: true,
};

const DEFAULT_POLICIES = {
    returnWindowDays: 7,
    exchangeWindowDays: 14,
    terms: '',
};

const PosSettings = () => {
    const [receipt, setReceipt] = useState(DEFAULT_RECEIPT);
    const [policies, setPolicies] = useState(DEFAULT_POLICIES);
    const [savedState, setSavedState] = useState({ receipt: DEFAULT_RECEIPT, policies: DEFAULT_POLICIES });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadSettings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get('/settings');
            const s = res.data?.data || {};
            const loadedReceipt = {
                headerMessage: s.receipt?.headerMessage || '',
                footerMessage: s.receipt?.footerMessage ?? 'Thank you for your purchase!',
                showBarcode: Boolean(s.receipt?.showBarcode ?? true),
                showCashier: Boolean(s.receipt?.showCashier ?? true),
                showCustomer: Boolean(s.receipt?.showCustomer ?? true),
            };
            const loadedPolicies = {
                returnWindowDays: Number(s.policies?.returnWindowDays ?? 7),
                exchangeWindowDays: Number(s.policies?.exchangeWindowDays ?? 14),
                terms: s.policies?.terms || '',
            };
            setReceipt(loadedReceipt);
            setPolicies(loadedPolicies);
            setSavedState({ receipt: loadedReceipt, policies: loadedPolicies });
        } catch (err) {
            setError(extractApiError(err, 'Failed to load POS and receipt settings.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const retDays = Number(policies.returnWindowDays);
        const exchDays = Number(policies.exchangeWindowDays);
        if (Number.isNaN(retDays) || retDays < 0 || retDays > 365) {
            setError('Return window days must be between 0 and 365.');
            return;
        }
        if (Number.isNaN(exchDays) || exchDays < 0 || exchDays > 365) {
            setError('Exchange window days must be between 0 and 365.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                receipt: {
                    headerMessage: receipt.headerMessage.trim(),
                    footerMessage: receipt.footerMessage.trim(),
                    showBarcode: Boolean(receipt.showBarcode),
                    showCashier: Boolean(receipt.showCashier),
                    showCustomer: Boolean(receipt.showCustomer),
                },
                policies: {
                    returnWindowDays: retDays,
                    exchangeWindowDays: exchDays,
                    terms: policies.terms.trim(),
                },
            };
            const res = await apiClient.put('/settings', payload);
            const updated = res.data?.data;
            if (updated) {
                const syncedReceipt = { ...DEFAULT_RECEIPT, ...(updated.receipt || {}) };
                const syncedPolicies = { ...DEFAULT_POLICIES, ...(updated.policies || {}) };
                setReceipt(syncedReceipt);
                setPolicies(syncedPolicies);
                setSavedState({ receipt: syncedReceipt, policies: syncedPolicies });
            }
            setSuccess('POS receipt and return policy settings saved successfully.');
        } catch (err) {
            setError(extractApiError(err, 'Failed to save POS and receipt settings.'));
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setReceipt(savedState.receipt);
        setPolicies(savedState.policies);
        setError('');
        setSuccess('');
    };

    return (
        <div>
            <div className="page-wrapper">
                <div className="content settings-content">
                    <div className="page-header settings-pg-header">
                        <div className="add-item d-flex">
                            <div className="page-title">
                                <h4>Settings</h4>
                                <h6>Configure POS receipt layout, messages, and return/exchange policies</h6>
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
                                        <h4 className="fs-18 fw-bold mb-0">POS &amp; Receipt Settings</h4>
                                    </div>
                                    <div className="card-body">
                                        {error && (
                                            <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                                <i className="ti ti-alert-circle me-2" />
                                                {error}
                                                <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close" />
                                            </div>
                                        )}
                                        {success && (
                                            <div className="alert alert-success alert-dismissible fade show" role="alert">
                                                <i className="ti ti-circle-check me-2" />
                                                {success}
                                                <button type="button" className="btn-close" onClick={() => setSuccess('')} aria-label="Close" />
                                            </div>
                                        )}

                                        {loading ? (
                                            <div className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status" />
                                                <p className="mt-2 text-muted mb-0">Loading POS &amp; receipt settings...</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmit} noValidate>
                                                <div className="border-bottom mb-3 pb-3">
                                                    <h6 className="fs-16 fw-bold mb-3">
                                                        <i className="ti ti-receipt me-2" />
                                                        Receipt Display Options
                                                    </h6>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Receipt Header Message (Optional)</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={receipt.headerMessage}
                                                                    onChange={(e) => {
                                                                        setReceipt((r) => ({ ...r, headerMessage: e.target.value }));
                                                                        setSuccess('');
                                                                    }}
                                                                    placeholder="Optional greeting or tagline shown at top of receipt"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Receipt Footer Message</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={receipt.footerMessage}
                                                                    onChange={(e) => {
                                                                        setReceipt((r) => ({ ...r, footerMessage: e.target.value }));
                                                                        setSuccess('');
                                                                    }}
                                                                    placeholder="Thank you for your purchase!"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row g-3 mt-1">
                                                        <div className="col-md-4">
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id="receipt-show-barcode"
                                                                    checked={receipt.showBarcode}
                                                                    onChange={(e) => {
                                                                        setReceipt((r) => ({ ...r, showBarcode: e.target.checked }));
                                                                        setSuccess('');
                                                                    }}
                                                                />
                                                                <label className="form-check-label" htmlFor="receipt-show-barcode">
                                                                    Show Invoice Barcode
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id="receipt-show-cashier"
                                                                    checked={receipt.showCashier}
                                                                    onChange={(e) => {
                                                                        setReceipt((r) => ({ ...r, showCashier: e.target.checked }));
                                                                        setSuccess('');
                                                                    }}
                                                                />
                                                                <label className="form-check-label" htmlFor="receipt-show-cashier">
                                                                    Show Cashier Name
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id="receipt-show-customer"
                                                                    checked={receipt.showCustomer}
                                                                    onChange={(e) => {
                                                                        setReceipt((r) => ({ ...r, showCustomer: e.target.checked }));
                                                                        setSuccess('');
                                                                    }}
                                                                />
                                                                <label className="form-check-label" htmlFor="receipt-show-customer">
                                                                    Show Customer Name
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <h6 className="fs-16 fw-bold mb-3">
                                                        <i className="ti ti-refresh me-2" />
                                                        Return &amp; Exchange Policy
                                                    </h6>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Return Window (Days)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="365"
                                                                    className="form-control"
                                                                    value={policies.returnWindowDays}
                                                                    onChange={(e) => {
                                                                        setPolicies((p) => ({ ...p, returnWindowDays: e.target.value }));
                                                                        setSuccess('');
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Exchange Window (Days)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="365"
                                                                    className="form-control"
                                                                    value={policies.exchangeWindowDays}
                                                                    onChange={(e) => {
                                                                        setPolicies((p) => ({ ...p, exchangeWindowDays: e.target.value }));
                                                                        setSuccess('');
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-12">
                                                            <div className="mb-3">
                                                                <label className="form-label">Policy Terms Printed on Receipt (Optional)</label>
                                                                <textarea
                                                                    rows={3}
                                                                    className="form-control"
                                                                    value={policies.terms}
                                                                    onChange={(e) => {
                                                                        setPolicies((p) => ({ ...p, terms: e.target.value }));
                                                                        setSuccess('');
                                                                    }}
                                                                    placeholder="Enter your return/exchange terms (optional)"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center justify-content-end">
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary me-2"
                                                        onClick={handleCancel}
                                                        disabled={saving}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                                        {saving ? 'Saving...' : 'Save Changes'}
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

export default PosSettings;
