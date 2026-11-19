import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { apiClient } from "../../core/apiClient";

const LeavesAdmin = () => {
  const [dataSource, setDataSource] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ employeeId: "", leaveTypeId: "", startDate: "", endDate: "", days: "1", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lvRes, empRes, ltRes] = await Promise.all([
        apiClient.get("/hrm/leaves"),
        apiClient.get("/hrm/employees"),
        apiClient.get("/hrm/leave-types"),
      ]);
      const items = lvRes.data?.data?.items || [];
      setEmployees(empRes.data?.data?.items || []);
      setLeaveTypes(ltRes.data?.data?.items || []);
      setDataSource(items.map((l) => ({
        id: l.id,
        key: l.id,
        empname: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : "—",
        type: l.leaveType?.name || "—",
        fromdate: new Date(l.startDate).toLocaleDateString("en-PK"),
        todate: new Date(l.endDate).toLocaleDateString("en-PK"),
        days: `${l.days} Day(s)`,
        status: l.status,
      })));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load leaves");
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
    if (!form.employeeId || !form.leaveTypeId || !form.startDate || !form.endDate) return;
    setSubmitting(true);
    try {
      await apiClient.post("/hrm/leaves", { ...form, days: Number(form.days || 1) });
      setForm({ employeeId: "", leaveTypeId: "", startDate: "", endDate: "", days: "1", reason: "" });
      document.querySelector("#add-leave .btn-close")?.click();
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to apply leave");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await apiClient.patch(`/hrm/leaves/${id}/status`, { status });
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update leave status");
    }
  };

  const columns = [
    { title: "Employee", dataIndex: "empname" },
    { title: "Type", dataIndex: "type" },
    { title: "From Date", dataIndex: "fromdate" },
    { title: "To Date", dataIndex: "todate" },
    { title: "Days", dataIndex: "days" },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => (
        <span className={`badge ${text === "APPROVED" ? "bg-success" : text === "REJECTED" ? "bg-danger" : "bg-warning"} badge-xs`}>
          {text}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.status === "PENDING" ? (
          <div className="d-flex gap-1">
            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => handleStatus(record.id, "APPROVED")}>Approve</button>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleStatus(record.id, "REJECTED")}>Reject</button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Leaves</h4>
              <h6>Manage employee leave requests</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchData} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-leave">
              <i className="ti ti-circle-plus me-1"></i> Apply Leave
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && <div className="text-center py-5 text-muted">No leave requests found.</div>}
              {!loading && !error && dataSource.length > 0 && <Table columns={columns} dataSource={dataSource} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-leave">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Apply Leave</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Employee<span className="text-danger ms-1">*</span></label>
                  <select className="form-select" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
                    <option value="">Select Employee</option>
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Leave Type<span className="text-danger ms-1">*</span></label>
                  <select className="form-select" value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })} required>
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                  </select>
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-control" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-control" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Days</label>
                  <input type="number" min="1" className="form-control" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <input type="text" className="form-control" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Submitting..." : "Submit Leave"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeavesAdmin;
