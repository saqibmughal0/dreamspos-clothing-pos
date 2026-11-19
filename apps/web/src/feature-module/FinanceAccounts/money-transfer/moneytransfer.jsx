import React, { useState, useEffect, useCallback } from 'react';
import TooltipIcons from '../../../core/common/tooltip-content/tooltipIcons';
import RefreshIcon from '../../../core/common/tooltip-content/refresh';
import CollapesIcon from '../../../core/common/tooltip-content/collapes';
import { Link } from 'react-router-dom';
import Table from "../../../core/pagination/datatable";
import CommonFooter from '../../../core/common/footer/commonFooter';
import { PlusCircle } from 'feather-icons-react/build/IconComponents';
import { apiClient } from '../../../core/apiClient';

const Moneytransfer = () => {
    const [dataSource, setDataSource] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [trRes, accRes] = await Promise.all([
                apiClient.get('/finance/money-transfers'),
                apiClient.get('/finance/accounts'),
            ]);
            const items = trRes.data?.data?.items || [];
            const accs = accRes.data?.data || [];
            setAccounts(accs);
            setDataSource(items.map((t) => ({
                key: t.id,
                Date: new Date(t.date).toLocaleDateString('en-PK'),
                Reference_Number: t.referenceNumber,
                From_Account: t.fromAccountName,
                To_Account: t.toAccountName,
                Amount: `Rs ${Number(t.amount).toFixed(2)}`,
                Notes: t.notes || '—',
            })));
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to load money transfers');
            setDataSource([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        if (!form.fromAccountId || !form.toAccountId || form.fromAccountId === form.toAccountId || Number(form.amount) <= 0) {
            setFormError('Select two different accounts and enter a positive amount.');
            return;
        }
        setSubmitting(true);
        try {
            await apiClient.post('/finance/money-transfers', {
                fromAccountId: form.fromAccountId,
                toAccountId: form.toAccountId,
                amount: Number(form.amount),
                notes: form.notes || undefined,
            });
            setForm({ fromAccountId: '', toAccountId: '', amount: '', notes: '' });
            document.querySelector('#add-money-transfer .btn-close')?.click();
            fetchData();
        } catch (err) {
            setFormError(err?.response?.data?.message || err?.message || 'Failed to transfer money');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        { title: "Date", dataIndex: "Date" },
        { title: "Reference Number", dataIndex: "Reference_Number" },
        { title: "From Account", dataIndex: "From_Account" },
        { title: "To Account", dataIndex: "To_Account" },
        { title: "Amount", dataIndex: "Amount" },
        { title: "Notes", dataIndex: "Notes" },
    ];

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Money Transfer</h4>
                            <h6>Transfer funds between your cash and bank accounts</h6>
                        </div>
                    </div>
                    <ul className="table-top-head">
                        <TooltipIcons />
                        <RefreshIcon onClick={fetchData} />
                        <CollapesIcon />
                    </ul>
                    <div className="page-btn">
                        <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-money-transfer">
                            <PlusCircle className="me-2" /> Add Money Transfer
                        </Link>
                    </div>
                </div>

                <div className="card table-list-card">
                    <div className="card-body">
                        <div className="table-responsive">
                            {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
                            {!loading && error && <div className="alert alert-danger">{error}</div>}
                            {!loading && !error && dataSource.length === 0 && (
                                <div className="text-center py-5 text-muted">No money transfers recorded yet.</div>
                            )}
                            {!loading && !error && dataSource.length > 0 && (
                                <Table columns={columns} dataSource={dataSource} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <CommonFooter />

            <div className="modal fade" id="add-money-transfer">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="page-title"><h4>Create Money Transfer</h4></div>
                            <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                                <div className="mb-3">
                                    <label className="form-label">From Account<span className="text-danger ms-1">*</span></label>
                                    <select className="form-select" value={form.fromAccountId} onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })} required>
                                        <option value="">Select Source Account</option>
                                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.accountNumber})</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">To Account<span className="text-danger ms-1">*</span></label>
                                    <select className="form-select" value={form.toAccountId} onChange={(e) => setForm({ ...form, toAccountId: e.target.value })} required>
                                        <option value="">Select Destination Account</option>
                                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.accountNumber})</option>)}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Amount (Rs)<span className="text-danger ms-1">*</span></label>
                                    <input type="number" min="1" step="0.01" className="form-control" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Notes</label>
                                    <input type="text" className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Transferring...' : 'Submit Transfer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Moneytransfer;
