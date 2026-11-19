import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import CommonFooter from "../../core/common/footer/commonFooter";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";

const AttendanceAdmin = () => {
  const [dataSource, setDataSource] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ employeeId: "", status: "PRESENT", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [attRes, empRes] = await Promise.all([
        apiClient.get("/hrm/attendance"),
        apiClient.get("/hrm/employees"),
      ]);
      const items = attRes.data?.data?.items || [];
      setEmployees(empRes.data?.data?.items || []);
      setDataSource(items.map((a) => ({
        key: a.id,
        EMP_Name: a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : "—",
        Date: new Date(a.date).toLocaleDateString("en-PK"),
        Clock_In: a.clockIn ? new Date(a.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
        Clock_Out: a.clockOut ? new Date(a.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
        Status: a.status,
      })));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load attendance");
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMark = async (e) => {
    e.preventDefault();
    if (!form.employeeId) return;
    setSubmitting(true);
    try {
      await apiClient.post("/hrm/attendance", form);
      setForm({ employeeId: "", status: "PRESENT", notes: "" });
      document.querySelector("#mark-attendance .btn-close")?.click();
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to mark attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: "Employee", dataIndex: "EMP_Name" },
    { title: "Date", dataIndex: "Date" },
    { title: "Clock In", dataIndex: "Clock_In" },
    { title: "Clock Out", dataIndex: "Clock_Out" },
    { title: "Status", dataIndex: "Status", render: (text) => <span className={`badge ${text === "PRESENT" ? "bg-success" : "bg-warning"} badge-xs`}>{text}</span> },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Attendance</h4>
              <h6>Track staff attendance records</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchData} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#mark-attendance">
              <i className="ti ti-circle-plus me-1"></i> Mark Attendance
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && <div className="text-center py-5 text-muted">No attendance records yet.</div>}
              {!loading && !error && dataSource.length > 0 && <Table columns={columns} dataSource={dataSource} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="mark-attendance">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Mark Attendance</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleMark}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Employee<span className="text-danger ms-1">*</span></label>
                  <select className="form-select" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
                    <option value="">Select Employee</option>
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceAdmin;
