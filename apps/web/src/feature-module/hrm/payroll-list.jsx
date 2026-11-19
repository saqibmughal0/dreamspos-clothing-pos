import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { PlusCircle } from "feather-icons-react/build/IconComponents";
import { apiClient } from "../../core/apiClient";

const PayrollList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const now = new Date();
  const [form, setForm] = useState({ employeeId: "", month: String(now.getMonth() + 1), year: String(now.getFullYear()), basicSalary: "0", allowances: "0", deductions: "0" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payRes, empRes] = await Promise.all([
        apiClient.get("/hrm/payrolls"),
        apiClient.get("/hrm/employees"),
      ]);
      const items = payRes.data?.data?.items || [];
      setEmployees(empRes.data?.data?.items || []);
      setDataSource(items.map((p) => ({
        id: p.id,
        key: p.id,
        name: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : "—",
        period: `${p.month}/${p.year}`,
        salary: `Rs ${Number(p.basicSalary).toLocaleString()}`,
        allowances: `Rs ${Number(p.allowances).toLocaleString()}`,
        deductions: `Rs ${Number(p.deductions).toLocaleString()}`,
        netSalary: `Rs ${Number(p.netSalary).toLocaleString()}`,
        status: p.status,
      })));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load payroll");
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.employeeId) return;
    setSubmitting(true);
    try {
      await apiClient.post("/hrm/payrolls", {
        employeeId: form.employeeId,
        month: Number(form.month),
        year: Number(form.year),
        basicSalary: Number(form.basicSalary || 0),
        allowances: Number(form.allowances || 0),
        deductions: Number(form.deductions || 0),
      });
      document.querySelector("#add-payroll .btn-close")?.click();
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create payroll");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await apiClient.patch(`/hrm/payrolls/${id}/pay`);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to mark payroll paid");
    }
  };

  const columns = [
    { title: "Employee", dataIndex: "name" },
    { title: "Month/Year", dataIndex: "period" },
    { title: "Basic Salary", dataIndex: "salary" },
    { title: "Allowances", dataIndex: "allowances" },
    { title: "Deductions", dataIndex: "deductions" },
    { title: "Net Salary", dataIndex: "netSalary" },
    { title: "Status", dataIndex: "status", render: (text) => <span className={`badge ${text === "PAID" ? "bg-success" : "bg-warning"} badge-xs`}>{text}</span> },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.status !== "PAID" ? (
          <button type="button" className="btn btn-sm btn-outline-success" onClick={() => handleMarkPaid(record.id)}>
            Mark Paid
          </button>
        ) : null,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Employee Salary / Payroll</h4>
              <h6>Manage monthly staff payroll and salary disbursements</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchData} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-payroll">
              <PlusCircle className="me-2" /> Generate Payroll
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && <div className="text-center py-5 text-muted">No payroll records generated yet.</div>}
              {!loading && !error && dataSource.length > 0 && <Table columns={columns} dataSource={dataSource} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-payroll">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Generate Payroll</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Employee<span className="text-danger ms-1">*</span></label>
                  <select
                    className="form-select"
                    value={form.employeeId}
                    onChange={(e) => {
                      const emp = employees.find((x) => x.id === e.target.value);
                      setForm({ ...form, employeeId: e.target.value, basicSalary: String(emp?.basicSalary || 0) });
                    }}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                  </select>
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Month (1-12)</label>
                    <input type="number" min="1" max="12" className="form-control" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Year</label>
                    <input type="number" min="2020" max="2100" className="form-control" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required />
                  </div>
                </div>
                <div className="row">
                  <div className="col-4 mb-3">
                    <label className="form-label">Basic (Rs)</label>
                    <input type="number" min="0" className="form-control" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} />
                  </div>
                  <div className="col-4 mb-3">
                    <label className="form-label">Allowances</label>
                    <input type="number" min="0" className="form-control" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} />
                  </div>
                  <div className="col-4 mb-3">
                    <label className="form-label">Deductions</label>
                    <input type="number" min="0" className="form-control" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Generate"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollList;
