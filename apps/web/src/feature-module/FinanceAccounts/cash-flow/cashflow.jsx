import React, { useState, useEffect, useCallback } from 'react';
import TooltipIcons from '../../../core/common/tooltip-content/tooltipIcons';
import RefreshIcon from '../../../core/common/tooltip-content/refresh';
import CollapesIcon from '../../../core/common/tooltip-content/collapes';
import Table from "../../../core/pagination/datatable";
import CommonFooter from '../../../core/common/footer/commonFooter';
import { apiClient } from '../../../core/apiClient';

const Cashflow = () => {
    const [dataSource, setDataSource] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCashFlow = useCallback(() => {
        setLoading(true);
        setError(null);
        apiClient.get('/finance/cash-flow')
            .then((res) => {
                const items = res.data?.data?.items || [];
                setDataSource(items.map((r) => ({
                    key: r.id,
                    Date: new Date(r.date).toLocaleDateString('en-PK'),
                    Bank_Account: r.account,
                    Description: r.description,
                    Credit: `Rs ${Number(r.credit || 0).toFixed(2)}`,
                    Debit: `Rs ${Number(r.debit || 0).toFixed(2)}`,
                    Payment_Method: r.paymentMethod,
                })));
            })
            .catch((err) => {
                setError(err?.response?.data?.message || err?.message || 'Failed to load cash flow');
                setDataSource([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchCashFlow();
    }, [fetchCashFlow]);

    const columns = [
        { title: "Date", dataIndex: "Date" },
        { title: "Reference", dataIndex: "Bank_Account" },
        { title: "Description", dataIndex: "Description" },
        { title: "Cash In (Credit)", dataIndex: "Credit" },
        { title: "Cash Out (Debit)", dataIndex: "Debit" },
        { title: "Method", dataIndex: "Payment_Method" },
    ];

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Cash Flow</h4>
                            <h6>Real inflows and outflows from sales, income, purchases, and expenses</h6>
                        </div>
                    </div>
                    <ul className="table-top-head">
                        <TooltipIcons />
                        <RefreshIcon onClick={fetchCashFlow} />
                        <CollapesIcon />
                    </ul>
                </div>

                <div className="card table-list-card">
                    <div className="card-body">
                        <div className="table-responsive">
                            {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
                            {!loading && error && <div className="alert alert-danger">{error}</div>}
                            {!loading && !error && dataSource.length === 0 && (
                                <div className="text-center py-5 text-muted">No cash flow transactions recorded yet.</div>
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

export default Cashflow;
