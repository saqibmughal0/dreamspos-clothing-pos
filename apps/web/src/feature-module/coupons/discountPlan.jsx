import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import CommonFooter from "../../core/common/footer/commonFooter";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";

const DiscountPlan = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", targetCustomers: "ALL" });
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/promotions/discount-plans")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((p) => ({
          id: p.id,
          key: p.id,
          PlanName: p.name,
          Customers: p.targetCustomers,
          Status: p.isActive ? "Active" : "Inactive",
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load discount plans");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post("/promotions/discount-plans", form);
      setForm({ name: "", targetCustomers: "ALL" });
      document.querySelector("#add-discount-plan .btn-close")?.click();
      fetchPlans();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create discount plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/promotions/discount-plans/${id}`);
      fetchPlans();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete discount plan");
    }
  };

  const columns = [
    { title: "Plan Name", dataIndex: "PlanName" },
    { title: "Customers", dataIndex: "Customers" },
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
              <h4>Discount Plans</h4>
              <h6>Manage customer discount plans</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchPlans} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-discount-plan">
              <i className="ti ti-circle-plus me-1"></i> Add Discount Plan
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && <div className="text-center py-5 text-muted">No discount plans found.</div>}
              {!loading && !error && dataSource.length > 0 && <Table columns={columns} dataSource={dataSource} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-discount-plan">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Discount Plan</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Plan Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Target Customers</label>
                  <select className="form-select" value={form.targetCustomers} onChange={(e) => setForm({ ...form, targetCustomers: e.target.value })}>
                    <option value="ALL">All Customers</option>
                    <option value="VIP">VIP / Members</option>
                    <option value="WHOLESALE">Wholesale</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Plan"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountPlan;
