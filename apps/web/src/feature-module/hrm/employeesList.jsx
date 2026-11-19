import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle } from "feather-icons-react/build/IconComponents";
import { Link } from "react-router-dom";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import Table from "../../core/pagination/datatable.jsx";
import CommonFooter from "../../core/common/footer/commonFooter";
import { apiClient } from "../../core/apiClient";

const EmployeesList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", empCode: "", email: "", phone: "", departmentId: "", designationId: "", shiftId: "", basicSalary: "0" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, depRes, desRes, shRes] = await Promise.all([
        apiClient.get("/hrm/employees"),
        apiClient.get("/hrm/departments"),
        apiClient.get("/hrm/designations"),
        apiClient.get("/hrm/shifts"),
      ]);
      const items = empRes.data?.data?.items || [];
      setDepartments(depRes.data?.data?.items || []);
      setDesignations(desRes.data?.data?.items || []);
      setShifts(shRes.data?.data?.items || []);
      setDataSource(items.map((e) => ({
        id: e.id,
        key: e.id,
        ID: e.empCode,
        Employee: `${e.firstName} ${e.lastName}`,
        Designation: e.designation?.name || "—",
        Department: e.department?.name || "—",
        Email: e.email || "—",
        Phone: e.phone || "—",
        Shift: e.shift?.name || "—",
        Salary: `Rs ${Number(e.basicSalary || 0).toLocaleString()}`,
        Status: e.status,
      })));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load employees");
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
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post("/hrm/employees", {
        ...form,
        basicSalary: Number(form.basicSalary || 0),
        departmentId: form.departmentId || null,
        designationId: form.designationId || null,
        shiftId: form.shiftId || null,
      });
      setForm({ firstName: "", lastName: "", empCode: "", email: "", phone: "", departmentId: "", designationId: "", shiftId: "", basicSalary: "0" });
      document.querySelector("#add-employee .btn-close")?.click();
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to add employee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/hrm/employees/${id}`);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete employee");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "ID" },
    { title: "Employee", dataIndex: "Employee" },
    { title: "Designation", dataIndex: "Designation" },
    { title: "Department", dataIndex: "Department" },
    { title: "Phone", dataIndex: "Phone" },
    { title: "Basic Salary", dataIndex: "Salary" },
    { title: "Status", dataIndex: "Status", render: (text) => <span className={`badge ${text === "ACTIVE" ? "bg-success" : "bg-secondary"} badge-xs`}>{text}</span> },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Link className="p-2 text-danger" to="#" onClick={() => handleDelete(record.id)}>
          <i data-feather="trash-2" className="feather-trash-2" />
        </Link>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Employees</h4>
              <h6>Manage your store staff and employees</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchData} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-employee">
              <PlusCircle className="me-2" /> Add Employee
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && <div className="text-center py-5 text-muted">No employees added yet.</div>}
              {!loading && !error && dataSource.length > 0 && <Table columns={columns} dataSource={dataSource} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-employee">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Employee</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">First Name<span className="text-danger ms-1">*</span></label>
                    <input type="text" className="form-control" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Last Name<span className="text-danger ms-1">*</span></label>
                    <input type="text" className="form-control" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Basic Salary (Rs)</label>
                    <input type="number" min="0" className="form-control" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                      <option value="">None</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Designation</label>
                    <select className="form-select" value={form.designationId} onChange={(e) => setForm({ ...form, designationId: e.target.value })}>
                      <option value="">None</option>
                      {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Shift</label>
                    <select className="form-select" value={form.shiftId} onChange={(e) => setForm({ ...form, shiftId: e.target.value })}>
                      <option value="">None</option>
                      {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Employee"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeesList;
