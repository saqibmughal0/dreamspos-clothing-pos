import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle } from "feather-icons-react/build/IconComponents";
import { Link } from "react-router-dom";
import TooltipIcons from "../../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../../core/common/tooltip-content/collapes";
import Table from "../../../core/pagination/datatable.jsx";
import CommonFooter from "../../../core/common/footer/commonFooter";
import { apiClient } from "../../../core/apiClient";

const IncomeList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ categoryId: "", amount: "", paymentMethod: "CASH", referenceNumber: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incRes, catRes] = await Promise.all([
        apiClient.get("/finance/incomes"),
        apiClient.get("/finance/income-categories"),
      ]);
      const items = incRes.data?.data?.items || [];
      const cats = catRes.data?.data?.items || [];
      setCategories(cats);
      setDataSource(items.map((i) => ({
        id: i.id,
        key: i.id,
        Date: new Date(i.date).toLocaleDateString("en-PK"),
        Reference: i.incomeNumber,
        Category: i.categoryName || "—",
        Notes: i.notes || "—",
        Amount: `Rs ${Number(i.amount).toFixed(2)}`,
        Method: i.paymentMethod,
      })));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load income records");
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.categoryId || Number(form.amount) <= 0) {
      setFormError("Category and positive amount are required.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/finance/incomes", {
        categoryId: form.categoryId,
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        referenceNumber: form.referenceNumber || undefined,
        notes: form.notes || undefined,
      });
      setForm({ categoryId: "", amount: "", paymentMethod: "CASH", referenceNumber: "", notes: "" });
      document.querySelector("#add-income .btn-close")?.click();
      fetchData();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to save income");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/finance/incomes/${id}`);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete income");
    }
  };

  const columns = [
    { title: "Date", dataIndex: "Date" },
    { title: "Reference", dataIndex: "Reference" },
    { title: "Category", dataIndex: "Category" },
    { title: "Notes", dataIndex: "Notes" },
    { title: "Amount", dataIndex: "Amount" },
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
              <h4>Income</h4>
              <h6>Manage other business income records</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchData} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-income">
              <PlusCircle className="me-2" /> Add Income
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && (
                <div className="text-center py-5 text-muted">No income records found.</div>
              )}
              {!loading && !error && dataSource.length > 0 && (
                <Table columns={columns} dataSource={dataSource} />
              )}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-income">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Income</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Category<span className="text-danger ms-1">*</span></label>
                  <select className="form-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                    <option value="">Select Income Category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Amount (Rs)<span className="text-danger ms-1">*</span></label>
                  <input type="number" min="1" step="0.01" className="form-control" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save Income"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeList;
