import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { apiClient } from "../../core/apiClient";

const QuotationList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ customerId: "", productId: "", quantity: "1", unitPrice: "0", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [qtRes, custRes, prodRes] = await Promise.all([
        apiClient.get("/sales/quotations"),
        apiClient.get("/customers"),
        apiClient.get("/products", { params: { limit: 100 } }),
      ]);
      const items = qtRes.data?.data?.items || [];
      setCustomers(custRes.data?.data?.items || []);
      const prods = prodRes.data?.data?.items || [];
      setProducts(prods);
      if (prods[0] && !form.productId) {
        setForm((prev) => ({ ...prev, productId: prods[0].id, unitPrice: String(prods[0].sellingPrice || 0) }));
      }
      setDataSource(items.map((q) => ({
        id: q.id,
        key: q.id,
        quotationNumber: q.quotationNumber,
        Product_Name: q.productName,
        Custmer_Name: q.customerName,
        Total: `Rs ${Number(q.totalAmount).toFixed(2)}`,
        Status: q.status,
        Date: new Date(q.createdAt).toLocaleDateString("en-PK"),
      })));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load quotations");
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
    if (!form.productId || Number(form.quantity) <= 0) {
      setFormError("Select a product and positive quantity.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiClient.post("/sales/quotations", {
        customerId: form.customerId || null,
        notes: form.notes || undefined,
        items: [{
          productId: form.productId,
          quantity: Number(form.quantity),
          unitPrice: Number(form.unitPrice || 0),
        }],
      });
      document.querySelector("#add-quotation .btn-close")?.click();
      fetchData();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to create quotation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvert = async (id) => {
    try {
      await apiClient.post(`/sales/quotations/${id}/convert-to-sale`);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to convert quotation to sale");
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/sales/quotations/${id}`);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete quotation");
    }
  };

  const filtered = dataSource.filter((q) =>
    !searchTerm.trim() ||
    q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.Product_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.Custmer_Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: "Quotation #", dataIndex: "quotationNumber" },
    { title: "Product", dataIndex: "Product_Name" },
    { title: "Customer", dataIndex: "Custmer_Name" },
    { title: "Total", dataIndex: "Total" },
    { title: "Date", dataIndex: "Date" },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text) => (
        <span className={`badge ${text === "CONVERTED" ? "bg-success" : "bg-warning"} badge-xs`}>
          {text}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="d-flex gap-2">
          {record.Status !== "CONVERTED" && (
            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => handleConvert(record.id)}>
              Convert to Sale
            </button>
          )}
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(record.id)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Quotation List</h4>
              <h6>Manage customer quotations and convert to sales</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchData} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-quotation">
              <i className="ti ti-circle-plus me-1"></i> Add Quotation
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <div className="search-set">
              <div className="search-input">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search quotations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-5 text-muted">No quotations found.</div>
              )}
              {!loading && !error && filtered.length > 0 && <Table columns={columns} dataSource={filtered} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-quotation">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Quotation</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Customer</label>
                  <select className="form-select" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                    <option value="">Walk-in Customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Product<span className="text-danger ms-1">*</span></label>
                  <select
                    className="form-select"
                    value={form.productId}
                    onChange={(e) => {
                      const p = products.find((x) => x.id === e.target.value);
                      setForm({ ...form, productId: e.target.value, unitPrice: String(p?.sellingPrice || 0) });
                    }}
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Rs {Number(p.sellingPrice || 0)})</option>)}
                  </select>
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Quantity</label>
                    <input type="number" min="1" className="form-control" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Unit Price (Rs)</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Creating..." : "Create Quotation"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationList;
