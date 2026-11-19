import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import CommonFooter from "../../core/common/footer/commonFooter";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";

const GiftCards = () => {
  const [dataSource, setDataSource] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ cardNumber: "", customerId: "", initialBalance: "", expiryDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gcRes, custRes] = await Promise.all([
        apiClient.get("/promotions/gift-cards"),
        apiClient.get("/customers"),
      ]);
      const items = gcRes.data?.data?.items || [];
      setCustomers(custRes.data?.data?.items || []);
      setDataSource(items.map((g) => ({
        id: g.id,
        key: g.id,
        GiftCard: g.cardNumber,
        Customer: g.customerName,
        IssuedDate: new Date(g.issuedDate).toLocaleDateString("en-PK"),
        ExpiryDate: g.expiryDate ? new Date(g.expiryDate).toLocaleDateString("en-PK") : "No Expiry",
        Amount: `Rs ${Number(g.initialBalance).toFixed(2)}`,
        Balance: `Rs ${Number(g.currentBalance).toFixed(2)}`,
        Status: g.status,
      })));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load gift cards");
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
    if (!form.cardNumber.trim() || Number(form.initialBalance) <= 0) {
      setFormError("Card number and positive initial balance are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiClient.post("/promotions/gift-cards", {
        cardNumber: form.cardNumber,
        customerId: form.customerId || null,
        initialBalance: Number(form.initialBalance),
        expiryDate: form.expiryDate || null,
      });
      setForm({ cardNumber: "", customerId: "", initialBalance: "", expiryDate: "" });
      document.querySelector("#add-gift-card .btn-close")?.click();
      fetchData();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to create gift card");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/promotions/gift-cards/${id}`);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete gift card");
    }
  };

  const columns = [
    { title: "Gift Card", dataIndex: "GiftCard" },
    { title: "Customer", dataIndex: "Customer" },
    { title: "Issued Date", dataIndex: "IssuedDate" },
    { title: "Expiry Date", dataIndex: "ExpiryDate" },
    { title: "Amount", dataIndex: "Amount" },
    { title: "Balance", dataIndex: "Balance" },
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
              <h4>Gift Cards</h4>
              <h6>Issue and track customer gift cards</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchData} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-gift-card">
              <i className="ti ti-circle-plus me-1"></i> Add Gift Card
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && <div className="text-center py-5 text-muted">No gift cards issued yet.</div>}
              {!loading && !error && dataSource.length > 0 && <Table columns={columns} dataSource={dataSource} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-gift-card">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Gift Card</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Card Number<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" placeholder="GC-2026-001" value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Customer</label>
                  <select className="form-select" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                    <option value="">Unassigned / Any Customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Initial Balance (Rs)<span className="text-danger ms-1">*</span></label>
                  <input type="number" min="1" step="0.01" className="form-control" value={form.initialBalance} onChange={(e) => setForm({ ...form, initialBalance: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Expiry Date</label>
                  <input type="date" className="form-control" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Issue Gift Card"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCards;
