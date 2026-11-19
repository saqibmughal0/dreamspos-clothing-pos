import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CommonFooter from "../../core/common/footer/commonFooter";
import { all_routes } from "../../Router/all_routes";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import { ArrowLeft } from "feather-icons-react/build/IconComponents";
import { apiClient } from "../../core/apiClient";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatCurrency = (val) =>
  `Rs ${Number(val || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Payslip = () => {
  const route = all_routes;
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get("id");

  const [payrolls, setPayrolls] = useState([]);
  const [selectedId, setSelectedId] = useState(requestedId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPayrolls = () => {
    setLoading(true);
    setError(null);
    apiClient
      .get("/hrm/payrolls")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setPayrolls(items);
        if (items.length > 0) {
          const match = requestedId && items.find((p) => p.id === requestedId);
          setSelectedId(match ? match.id : items[0].id);
        } else {
          setSelectedId("");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || "Failed to load payroll records");
        setPayrolls([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayrolls();
  }, [requestedId]);

  const current = payrolls.find((p) => p.id === selectedId) || null;
  const empName = current?.employee
    ? `${current.employee.firstName || ""} ${current.employee.lastName || ""}`.trim()
    : "—";
  const empCode = current?.employee?.empCode || "—";
  const payPeriod = current
    ? `${MONTH_NAMES[(Number(current.month) || 1) - 1] || current.month} ${current.year}`
    : "—";

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Payslip</h4>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon onClick={loadPayrolls} />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link to={route.payrollList} className="btn btn-secondary">
                <ArrowLeft className="me-2" />
                Back to Payroll
              </Link>
            </div>
          </div>

          {loading && (
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 text-muted">Loading payslip...</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="ti ti-alert-triangle fs-40 text-danger mb-2 d-block" />
                <h5 className="text-danger">Could not load payslip</h5>
                <p className="text-muted">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && !current && (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="ti ti-file-off fs-40 text-muted mb-2 d-block" />
                <h5 className="text-muted">No payroll records found</h5>
                <p className="text-muted">Generate a payroll entry in HRM &rarr; Payroll to view and print payslips.</p>
              </div>
            </div>
          )}

          {!loading && !error && current && (
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <h4>Payslip for {payPeriod}</h4>
                  <div className="d-flex align-items-center gap-2">
                    {payrolls.length > 1 && (
                      <select
                        className="form-select form-select-sm w-auto"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                      >
                        {payrolls.map((p) => {
                          const name = p.employee
                            ? `${p.employee.firstName || ""} ${p.employee.lastName || ""}`.trim()
                            : p.id;
                          const period = `${MONTH_NAMES[(Number(p.month) || 1) - 1] || p.month} ${p.year}`;
                          return (
                            <option key={p.id} value={p.id}>
                              {name} ({period})
                            </option>
                          );
                        })}
                      </select>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => window.print()}
                    >
                      <i className="ti ti-printer me-2" />
                      Print Payslip
                    </button>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <p className="mb-1">
                      Employee Name : <span className="text-gray-9 fw-semibold">{empName}</span>
                    </p>
                    <p className="mb-0">
                      Employee ID : <span className="text-gray-9">{empCode}</span>
                    </p>
                  </div>
                  <div className="col-md-6 text-md-end">
                    <p className="mb-1">
                      Status : <span className="text-gray-9">{current.status}</span>
                    </p>
                    <p className="mb-0">
                      Pay Period : <span className="text-gray-9">{payPeriod}</span>
                    </p>
                  </div>
                </div>

                <div className="table-responsive mb-3">
                  <table className="table table-bordered">
                    <thead className="thead-light">
                      <tr>
                        <th>Earnings</th>
                        <th>Amount</th>
                        <th>Deductions</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Basic Salary</td>
                        <td>{formatCurrency(current.basicSalary)}</td>
                        <td>Total Deductions</td>
                        <td>{formatCurrency(current.deductions)}</td>
                      </tr>
                      <tr>
                        <td>Allowances</td>
                        <td>{formatCurrency(current.allowances)}</td>
                        <td>&mdash;</td>
                        <td>&mdash;</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="fw-bold">
                        <td>Net Salary</td>
                        <td colSpan={3}>{formatCurrency(current.netSalary)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        <CommonFooter />
      </div>
    </div>
  );
};

export default Payslip;
