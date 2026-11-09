import React, { useState, useEffect } from "react";
import { DatePicker } from "antd";
import { Link } from "react-router-dom";
import CommonFooter from "../../core/common/footer/commonFooter";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";

const ProfitLoss = () => {
  const [statement, setStatement] = useState({
    revenue: { grossSales: 12500, salesReturns: 500, netRevenue: 12000 },
    costOfGoodsSold: { totalCOGS: 4800, grossProfit: 7200, grossMarginPercentage: 60 },
    operatingExpenses: { totalExpenses: 3900 },
    netProfit: { netProfit: 3300, netMarginPercentage: 27.5 }
  });

  useEffect(() => {
    apiClient.get("/finance/profit-loss")
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setStatement(res.data.data);
        }
      })
      .catch((err) => {
        console.warn("Using default profit/loss statement:", err);
      });
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Profit / Loss Report</h4>
              <h6>View Reports of Profit / Loss Report</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <RefreshIcon />
            <CollapesIcon />
          </ul>
        </div>
        <div className="d-flex align-items-center justify-content-end">
          <div className="mb-3 me-3">
            <div className="input-icon-start position-relative">
              <DatePicker
                className="form-control datetimepicker"
                placeholder="dd/mm/yyyy"
              />
              <span className="input-icon-left">
                <i className="ti ti-calendar" />
              </span>
            </div>
          </div>
          <div className="mb-3">
            <Link to="#" className="btn btn-primary">
              Generate Report
            </Link>
          </div>
        </div>
        <div className="table-responsive mb-4">
          <table className="table">
            <thead className="thead-light">
              <tr>
                <th></th>
                <th>Jan 2025</th>
                <th>Feb 2025</th>
                <th>Mar 2025</th>
                <th>Apr 2025</th>
                <th>May 2025</th>
                <th>Jun 2025</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-end">
                  <h6 className="fw-bold">Income</h6>
                </td>
                <td colSpan={6} />
              </tr>
              <tr>
                <td className="border-end">Sales</td>
                <td>$50,000</td>
                <td>$50,000</td>
                <td>$50,000</td>
                <td>$50,000</td>
                <td>$50,000</td>
                <td>$50,000</td>
              </tr>
              <tr>
                <td className="border-end">Service</td>
                <td>$30,000</td>
                <td>$30,000</td>
                <td>$30,000</td>
                <td>$30,000</td>
                <td>$30,000</td>
                <td>$30,000</td>
              </tr>
              <tr>
                <td className="border-end">Purchase Return</td>
                <td>$7,000</td>
                <td>$7,000</td>
                <td>$7,000</td>
                <td>$7,000</td>
                <td>$7,000</td>
                <td>$7,000</td>
              </tr>
              <tr>
                <td className="border-end">
                  <h6 className="fw0bold">Gross Profit</h6>
                </td>
                <td>
                  <h6 className="fw0bold">$8,000</h6>
                </td>
                <td>
                  <h6 className="fw0bold">$8,000</h6>
                </td>
                <td>
                  <h6 className="fw0bold">$8,000</h6>
                </td>
                <td>
                  <h6 className="fw0bold">$8,000</h6>
                </td>
                <td>
                  <h6 className="fw0bold">$8,000</h6>
                </td>
                <td>
                  <h6 className="fw0bold">$8,000</h6>
                </td>
              </tr>
              <tr>
                <td className="border-end">
                  <h6 className="fw-bold">Expenses</h6>
                </td>
                <td colSpan={6} />
              </tr>
              <tr>
                <td className="border-end">Sales</td>
                <td>$50,000</td>
                <td>$50,000</td>
                <td>$50,000</td>
                <td>$50,000</td>
                <td>$50,000</td>
                <td>$50,000</td>
              </tr>
              <tr>
                <td className="border-end">Purrchase</td>
                <td>$30,000</td>
                <td>$30,000</td>
                <td>$30,000</td>
                <td>$30,000</td>
                <td>$30,000</td>
                <td>$30,000</td>
              </tr>
              <tr>
                <td className="border-end">
                  <h6 className="fw-bold">Sales Return</h6>
                </td>
                <td>$7,000</td>
                <td>$7,000</td>
                <td>$7,000</td>
                <td>$7,000</td>
                <td>$7,000</td>
                <td>$7,000</td>
              </tr>
              <tr>
                <td className="border-end">
                  <h6 className="fw-bold">Total Expense</h6>
                </td>
                <td>$8,000</td>
                <td>$8,000</td>
                <td>$8,000</td>
                <td>$8,000</td>
                <td>$8,000</td>
                <td>$8,000</td>
              </tr>
              <tr>
                <td className="border-end">
                  <h6 className="fw-bold">Net Profit</h6>
                </td>
                <td>$8,000</td>
                <td>$8,000</td>
                <td>$8,000</td>
                <td>$8,000</td>
                <td>$8,000</td>
                <td>$8,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <CommonFooter />
    </div>

  );
};

export default ProfitLoss;
