import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ChevronUp, RotateCcw } from 'feather-icons-react/build/IconComponents';
import { setToogleHeader } from '../../../core/redux/action';
import { useDispatch, useSelector } from 'react-redux';
import SettingsSideBar from '../settingssidebar';
import CommonFooter from '../../../core/common/footer/commonFooter';
import { apiClient } from '../../../core/apiClient';
import { extractApiError } from '../../../core/utils/businessSettings';

const EMPTY_FORM = {
    shopName: '',
    brandName: '',
    email: '',
    phone: '',
    website: '',
    taxNumber: '',
    address: '',
    logo: '',
};

const CompanySettings = () => {
    const dispatch = useDispatch();
    const data = useSelector((state) => state.rootReducer.toggle_header);

    const [form, setForm] = useState(EMPTY_FORM);
    const [savedForm, setSavedForm] = useState(EMPTY_FORM);
    const [currencyInfo, setCurrencyInfo] = useState({ code: 'PKR', symbol: 'Rs', position: 'PREFIX' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const loadSettings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get('/settings');
            const s = res.data?.data || {};
            const loaded = {
                shopName: s.shopName || '',
                brandName: s.brandName || '',
                email: s.email || '',
                phone: s.phone || '',
                website: s.website || '',
                taxNumber: s.taxNumber || '',
                address: s.address || '',
                logo: s.logo || '',
            };
            setForm(loaded);
            setSavedForm(loaded);
            if (s.currency) {
                setCurrencyInfo({
                    code: s.currency.code || 'PKR',
                    symbol: s.currency.symbol || 'Rs',
                    position: s.currency.position || 'PREFIX',
                });
            }
        } catch (err) {
            setError(extractApiError(err, 'Failed to load company settings.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
        setSuccess('');
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const errs = {};
        if (!form.shopName.trim()) {
            errs.shopName = 'Shop / Company Name is required.';
        }
        if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            errs.email = 'Please enter a valid email address or leave it blank.';
        }
        if (form.website.trim() && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(form.website.trim())) {
            errs.website = 'Please enter a valid website URL (e.g. https://yourshop.pk) or leave it blank.';
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');

        if (!validate()) {
            return;
        }

        setSaving(true);
        try {
            const payload = {
                shopName: form.shopName.trim(),
                brandName: form.brandName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                website: form.website.trim(),
                taxNumber: form.taxNumber.trim(),
                address: form.address.trim(),
                logo: form.logo.trim(),
            };
            const res = await apiClient.put('/settings', payload);
            const updated = res.data?.data || payload;
            const synced = {
                shopName: updated.shopName || '',
                brandName: updated.brandName || '',
                email: updated.email || '',
                phone: updated.phone || '',
                website: updated.website || '',
                taxNumber: updated.taxNumber || '',
                address: updated.address || '',
                logo: updated.logo || '',
            };
            setForm(synced);
            setSavedForm(synced);
            setSuccess('Company settings saved successfully.');
        } catch (err) {
            setError(extractApiError(err, 'Failed to save company settings.'));
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setForm(savedForm);
        setFieldErrors({});
        setError('');
        setSuccess('');
    };

    const renderRefreshTooltip = (props) => (
        <Tooltip id="refresh-tooltip" {...props}>
            Refresh
        </Tooltip>
    );
    const renderCollapseTooltip = (props) => (
        <Tooltip id="collapse-tooltip" {...props}>
            Collapse
        </Tooltip>
    );

    return (
        <div>
            <div className="page-wrapper">
                <div className="content settings-content">
                    <div className="page-header settings-pg-header">
                        <div className="add-item d-flex">
                            <div className="page-title">
                                <h4>Settings</h4>
                                <h6>Manage your business profile and POS settings</h6>
                            </div>
                        </div>
                        <ul className="table-top-head">
                            <li>
                                <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                                    <Link
                                        to="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            loadSettings();
                                        }}
                                    >
                                        <RotateCcw />
                                    </Link>
                                </OverlayTrigger>
                            </li>
                            <li>
                                <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                                    <Link
                                        to="#"
                                        id="collapse-header"
                                        className={data ? 'active' : ''}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            dispatch(setToogleHeader(!data));
                                        }}
                                    >
                                        <ChevronUp />
                                    </Link>
                                </OverlayTrigger>
                            </li>
                        </ul>
                    </div>
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="settings-wrapper d-flex">
                                <SettingsSideBar />
                                <div className="card flex-fill mb-0">
                                    <div className="card-header d-flex align-items-center justify-content-between">
                                        <h4 className="fs-18 fw-bold mb-0">Company Settings</h4>
                                        <span className="badge bg-light text-dark border">
                                            Active Currency: {currencyInfo.code} ({currencyInfo.symbol})
                                        </span>
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
                                                <p className="mt-2 text-muted mb-0">Loading company settings...</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmit} noValidate>
                                                <div className="border-bottom mb-3 pb-2">
                                                    <div className="card-title-head">
                                                        <h6 className="fs-16 fw-bold mb-3">
                                                            <span className="fs-16 me-2">
                                                                <i className="ti ti-building" />
                                                            </span>
                                                            Business Information
                                                        </h6>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-xl-4 col-lg-6 col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">
                                                                    Shop / Company Name <span className="text-danger">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className={`form-control ${fieldErrors.shopName ? 'is-invalid' : ''}`}
                                                                    value={form.shopName}
                                                                    onChange={handleChange('shopName')}
                                                                    placeholder="Enter your shop or company name"
                                                                    required
                                                                />
                                                                {fieldErrors.shopName && (
                                                                    <div className="invalid-feedback">{fieldErrors.shopName}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-xl-4 col-lg-6 col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Brand Name</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={form.brandName}
                                                                    onChange={handleChange('brandName')}
                                                                    placeholder="Optional brand name"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-xl-4 col-lg-6 col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Company Email</label>
                                                                <input
                                                                    type="email"
                                                                    className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                                                    value={form.email}
                                                                    onChange={handleChange('email')}
                                                                    placeholder="Optional business email"
                                                                />
                                                                {fieldErrors.email && (
                                                                    <div className="invalid-feedback">{fieldErrors.email}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-xl-4 col-lg-6 col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Phone Number</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={form.phone}
                                                                    onChange={handleChange('phone')}
                                                                    placeholder="Optional shop phone number"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-xl-4 col-lg-6 col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Website</label>
                                                                <input
                                                                    type="text"
                                                                    className={`form-control ${fieldErrors.website ? 'is-invalid' : ''}`}
                                                                    value={form.website}
                                                                    onChange={handleChange('website')}
                                                                    placeholder="Optional website URL"
                                                                />
                                                                {fieldErrors.website && (
                                                                    <div className="invalid-feedback">{fieldErrors.website}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-xl-4 col-lg-6 col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Tax / NTN Number</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={form.taxNumber}
                                                                    onChange={handleChange('taxNumber')}
                                                                    placeholder="Optional tax registration number"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="border-bottom mb-3 pb-2">
                                                    <div className="card-title-head">
                                                        <h6 className="fs-16 fw-bold mb-3">
                                                            <span className="fs-16 me-2">
                                                                <i className="ti ti-photo" />
                                                            </span>
                                                            Business Logo
                                                        </h6>
                                                    </div>
                                                    <div className="row align-items-center">
                                                        <div className="col-md-8">
                                                            <div className="mb-3">
                                                                <label className="form-label">Logo URL (Optional)</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={form.logo}
                                                                    onChange={handleChange('logo')}
                                                                    placeholder="Optional logo image URL"
                                                                />
                                                                <small className="text-muted">
                                                                    Displayed on invoices and receipts when provided. Leave blank to hide logo.
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4 text-md-end">
                                                            {form.logo ? (
                                                                <div className="d-inline-block border rounded p-2 bg-light">
                                                                    <img
                                                                        src={form.logo}
                                                                        alt="Business Logo Preview"
                                                                        style={{ maxHeight: '60px', maxWidth: '160px', objectFit: 'contain' }}
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted fs-13">No logo configured</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="company-address mb-3">
                                                    <div className="card-title-head">
                                                        <h6 className="fs-16 fw-bold mb-3">
                                                            <span className="fs-16 me-2">
                                                                <i className="ti ti-map-pin" />
                                                            </span>
                                                            Shop Address
                                                        </h6>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            <div className="mb-3">
                                                                <label className="form-label">Full Address</label>
                                                                <textarea
                                                                    rows={3}
                                                                    className="form-control"
                                                                    value={form.address}
                                                                    onChange={handleChange('address')}
                                                                    placeholder="Enter your shop address (printed on POS receipts and invoices)"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
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
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                        disabled={saving}
                                                    >
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

export default CompanySettings;
