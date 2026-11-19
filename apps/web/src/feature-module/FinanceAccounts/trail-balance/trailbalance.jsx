import React, { useState, useEffect, useCallback } from 'react';
import CommonFooter from '../../../core/common/footer/commonFooter';
import TooltipIcons from '../../../core/common/tooltip-content/tooltipIcons';
import RefreshIcon from '../../../core/common/tooltip-content/refresh';
import CollapesIcon from '../../../core/common/tooltip-content/collapes';
import Table from "../../../core/pagination/datatable";
import { apiClient } from '../../../core/apiClient';

const Trailbalance = () => {
    const [dataSource, setDataSource] = useState([]);
    const [totals, setTotals] = useState({ totalDebit: 0, totalCredit: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTrialBalance = useCallback(() => {
        setLoading(true);
        setError(null);
        apiClient.get('/finance/trial-balance')
            .then((res) => {
                const items = res.data?.data?.items || [];
                setDataSource(items.map((a) => ({
                    key: a.id,
                    accountNumber: a.accountNumber,
                    name: a.name,
                    type: a.type,
                    debit: `Rs ${Number(a.debit || 0).toFixed(2)}`,
                    credit: `Rs ${Number(a.credit || 0).toFixed(2)}`,
                })));
                setTotals({
                    totalDebit: res.data?.data?.totalDebit || 0,
                    totalCredit: res.data?.data?.totalCredit || 0,
                });
            })
            .catch((err) => {
                setError(err?.response?.data?.message || err?.message || 'Failed to load trial balance');
                setDataSource([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchTrialBalance();
    }, [fetchTrialBalance]);

    const columns = [
        { title: "Account #", dataIndex: "accountNumber" },
        { title: "Account Name", dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: "Type", dataIndex: "type" },
        { title: "Debit", dataIndex: "debit" },
        { title: "Credit", dataIndex: "credit" },
    ];

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Trial Balance</h4>
                            <h6>Total Debit: Rs {totals.totalDebit.toFixed(2)} &bull; Total Credit: Rs {totals.totalCredit.toFixed(2)}</h6>
                        </div>
                    </div>
                    <ul className="table-top-head">
                        <TooltipIcons />
                        <RefreshIcon onClick={fetchTrialBalance} />
                        <CollapesIcon />
                    </ul>
                </div>

                <div className="card table-list-card">
                    <div className="card-body">
                        <div className="table-responsive">
                            {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
                            {!loading && error && <div className="alert alert-danger">{error}</div>}
                            {!loading && !error && dataSource.length === 0 && (
                                <div className="text-center py-5 text-muted">No trial balance records found.</div>
                            )}
                            {!loading && !error && dataSource.length > 0 && (
                                <Table columns={columns} dataSource={dataSource} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <CommonFooter />
        </div>
    );
};

export default Trailbalance;
