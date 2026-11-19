import React, { useState, useEffect, useCallback } from 'react';
import CommonFooter from '../../../core/common/footer/commonFooter';
import Table from "../../../core/pagination/datatable";
import TooltipIcons from '../../../core/common/tooltip-content/tooltipIcons';
import RefreshIcon from '../../../core/common/tooltip-content/refresh';
import CollapesIcon from '../../../core/common/tooltip-content/collapes';
import { apiClient } from '../../../core/apiClient';

const Balancesheet = () => {
    const [dataSource, setDataSource] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBalanceSheet = useCallback(() => {
        setLoading(true);
        setError(null);
        apiClient.get('/finance/balance-sheet')
            .then((res) => {
                const items = res.data?.data?.items || [];
                setDataSource(items.map((a) => ({
                    key: a.id,
                    Name: a.name,
                    Bank_Account: `${a.accountNumber} (${a.type})`,
                    Credit: `Rs ${Number(a.credit || 0).toFixed(2)}`,
                    Debit: `Rs ${Number(a.debit || 0).toFixed(2)}`,
                    Balance: `Rs ${Number(a.balance || 0).toFixed(2)}`,
                })));
            })
            .catch((err) => {
                setError(err?.response?.data?.message || err?.message || 'Failed to load balance sheet');
                setDataSource([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchBalanceSheet();
    }, [fetchBalanceSheet]);

    const columns = [
        { title: "Name", dataIndex: "Name", sorter: (a, b) => a.Name.localeCompare(b.Name) },
        { title: "Account & Type", dataIndex: "Bank_Account" },
        { title: "Credit", dataIndex: "Credit" },
        { title: "Debit", dataIndex: "Debit" },
        { title: "Balance", dataIndex: "Balance" },
    ];

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Balance Sheet</h4>
                            <h6>Live asset, liability, and equity balances</h6>
                        </div>
                    </div>
                    <ul className="table-top-head">
                        <TooltipIcons />
                        <RefreshIcon onClick={fetchBalanceSheet} />
                        <CollapesIcon />
                    </ul>
                </div>

                <div className="card table-list-card">
                    <div className="card-body">
                        <div className="table-responsive">
                            {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
                            {!loading && error && <div className="alert alert-danger">{error}</div>}
                            {!loading && !error && dataSource.length === 0 && (
                                <div className="text-center py-5 text-muted">No accounts found.</div>
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

export default Balancesheet;
