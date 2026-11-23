import React, { useState, useEffect, useCallback } from 'react';
import SettingsSideBar from '../settingssidebar';
import CommonFooter from '../../../core/common/footer/commonFooter';
import CollapesIcon from '../../../core/common/tooltip-content/collapes';
import RefreshIcon from '../../../core/common/tooltip-content/refresh';
import { apiClient } from '../../../core/apiClient';
import { extractApiError, formatCurrency } from '../../../core/utils/businessSettings';

const DEFAULT_LOCALIZATION = {
    language: 'english',
    timezone: 'Asia/Karachi',
    dateFormat: 'DD MMM YYYY',
    timeFormat: '12-hours',
    financialYear: String(new Date().getFullYear()),
    startingMonth: 'July',
    decimalSeparator: '.',
    thousandSeparator: ',',
};

const DEFAULT_CURRENCY = {
    code: 'PKR',
    symbol: 'Rs',
    position: 'PREFIX',
};

const CURRENCY_PRESETS = [
    { code: 'PKR', symbol: 'Rs', label: 'Pakistani Rupee (PKR - Rs)' },
    { code: 'USD', symbol: '$', label: 'US Dollar (USD - $)' },
    { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)' },
    { code: 'SAR', symbol: 'SAR', label: 'Saudi Riyal (SAR)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (GBP - £)' },
    { code: 'EUR', symbol: '€', label: 'Euro (EUR - €)' },
];

const LocalizationSettings = () => {
    const [localization, setLocalization] = useState(DEFAULT_LOCALIZATION);
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [savedState, setSavedState] = useState({ localization: DEFAULT_LOCALIZATION, currency: DEFAULT_CURRENCY });
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
            const loadedLoc = { ...DEFAULT_LOCALIZATION, ...(s.localization || {}) };
            const loadedCur = { ...DEFAULT_CURRENCY, ...(s.currency || {}) };
            setLocalization(loadedLoc);
            setCurrency(loadedCur);
            setSavedState({ localization: loadedLoc, currency: loadedCur });
        } catch (err) {
            setError(extractApiError(err, 'Failed to load localization settings.'));
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

        if (!currency.code.trim() || !currency.symbol.trim()) {
            setError('Currency code and symbol are required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                localization,
                currency: {
                    code: currency.code.trim().toUpperCase(),
                    symbol: currency.symbol.trim(),
                    position: currency.position === 'SUFFIX' ? 'SUFFIX' : 'PREFIX',
                },
            };
            const res = await apiClient.put('/settings', payload);
            const updated = res.data?.data;
            if (updated) {
                const syncedLoc = { ...DEFAULT_LOCALIZATION, ...(updated.localization || {}) };
                const syncedCur = { ...DEFAULT_CURRENCY, ...(updated.currency || {}) };
                setLocalization(syncedLoc);
                setCurrency(syncedCur);
                setSavedState({ localization: syncedLoc, currency: syncedCur });
            }
            setSuccess('Localization and currency settings saved successfully.');
        } catch (err) {
            setError(extractApiError(err, 'Failed to save localization settings.'));
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setLocalization(savedState.localization);
        setCurrency(savedState.currency);
        setError('');
        setSuccess('');
    };

    const handlePresetChange = (e) => {
        const selected = CURRENCY_PRESETS.find((c) => c.code === e.target.value);
        if (selected) {
            setCurrency((prev) => ({
                ...prev,
                code: selected.code,
                symbol: selected.symbol,
            }));
            setSuccess('');
        }
    };

    return (
        <div>
            <div className="page-wrapper">
                <div className="content settings-content">
                    <div className="page-header settings-pg-header">
                        <div className="add-item d-flex">
                            <div className="page-title">
                                <h4>Settings</h4>
                                <h6>Manage timezone, date/time format, and currency display</h6>
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
                                        <h4 className="fs-18 fw-bold mb-0">Localization</h4>
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
                                                <p className="mt-2 text-muted mb-0">Loading localization settings...</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmit} noValidate>
                                                <div className="border-bottom mb-3 pb-2">
                                                    <div className="card-title-head">
                                                        <h6 className="fs-16 fw-bold mb-3">
                                                            <span className="fs-18 me-2">
                                                                <i className="ti ti-list" />
                                                            </span>
                                                            Regional &amp; Time Settings
                                                        </h6>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-6 mb-3">
                                                            <label className="form-label">Language</label>
                                                            <select
                                                                className="form-select"
                                                                value={localization.language}
                                                                onChange={(e) => {
                                                                    setLocalization((l) => ({ ...l, language: e.target.value }));
                                                                    setSuccess('');
                                                                }}
                                                            >
                                                                <option value="english">English</option>
                                                                <option value="urdu">Urdu</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <label className="form-label">Timezone</label>
                                                            <select
                                                                className="form-select"
                                                                value={localization.timezone}
                                                                onChange={(e) => {
                                                                    setLocalization((l) => ({ ...l, timezone: e.target.value }));
                                                                    setSuccess('');
                                                                }}
                                                            >
                                                                <option value="Asia/Karachi">Asia/Karachi (PKT, UTC+05:00)</option>
                                                                <option value="Asia/Dubai">Asia/Dubai (GST, UTC+04:00)</option>
                                                                <option value="Asia/Riyadh">Asia/Riyadh (AST, UTC+03:00)</option>
                                                                <option value="UTC">UTC (UTC+00:00)</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-md-4 mb-3">
                                                            <label className="form-label">Date Format</label>
                                                            <select
                                                                className="form-select"
                                                                value={localization.dateFormat}
                                                                onChange={(e) => {
                                                                    setLocalization((l) => ({ ...l, dateFormat: e.target.value }));
                                                                    setSuccess('');
                                                                }}
                                                            >
                                                                <option value="DD MMM YYYY">DD MMM YYYY (e.g. 21 Nov 2026)</option>
                                                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-md-4 mb-3">
                                                            <label className="form-label">Time Format</label>
                                                            <select
                                                                className="form-select"
                                                                value={localization.timeFormat}
                                                                onChange={(e) => {
                                                                    setLocalization((l) => ({ ...l, timeFormat: e.target.value }));
                                                                    setSuccess('');
                                                                }}
                                                            >
                                                                <option value="12-hours">12 Hours</option>
                                                                <option value="24-hours">24 Hours</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-md-4 mb-3">
                                                            <label className="form-label">Financial Year Starting Month</label>
                                                            <select
                                                                className="form-select"
                                                                value={localization.startingMonth}
                                                                onChange={(e) => {
                                                                    setLocalization((l) => ({ ...l, startingMonth: e.target.value }));
                                                                    setSuccess('');
                                                                }}
                                                            >
                                                                {['January', 'April', 'July', 'October'].map((m) => (
                                                                    <option key={m} value={m}>{m}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="card-title-head">
                                                        <h6 className="fs-16 fw-bold mb-3">
                                                            <span className="fs-18 me-2">
                                                                <i className="ti ti-credit-card" />
                                                            </span>
                                                            Currency &amp; Number Format
                                                        </h6>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-4 mb-3">
                                                            <label className="form-label">Currency Preset</label>
                                                            <select
                                                                className="form-select"
                                                                value={CURRENCY_PRESETS.some((p) => p.code === currency.code) ? currency.code : ''}
                                                                onChange={handlePresetChange}
                                                            >
                                                                {CURRENCY_PRESETS.map((p) => (
                                                                    <option key={p.code} value={p.code}>{p.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="col-md-4 mb-3">
                                                            <label className="form-label">Currency Symbol</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={currency.symbol}
                                                                onChange={(e) => {
                                                                    setCurrency((c) => ({ ...c, symbol: e.target.value }));
                                                                    setSuccess('');
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="col-md-4 mb-3">
                                                            <label className="form-label">Symbol Position</label>
                                                            <select
                                                                className="form-select"
                                                                value={currency.position}
                                                                onChange={(e) => {
                                                                    setCurrency((c) => ({ ...c, position: e.target.value }));
                                                                    setSuccess('');
                                                                }}
                                                            >
                                                                <option value="PREFIX">Prefix ({currency.symbol || 'Rs'} 1,250.00)</option>
                                                                <option value="SUFFIX">Suffix (1,250.00 {currency.symbol || 'Rs'})</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-md-12">
                                                            <div className="alert alert-light border py-2 mb-0">
                                                                <span className="text-muted me-2">Live Currency Preview:</span>
                                                                <strong>{formatCurrency(12500, currency)}</strong>
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

export default LocalizationSettings;
