import React, { useState, useEffect, useCallback } from 'react';
import SettingsSideBar from '../settingssidebar';
import CommonFooter from '../../../core/common/footer/commonFooter';
import RefreshIcon from '../../../core/common/tooltip-content/refresh';
import CollapesIcon from '../../../core/common/tooltip-content/collapes';
import { apiClient } from '../../../core/apiClient';
import { extractApiError } from '../../../core/utils/businessSettings';

const PREFIX_FIELDS = [
    { key: 'product', label: 'Product (SKU)', placeholder: 'SKU-' },
    { key: 'supplier', label: 'Supplier', placeholder: 'SUP-' },
    { key: 'purchase', label: 'Purchase', placeholder: 'PU-' },
    { key: 'purchaseReturn', label: 'Purchase Return', placeholder: 'PR-' },
    { key: 'sale', label: 'Sales', placeholder: 'SA-' },
    { key: 'saleReturn', label: 'Sales Return', placeholder: 'SR-' },
    { key: 'customer', label: 'Customer', placeholder: 'CT-' },
    { key: 'expense', label: 'Expense', placeholder: 'EX-' },
    { key: 'stockTransfer', label: 'Stock Transfer', placeholder: 'ST-' },
    { key: 'stockAdjustment', label: 'Stock Adjustment', placeholder: 'SAJ-' },
    { key: 'salesOrder', label: 'Sales Order', placeholder: 'SO-' },
    { key: 'posInvoice', label: 'POS Invoice', placeholder: 'INV-' },
    { key: 'estimation', label: 'Estimation / Quotation', placeholder: 'EST-' },
    { key: 'transaction', label: 'Transaction', placeholder: 'TRN-' },
    { key: 'employee', label: 'Employee', placeholder: 'EMP-' },
];

const DEFAULT_PREFIXES = {
    product: 'SKU-',
    supplier: 'SUP-',
    purchase: 'PU-',
    purchaseReturn: 'PR-',
    sale: 'SA-',
    saleReturn: 'SR-',
    customer: 'CT-',
    expense: 'EX-',
    stockTransfer: 'ST-',
    stockAdjustment: 'SAJ-',
    salesOrder: 'SO-',
    posInvoice: 'INV-',
    estimation: 'EST-',
    transaction: 'TRN-',
    employee: 'EMP-',
};

const Prefixes = () => {
    const [prefixes, setPrefixes] = useState(DEFAULT_PREFIXES);
    const [savedPrefixes, setSavedPrefixes] = useState(DEFAULT_PREFIXES);
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
            const loaded = { ...DEFAULT_PREFIXES, ...(s.prefixes || {}) };
            setPrefixes(loaded);
            setSavedPrefixes(loaded);
        } catch (err) {
            setError(extractApiError(err, 'Failed to load prefix settings.'));
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

        const trimmed = {};
        for (const f of PREFIX_FIELDS) {
            const val = String(prefixes[f.key] || '').trim();
            if (val.length > 20) {
                setError(`${f.label} prefix must be 20 characters or less.`);
                return;
            }
            trimmed[f.key] = val;
        }

        setSaving(true);
        try {
            const res = await apiClient.put('/settings', { prefixes: trimmed });
            const updated = res.data?.data?.prefixes;
            if (updated) {
                const synced = { ...DEFAULT_PREFIXES, ...updated };
                setPrefixes(synced);
                setSavedPrefixes(synced);
            }
            setSuccess('Document prefixes saved successfully.');
        } catch (err) {
            setError(extractApiError(err, 'Failed to save prefix settings.'));
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setPrefixes(savedPrefixes);
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
                                <h6>Configure document and reference number prefixes</h6>
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
                                        <h4 className="fs-18 fw-bold mb-0">Prefixes</h4>
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
                                                <p className="mt-2 text-muted mb-0">Loading prefixes...</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmit} noValidate>
                                                <div className="row">
                                                    {PREFIX_FIELDS.map((field) => (
                                                        <div className="col-xl-3 col-lg-6 col-md-4 col-sm-6" key={field.key}>
                                                            <div className="mb-3">
                                                                <label className="form-label">{field.label}</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={prefixes[field.key] ?? ''}
                                                                    placeholder={field.placeholder}
                                                                    onChange={(e) => {
                                                                        setPrefixes((prev) => ({ ...prev, [field.key]: e.target.value }));
                                                                        setSuccess('');
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
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

export default Prefixes;
