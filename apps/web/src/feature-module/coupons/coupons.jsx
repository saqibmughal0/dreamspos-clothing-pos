import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import CommonFooter from "../../core/common/footer/commonFooter";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";

const Coupons = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ name: "", code: "", type: "PERCENTAGE", value: "", minPurchase: "0", maxUses: "", validUntil: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchCoupons = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/promotions/coupons")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((c) => ({
          id: c.id,
          key: c.id,
          Name: c.name,
          Code: c.code,
          Description: c.description || "—",
          Type: c.type,
          Discount: c.type === "PERCENTAGE" ? `${c.value}%` : `Rs ${c.value}`,
          Limit: c.maxUses ? `${c.usedCount}/${c.maxUses}` : "Unlimited",
          Valid: c.validUntil ? new Date(c.validUntil).toLocaleDateString("en-PK") : "No Expiry",
          Status: c.isActive ? "Active" : "Inactive",
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load coupons");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim() || !form.value) {
      setFormError("Name, code, and discount value are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiClient.post("/promotions/coupons", {
        name: form.name,
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minPurchase: Number(form.minPurchase || 0),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        validUntil: form.validUntil || null,
        description: form.description || undefined,
      });
      setForm({ name: "", code: "", type: "PERCENTAGE", value: "", minPurchase: "0", maxUses: "", validUntil: "", description: "" });
      document.querySelector("#add-coupon .btn-close")?.click();
      fetchCoupons();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to create coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/promotions/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete coupon");
    }
  };

  const filtered = dataSource.filter((c) =>
    !searchTerm.trim() ||
    c.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.Code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: "Name", dataIndex: "Name" },
    { title: "Code", dataIndex: "Code", render: (text) => <span className="badge purple-badge">{text}</span> },
    { title: "Type", dataIndex: "Type" },
    { title: "Discount", dataIndex: "Discount" },
    { title: "Limit", dataIndex: "Limit" },
    { title: "Valid Until", dataIndex: "Valid" },
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
              <h4>Coupons</h4>
              <h6>Manage promotional discount coupons</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchCoupons} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-coupon">
              <i className="ti ti-circle-plus me-1"></i> Add Coupon
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <div className="search-set">
              <div className="search-input">
                <input type="text" className="form-control form-control-sm" placeholder="Search coupons..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && filtered.length === 0 && <div className="text-center py-5 text-muted">No coupons found.</div>}
              {!loading && !error && filtered.length > 0 && <Table columns={columns} dataSource={filtered} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-coupon">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Coupon</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Coupon Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" placeholder="e.g., Eid Sale 10%" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Code<span className="text-danger ms-1">*</span></label>
                    <input type="text" className="form-control" placeholder="EID10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed (Rs)</option>
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Discount Value<span className="text-danger ms-1">*</span></label>
                    <input type="number" min="1" step="0.01" className="form-control" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Max Uses</label>
                    <input type="number" min="1" className="form-control" placeholder="Unlimited" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Valid Until</label>
                  <input type="date" className="form-control" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Coupon"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Coupons;
