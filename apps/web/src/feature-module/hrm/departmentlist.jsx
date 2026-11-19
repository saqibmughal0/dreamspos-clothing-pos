import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import CommonFooter from "../../core/common/footer/commonFooter";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";

const DepartmentList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/hrm/departments")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((d) => ({
          id: d.id,
          key: d.id,
          department: d.name,
          code: d.code || "—",
          totalmembers: String(d._count?.employees || 0),
          createdon: new Date(d.createdAt).toLocaleDateString("en-PK"),
          status: d.isActive ? "Active" : "Inactive",
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load departments");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post("/hrm/departments", form);
      setForm({ name: "", code: "", description: "" });
      document.querySelector("#add-department .btn-close")?.click();
      fetchDepartments();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/hrm/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete department");
    }
  };

  const columns = [
    { title: "Department", dataIndex: "department" },
    { title: "Code", dataIndex: "code" },
    { title: "Total Members", dataIndex: "totalmembers" },
    { title: "Created On", dataIndex: "createdon" },
    { title: "Status", dataIndex: "status", render: (text) => <span className={`badge ${text === "Active" ? "bg-success" : "bg-secondary"} badge-xs`}>{text}</span> },
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
              <h4>Departments</h4>
              <h6>Manage store departments</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchDepartments} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-department">
              <i className="ti ti-circle-plus me-1"></i> Add Department
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && <div className="text-center py-5 text-muted">No departments found.</div>}
              {!loading && !error && dataSource.length > 0 && <Table columns={columns} dataSource={dataSource} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-department">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Department</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Department Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Code</label>
                  <input type="text" className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Department"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentList;
