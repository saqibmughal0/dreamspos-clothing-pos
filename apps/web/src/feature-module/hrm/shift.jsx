import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import CommonFooter from "../../core/common/footer/commonFooter";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";

const Shift = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", startTime: "09:00", endTime: "18:00", breakMinutes: "30" });
  const [submitting, setSubmitting] = useState(false);

  const fetchShifts = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/hrm/shifts")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((s) => ({
          id: s.id,
          key: s.id,
          shiftname: s.name,
          time: `${s.startTime} - ${s.endTime}`,
          breakTime: `${s.breakMinutes} mins`,
          createdon: new Date(s.createdAt).toLocaleDateString("en-PK"),
          status: s.isActive ? "Active" : "Inactive",
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load shifts");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post("/hrm/shifts", {
        name: form.name,
        startTime: form.startTime,
        endTime: form.endTime,
        breakMinutes: Number(form.breakMinutes || 0),
      });
      setForm({ name: "", startTime: "09:00", endTime: "18:00", breakMinutes: "30" });
      document.querySelector("#add-shift .btn-close")?.click();
      fetchShifts();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create shift");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/hrm/shifts/${id}`);
      fetchShifts();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete shift");
    }
  };

  const columns = [
    { title: "Shift Name", dataIndex: "shiftname" },
    { title: "Timing", dataIndex: "time" },
    { title: "Break", dataIndex: "breakTime" },
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
              <h4>Shifts</h4>
              <h6>Manage employee work shifts</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchShifts} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-shift">
              <i className="ti ti-circle-plus me-1"></i> Add Shift
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && <div className="text-center py-5 text-muted">No shifts found.</div>}
              {!loading && !error && dataSource.length > 0 && <Table columns={columns} dataSource={dataSource} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-shift">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Shift</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Shift Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" placeholder="e.g., Morning Shift" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Start Time</label>
                    <input type="time" className="form-control" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">End Time</label>
                    <input type="time" className="form-control" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Break (minutes)</label>
                  <input type="number" min="0" className="form-control" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Shift"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shift;
