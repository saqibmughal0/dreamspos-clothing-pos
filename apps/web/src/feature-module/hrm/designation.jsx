import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import CommonFooter from "../../core/common/footer/commonFooter";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";

const Designation = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchDesignations = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/hrm/designations")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((d) => ({
          id: d.id,
          key: d.id,
          designation: d.name,
          members: String(d._count?.employees || 0),
          createdon: new Date(d.createdAt).toLocaleDateString("en-PK"),
          status: d.isActive ? "Active" : "Inactive",
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load designations");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post("/hrm/designations", form);
      setForm({ name: "", description: "" });
      document.querySelector("#add-designation .btn-close")?.click();
      fetchDesignations();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create designation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/hrm/designations/${id}`);
      fetchDesignations();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete designation");
    }
  };

  const columns = [
    { title: "Designation", dataIndex: "designation" },
    { title: "Total Members", dataIndex: "members" },
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
              <h4>Designations</h4>
              <h6>Manage employee roles and job titles</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchDesignations} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-designation">
              <i className="ti ti-circle-plus me-1"></i> Add Designation
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && <div className="text-center py-5 text-muted">No designations found.</div>}
              {!loading && !error && dataSource.length > 0 && <Table columns={columns} dataSource={dataSource} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-designation">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Designation</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Designation Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" placeholder="e.g., Salesman, Cashier, Tailor" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Designation"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Designation;
