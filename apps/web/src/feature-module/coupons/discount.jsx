import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import CommonFooter from "../../core/common/footer/commonFooter";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";

const Discount = () => {
  const [dataSource, setDataSource] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", planId: "", type: "PERCENTAGE", value: "", validUntil: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [discRes, planRes] = await Promise.all([
        apiClient.get("/promotions/discounts"),
        apiClient.get("/promotions/discount-plans"),
      ]);
      const items = discRes.data?.data?.items || [];
      setPlans(planRes.data?.data?.items || []);
      setDataSource(items.map((d) => ({
        id: d.id,
        key: d.id,
        Name: d.name,
        Value: d.type === "PERCENTAGE" ? `${d.value}%` : `Rs ${d.value}`,
        DiscountPlan: d.plan?.name || "General",
        Valitidy: d.validUntil ? new Date(d.validUntil).toLocaleDateString("en-PK") : "No Expiry",
        Status: d.isActive ? "Active" : "Inactive",
      })));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load discounts");
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
    if (!form.name.trim() || !form.value) return;
    setSubmitting(true);
    try {
      await apiClient.post("/promotions/discounts", {
        name: form.name,
        planId: form.planId || null,
        type: form.type,
        value: Number(form.value),
        validUntil: form.validUntil || null,
      });
      setForm({ name: "", planId: "", type: "PERCENTAGE", value: "", validUntil: "" });
      document.querySelector("#add-discount .btn-close")?.click();
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create discount");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/promotions/discounts/${id}`);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete discount");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "Name" },
    { title: "Value", dataIndex: "Value" },
    { title: "Discount Plan", dataIndex: "DiscountPlan" },
    { title: "Validity", dataIndex: "Valitidy" },
    { title: "Status", dataIndex: "Status", render: (text) => <span className={`badge ${text === "Active" ? "bg-success" : "bg-secondary"} badge-xs`}>{text}</span> },
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
              <h4>Discounts</h4>
              <h6>Manage store discounts and seasonal offers</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchData} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-discount">
              <i className="ti ti-circle-plus me-1"></i> Add Discount
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && <div className="text-center py-5 text-muted">No discounts found.</div>}
              {!loading && !error && dataSource.length > 0 && <Table columns={columns} dataSource={dataSource} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-discount">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Discount</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Discount Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Discount Plan</label>
                  <select className="form-select" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
                    <option value="">None</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed (Rs)</option>
                    </select>
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Value<span className="text-danger ms-1">*</span></label>
                    <input type="number" min="1" step="0.01" className="form-control" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Valid Until</label>
                  <input type="date" className="form-control" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Discount"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discount;
