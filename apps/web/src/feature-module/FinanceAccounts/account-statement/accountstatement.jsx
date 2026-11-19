import React, { useState, useEffect, useCallback } from 'react';
import CommonFooter from '../../../core/common/footer/commonFooter';
import TooltipIcons from '../../../core/common/tooltip-content/tooltipIcons';
import RefreshIcon from '../../../core/common/tooltip-content/refresh';
import CollapesIcon from '../../../core/common/tooltip-content/collapes';
import Table from '../../../core/pagination/datatable';
import { apiClient } from '../../../core/apiClient';

const Accountstatement = () => {
    const [dataSource, setDataSource] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStatement = useCallback(() => {
        setLoading(true);
        setError(null);
        apiClient.get('/finance/account-statement')
            .then((res) => {
                const items = res.data?.data?.items || [];
                setDataSource(items.map((r) => ({
                    key: r.id,
                    Reference_Number: r.reference,
                    Date: new Date(r.date).toLocaleDateString('en-PK'),
                    Category: r.category,
                    Description: r.description,
                    Amount: `Rs ${Number(r.amount || 0).toFixed(2)}`,
                    Transaction_Type: r.type,
                })));
            })
            .catch((err) => {
                setError(err?.response?.data?.message || err?.message || 'Failed to load account statement');
                setDataSource([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchStatement();
    }, [fetchStatement]);

    const columns = [
        { title: "Reference Number", dataIndex: "Reference_Number" },
        { title: "Date", dataIndex: "Date" },
        { title: "Category", dataIndex: "Category" },
        { title: "Description", dataIndex: "Description" },
        { title: "Amount", dataIndex: "Amount" },
        {
            title: "Type",
            dataIndex: "Transaction_Type",
            render: (text) => (
                <span className={`badge ${text === "CREDIT" ? "bg-success" : text === "DEBIT" ? "bg-danger" : "bg-info"} badge-xs`}>
                    {text}
                </span>
            ),
        },
    ];

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Account Statement</h4>
                            <h6>Detailed ledger statement from real transactions</h6>
                        </div>
                    </div>
                    <ul className="table-top-head">
                        <TooltipIcons />
                        <RefreshIcon onClick={fetchStatement} />
                        <CollapesIcon />
                    </ul>
                </div>

                <div className="card table-list-card">
                    <div className="card-body">
                        <div className="table-responsive">
                            {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
                            {!loading && error && <div className="alert alert-danger">{error}</div>}
                            {!loading && !error && dataSource.length === 0 && (
                                <div className="text-center py-5 text-muted">No statement entries recorded yet.</div>
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

export default Accountstatement;
