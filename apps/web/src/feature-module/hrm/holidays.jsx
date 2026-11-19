import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable.jsx";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons.jsx";
import RefreshIcon from "../../core/common/tooltip-content/refresh.jsx";
import CollapesIcon from "../../core/common/tooltip-content/collapes.jsx";
import CommonFooter from "../../core/common/footer/commonFooter.jsx";
import { apiClient } from "../../core/apiClient";

const Holidays = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", fromDate: "", toDate: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchHolidays = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/hrm/holidays")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((h) => ({
          id: h.id,
          key: h.id,
          name: h.name,
          date: `${new Date(h.fromDate).toLocaleDateString("en-PK")} - ${new Date(h.toDate).toLocaleDateString("en-PK")}`,
          description: h.description || "—",
          status: h.isActive ? "Active" : "Inactive",
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load holidays");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.fromDate || !form.toDate) return;
    setSubmitting(true);
    try {
      await apiClient.post("/hrm/holidays", form);
      setForm({ name: "", fromDate: "", toDate: "", description: "" });
      document.querySelector("#add-holiday .btn-close")?.click();
      fetchHolidays();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create holiday");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/hrm/holidays/${id}`);
      fetchHolidays();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete holiday");
    }
  };

  const columns = [
    { title: "Type / Holiday", dataIndex: "name" },
    { title: "Date", dataIndex: "date" },
    { title: "Description", dataIndex: "description" },
    { title: "Status", dataIndex: "status", render: (text) => <span className="badge bg-success badge-xs">{text}</span> },
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
              <h4>Holidays</h4>
              <h6>Manage store holidays</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchHolidays} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-holiday">
              <i className="ti ti-circle-plus me-1"></i> Add Holiday
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && <div className="text-center py-5 text-muted">No holidays scheduled.</div>}
              {!loading && !error && dataSource.length > 0 && <Table columns={columns} dataSource={dataSource} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-holiday">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Holiday</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Holiday Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" placeholder="e.g., Eid-ul-Fitr" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">From Date</label>
                    <input type="date" className="form-control" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} required />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">To Date</label>
                    <input type="date" className="form-control" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <input type="text" className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Holiday"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Holidays;
