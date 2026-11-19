import React, { useState, useEffect } from "react";
import { DatePicker } from "antd";
import { Link } from "react-router-dom";
import CommonFooter from "../../core/common/footer/commonFooter";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";

const ProfitLoss = () => {
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatement = () => {
    setLoading(true);
    setError(null);
    apiClient.get("/finance/profit-loss")
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setStatement(res.data.data);
        } else {
          setStatement(null);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load profit / loss statement");
        setStatement(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatement();
  }, []);

  const grossSales = statement?.revenue?.grossSales ?? 0;
  const salesReturns = statement?.revenue?.salesReturns ?? 0;
  const netRevenue = statement?.revenue?.netRevenue ?? 0;
  const cogs = statement?.costOfGoodsSold?.totalCOGS ?? 0;
  const grossProfit = statement?.costOfGoodsSold?.grossProfit ?? 0;
  const grossMargin = statement?.costOfGoodsSold?.grossMarginPercentage ?? 0;
  const totalExpenses = statement?.operatingExpenses?.totalExpenses ?? 0;
  const netProfit = statement?.netProfit?.netProfit ?? 0;
  const netMargin = statement?.netProfit?.netMarginPercentage ?? 0;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Profit / Loss Report</h4>
              <h6>Actual business revenue, COGS, expenses, and net profit</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li onClick={fetchStatement} className="cursor-pointer">
              <RefreshIcon />
            </li>
            <CollapesIcon />
          </ul>
        </div>

        {/* Financial KPI Cards */}
        <div className="row mb-4">
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card border border-primary sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-primary text-white">
                  <i className="ti ti-chart-arrows-vertical fs-24" />
                </span>
                <div className="ms-3">
                  <p className="fw-medium mb-1 text-muted">Net Revenue</p>
                  <h4 className="fw-bold mb-0">Rs {netRevenue.toLocaleString()}</h4>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card border border-info sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-info text-white">
                  <i className="ti ti-box fs-24" />
                </span>
                <div className="ms-3">
                  <p className="fw-medium mb-1 text-muted">Cost of Goods (COGS)</p>
                  <h4 className="fw-bold mb-0">Rs {cogs.toLocaleString()}</h4>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card border border-warning sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-warning text-white">
                  <i className="ti ti-receipt fs-24" />
                </span>
                <div className="ms-3">
                  <p className="fw-medium mb-1 text-muted">Operating Expenses</p>
                  <h4 className="fw-bold mb-0">Rs {totalExpenses.toLocaleString()}</h4>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className={`card border ${netProfit >= 0 ? 'border-success' : 'border-danger'} sale-widget flex-fill`}>
              <div className="card-body d-flex align-items-center">
                <span className={`sale-icon ${netProfit >= 0 ? 'bg-success' : 'bg-danger'} text-white`}>
                  <i className="ti ti-report-money fs-24" />
                </span>
                <div className="ms-3">
                  <p className="fw-medium mb-1 text-muted">Net Profit</p>
                  <h4 className={`fw-bold mb-0 ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                    Rs {netProfit.toLocaleString()}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Statement */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="mb-0 fw-bold">Income Statement Breakdown</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={fetchStatement}>
              <i className="ti ti-refresh me-1" />Refresh
            </button>
          </div>
          <div className="card-body">
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 text-muted">Loading financial statement...</p>
              </div>
            )}
            {!loading && error && (
              <div className="text-center py-5">
                <i className="ti ti-alert-triangle fs-40 text-danger mb-2 d-block" />
                <h5 className="text-danger">Could not load Profit / Loss data</h5>
                <p className="text-muted">{error}</p>
                <button className="btn btn-primary btn-sm" onClick={fetchStatement}>Retry</button>
              </div>
            )}
            {!loading && !error && (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "65%" }}>Category / Account Item</th>
                      <th className="text-end" style={{ width: "35%" }}>Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="table-active">
                      <td colSpan={2}>
                        <h6 className="fw-bold mb-0 text-primary">1. Revenue & Sales</h6>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-4">Gross Sales Revenue</td>
                      <td className="text-end fw-semibold">Rs {grossSales.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="ps-4">Less: Sales Returns & Refunds</td>
                      <td className="text-end text-danger fw-semibold">- Rs {salesReturns.toLocaleString()}</td>
                    </tr>
                    <tr className="fw-bold">
                      <td className="ps-4">Net Revenue</td>
                      <td className="text-end text-primary">Rs {netRevenue.toLocaleString()}</td>
                    </tr>

                    <tr className="table-active">
                      <td colSpan={2}>
                        <h6 className="fw-bold mb-0 text-info">2. Cost of Goods Sold (COGS)</h6>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-4">Total Inventory Cost Sold</td>
                      <td className="text-end text-danger fw-semibold">- Rs {cogs.toLocaleString()}</td>
                    </tr>
                    <tr className="fw-bold">
                      <td className="ps-4">
                        Gross Profit <small className="text-muted ms-2">(Margin: {grossMargin.toFixed(1)}%)</small>
                      </td>
                      <td className="text-end text-info">Rs {grossProfit.toLocaleString()}</td>
                    </tr>

                    <tr className="table-active">
                      <td colSpan={2}>
                        <h6 className="fw-bold mb-0 text-warning">3. Operating Expenses</h6>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-4">Total Operating Expenses</td>
                      <td className="text-end text-danger fw-semibold">- Rs {totalExpenses.toLocaleString()}</td>
                    </tr>

                    <tr className="table-success fw-bold fs-15 border-top border-2">
                      <td>
                        Net Profit / (Loss) <small className="text-muted ms-2">(Margin: {netMargin.toFixed(1)}%)</small>
                      </td>
                      <td className={`text-end ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                        Rs {netProfit.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <CommonFooter />
    </div>
  );
};

export default ProfitLoss;
