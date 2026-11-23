import React, { useState, useEffect } from 'react';
import CommonFooter from '../../core/common/footer/commonFooter';
import { all_routes } from '../../Router/all_routes';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../core/apiClient';
import { formatCurrency } from '../../core/utils/businessSettings';

const Invoicedetails = () => {
    const route = all_routes;
    const [searchParams] = useSearchParams();
    const saleId = searchParams.get('id');

    const [settings, setSettings] = useState(null);
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError('');

        Promise.all([
            apiClient.get('/settings').catch(() => ({ data: null })),
            saleId
                ? apiClient.get(`/sales/${encodeURIComponent(saleId)}`).catch(() => ({ data: null }))
                : apiClient.get('/sales', { params: { limit: 1 } }).catch(() => ({ data: null })),
        ])
            .then(([settingsRes, salesRes]) => {
                if (!mounted) return;
                if (settingsRes?.data?.success && settingsRes.data.data) {
                    setSettings(settingsRes.data.data);
                }
                if (salesRes?.data?.success && salesRes.data.data) {
                    const payload = salesRes.data.data;
                    if (saleId) {
                        setSale(payload);
                    } else if (Array.isArray(payload.items) && payload.items.length > 0) {
                        setSale(payload.items[0]);
                    } else {
                        setSale(null);
                    }
                }
            })
            .catch((err) => {
                if (mounted) {
                    setError(err?.response?.data?.message || err?.message || 'Failed to load invoice details.');
                }
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [saleId]);

    const fmt = (val) => formatCurrency(val, settings?.currency);
    const showCompanyDetails = settings?.invoice?.showCompanyDetails ?? true;
    const invoicePrefix = settings?.invoice?.prefix || 'INV-';
    const dueDays = Number(settings?.invoice?.dueDays ?? 0);

    const createdDate = sale?.createdAt ? new Date(sale.createdAt) : null;
    const dueDate = createdDate
        ? new Date(createdDate.getTime() + dueDays * 24 * 60 * 60 * 1000)
        : null;

    return (
        <div>
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="add-item d-flex">
                            <div className="page-title">
                                <h4>Invoice Details</h4>
                            </div>
                        </div>
                        <div className="page-btn d-flex gap-2">
                            {sale && (
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => window.print()}
                                >
                                    <i className="ti ti-printer me-1" />
                                    Print Invoice
                                </button>
                            )}
                            <Link to={route.invoice} className="btn btn-primary">
                                <i className="ti ti-arrow-left me-1" />
                                Back to Invoices
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <div className="spinner-border text-primary" role="status" />
                                <p className="mt-2 text-muted mb-0">Loading invoice...</p>
                            </div>
                        </div>
                    ) : !sale ? (
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <i className="ti ti-file-invoice fs-36 text-muted mb-2 d-block" />
                                <h5 className="mb-1">No Invoice Selected</h5>
                                <p className="text-muted mb-3">
                                    Completed POS and sales invoices will appear here using your configured business settings ({settings?.shopName || 'Not configured yet'}).
                                </p>
                                <Link to={route.invoice} className="btn btn-primary btn-sm">
                                    View Invoices List
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-body">
                                <div className="row justify-content-between align-items-center border-bottom mb-3 pb-3">
                                    <div className="col-md-6">
                                        {showCompanyDetails && (
                                            <div>
                                                {settings?.logo && (
                                                    <div className="mb-2">
                                                        <img
                                                            src={settings.logo}
                                                            alt="Business Logo"
                                                            style={{ maxHeight: '48px', objectFit: 'contain' }}
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                <h4 className="fw-bold mb-1">
                                                    {settings?.shopName || settings?.brandName || 'Business Name Not Set'}
                                                </h4>
                                                {settings?.address && <p className="mb-1">{settings.address}</p>}
                                                {settings?.phone && <p className="mb-1">Phone: {settings.phone}</p>}
                                                {settings?.email && <p className="mb-1">Email: {settings.email}</p>}
                                                {settings?.taxNumber && <p className="mb-0">Tax / NTN: {settings.taxNumber}</p>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <div className="text-md-end mb-2">
                                            <h5 className="text-gray mb-1">
                                                Invoice No{' '}
                                                <span className="text-primary">
                                                    {sale.invoiceNumber || `${invoicePrefix}${sale.id?.slice(0, 6)}`}
                                                </span>
                                            </h5>
                                            {createdDate && (
                                                <p className="mb-1 fw-medium">
                                                    Created Date:{' '}
                                                    <span className="text-dark">{createdDate.toLocaleDateString()}</span>
                                                </p>
                                            )}
                                            {dueDate && (
                                                <p className="mb-1 fw-medium">
                                                    Due Date:{' '}
                                                    <span className="text-dark">{dueDate.toLocaleDateString()}</span>
                                                </p>
                                            )}
                                            <span
                                                className={`badge ${
                                                    sale.paymentStatus === 'PAID'
                                                        ? 'bg-success'
                                                        : sale.paymentStatus === 'PARTIAL'
                                                        ? 'bg-warning'
                                                        : 'bg-danger'
                                                }`}
                                            >
                                                {sale.paymentStatus || sale.status || 'COMPLETED'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {settings?.invoice?.headerTerms && (
                                    <div className="alert alert-light border py-2 mb-3">
                                        {settings.invoice.headerTerms}
                                    </div>
                                )}

                                <div className="row border-bottom mb-3 pb-3">
                                    <div className="col-md-6">
                                        <p className="text-dark mb-1 fw-semibold">Billed To</p>
                                        <h5 className="mb-1">{sale.customer?.name || sale.customerName || 'Walk-in Customer'}</h5>
                                        {sale.customer?.phone && <p className="mb-1">Phone: {sale.customer.phone}</p>}
                                        {sale.customer?.email && <p className="mb-0">Email: {sale.customer.email}</p>}
                                    </div>
                                </div>

                                <div className="table-responsive mb-3">
                                    <table className="table">
                                        <thead className="thead-light">
                                            <tr>
                                                <th>Item</th>
                                                <th className="text-end">Qty</th>
                                                <th className="text-end">Unit Price</th>
                                                <th className="text-end">Discount</th>
                                                <th className="text-end">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(sale.items || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center text-muted py-3">
                                                        No line items available for this invoice.
                                                    </td>
                                                </tr>
                                            ) : (
                                                sale.items.map((item, idx) => (
                                                    <tr key={item.id || idx}>
                                                        <td>
                                                            <h6 className="mb-0">{item.product?.name || item.name || 'Item'}</h6>
                                                            {(item.color || item.size) && (
                                                                <small className="text-muted">
                                                                    {item.color || ''} {item.size ? `[${item.size}]` : ''}
                                                                </small>
                                                            )}
                                                        </td>
                                                        <td className="text-end">{item.quantity}</td>
                                                        <td className="text-end">{fmt(item.unitPrice)}</td>
                                                        <td className="text-end">{fmt(item.discountAmount || 0)}</td>
                                                        <td className="text-end fw-medium">{fmt(item.totalPrice)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="row border-bottom mb-3 pb-3">
                                    <div className="col-md-5 ms-auto">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Sub Total</span>
                                            <span className="fw-medium">{fmt(sale.subtotal)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Discount</span>
                                            <span className="fw-medium">{fmt(sale.discountAmount || 0)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Tax</span>
                                            <span className="fw-medium">{fmt(sale.taxAmount || 0)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between border-top pt-2">
                                            <h5>Total Amount</h5>
                                            <h5>{fmt(sale.totalAmount)}</h5>
                                        </div>
                                    </div>
                                </div>

                                {(settings?.invoice?.footerTerms || settings?.policies?.terms) && (
                                    <div className="mb-2">
                                        {settings?.invoice?.footerTerms && (
                                            <div className="mb-2">
                                                <h6 className="mb-1">Invoice Terms</h6>
                                                <p className="mb-0 text-muted">{settings.invoice.footerTerms}</p>
                                            </div>
                                        )}
                                        {settings?.policies?.terms && (
                                            <div>
                                                <h6 className="mb-1">Return &amp; Exchange Policy</h6>
                                                <p className="mb-0 text-muted">{settings.policies.terms}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <CommonFooter />
            </div>
        </div>
    );
};

export default Invoicedetails;
