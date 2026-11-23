import React, { useState, useEffect, useCallback } from 'react';
import SettingsSideBar from '../settingssidebar';
import CommonFooter from '../../../core/common/footer/commonFooter';
import RefreshIcon from '../../../core/common/tooltip-content/refresh';
import CollapesIcon from '../../../core/common/tooltip-content/collapes';
import { apiClient } from '../../../core/apiClient';
import { extractApiError } from '../../../core/utils/businessSettings';

const DEFAULT_INVOICE = {
    prefix: 'INV-',
    dueDays: 0,
    roundOff: false,
    roundOffType: 'NEAREST',
    showCompanyDetails: true,
    headerTerms: '',
    footerTerms: '',
};

const InvoiceSettings = () => {
    const [invoice, setInvoice] = useState(DEFAULT_INVOICE);
    const [savedInvoice, setSavedInvoice] = useState(DEFAULT_INVOICE);
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
            const loaded = {
                prefix: s.invoice?.prefix ?? 'INV-',
                dueDays: Number(s.invoice?.dueDays ?? 0),
                roundOff: Boolean(s.invoice?.roundOff ?? false),
                roundOffType: s.invoice?.roundOffType || 'NEAREST',
                showCompanyDetails: Boolean(s.invoice?.showCompanyDetails ?? true),
                headerTerms: s.invoice?.headerTerms || '',
                footerTerms: s.invoice?.footerTerms || '',
            };
            setInvoice(loaded);
            setSavedInvoice(loaded);
        } catch (err) {
            setError(extractApiError(err, 'Failed to load invoice settings.'));
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

        const due = Number(invoice.dueDays);
        if (Number.isNaN(due) || due < 0 || due > 365) {
            setError('Invoice due days must be between 0 and 365.');
            return;
        }
        if (invoice.prefix.trim().length > 20) {
            setError('Invoice prefix must be 20 characters or less.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                invoice: {
                    prefix: invoice.prefix.trim(),
                    dueDays: due,
                    roundOff: Boolean(invoice.roundOff),
                    roundOffType: invoice.roundOffType,
                    showCompanyDetails: Boolean(invoice.showCompanyDetails),
                    headerTerms: invoice.headerTerms.trim(),
                    footerTerms: invoice.footerTerms.trim(),
                },
            };
            const res = await apiClient.put('/settings', payload);
            const updated = res.data?.data?.invoice;
            if (updated) {
                const synced = { ...DEFAULT_INVOICE, ...updated };
                setInvoice(synced);
                setSavedInvoice(synced);
            }
            setSuccess('Invoice settings saved successfully. New invoices will use the updated settings without modifying historical invoices.');
        } catch (err) {
            setError(extractApiError(err, 'Failed to save invoice settings.'));
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setInvoice(savedInvoice);
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
                                <h6>Manage invoice numbering prefix, due terms, and display options</h6>
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
                                        <h4 className="fs-18 fw-bold mb-0">Invoice Settings</h4>
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
                                                <p className="mt-2 text-muted mb-0">Loading invoice settings...</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmit} noValidate>
                                                <div className="localization-info">
                                                    <div className="row align-items-center mb-3">
                                                        <div className="col-sm-4">
                                                            <div className="setting-info">
                                                                <h6>Invoice Prefix</h6>
                                                                <p>Prefix prepended to new POS and sales invoice numbers</p>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-4">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={invoice.prefix}
                                                                onChange={(e) => {
                                                                    setInvoice((p) => ({ ...p, prefix: e.target.value }));
                                                                    setSuccess('');
                                                                }}
                                                                placeholder="INV-"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="row align-items-center mb-3">
                                                        <div className="col-sm-4">
                                                            <div className="setting-info">
                                                                <h6>Invoice Due Days</h6>
                                                                <p>Default payment due window (0 = due on receipt)</p>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-4">
                                                            <div className="input-group">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="365"
                                                                    className="form-control"
                                                                    value={invoice.dueDays}
                                                                    onChange={(e) => {
                                                                        setInvoice((p) => ({ ...p, dueDays: e.target.value }));
                                                                        setSuccess('');
                                                                    }}
                                                                />
                                                                <span className="input-group-text">Days</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row align-items-center mb-3">
                                                        <div className="col-sm-4">
                                                            <div className="setting-info">
                                                                <h6>Invoice Round Off</h6>
                                                                <p>Round invoice totals</p>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="invoice-roundoff"
                                                                        className="check"
                                                                        checked={invoice.roundOff}
                                                                        onChange={(e) => {
                                                                            setInvoice((p) => ({ ...p, roundOff: e.target.checked }));
                                                                            setSuccess('');
                                                                        }}
                                                                    />
                                                                    <label htmlFor="invoice-roundoff" className="checktoggle" />
                                                                </div>
                                                                <select
                                                                    className="form-select"
                                                                    style={{ maxWidth: '180px' }}
                                                                    value={invoice.roundOffType}
                                                                    disabled={!invoice.roundOff}
                                                                    onChange={(e) => {
                                                                        setInvoice((p) => ({ ...p, roundOffType: e.target.value }));
                                                                        setSuccess('');
                                                                    }}
                                                                >
                                                                    <option value="NEAREST">Round Nearest</option>
                                                                    <option value="UP">Round Up</option>
                                                                    <option value="DOWN">Round Down</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row align-items-center mb-3">
                                                        <div className="col-sm-4">
                                                            <div className="setting-info">
                                                                <h6>Show Company Details</h6>
                                                                <p>Display shop name, address, phone and tax number on invoices</p>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-4">
                                                            <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    id="invoice-company-details"
                                                                    className="check"
                                                                    checked={invoice.showCompanyDetails}
                                                                    onChange={(e) => {
                                                                        setInvoice((p) => ({ ...p, showCompanyDetails: e.target.checked }));
                                                                        setSuccess('');
                                                                    }}
                                                                />
                                                                <label htmlFor="invoice-company-details" className="checktoggle" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row mb-3">
                                                        <div className="col-sm-4">
                                                            <div className="setting-info">
                                                                <h6>Invoice Header Terms (Optional)</h6>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-8">
                                                            <textarea
                                                                rows={3}
                                                                className="form-control"
                                                                placeholder="Optional header note displayed on invoices"
                                                                value={invoice.headerTerms}
                                                                onChange={(e) => {
                                                                    setInvoice((p) => ({ ...p, headerTerms: e.target.value }));
                                                                    setSuccess('');
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="row mb-3">
                                                        <div className="col-sm-4">
                                                            <div className="setting-info">
                                                                <h6>Invoice Footer Terms (Optional)</h6>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-8">
                                                            <textarea
                                                                rows={3}
                                                                className="form-control"
                                                                placeholder="Optional footer terms or payment notes"
                                                                value={invoice.footerTerms}
                                                                onChange={(e) => {
                                                                    setInvoice((p) => ({ ...p, footerTerms: e.target.value }));
                                                                    setSuccess('');
                                                                }}
                                                            />
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

export default InvoiceSettings;
