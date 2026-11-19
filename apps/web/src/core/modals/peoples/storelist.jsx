import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../../core/pagination/datatable";
import TooltipIcons from "../../common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../common/tooltip-content/refresh";
import CollapesIcon from "../../common/tooltip-content/collapes";
import { PlusCircle } from "feather-icons-react/build/IconComponents";
import CommonFooter from "../../common/footer/commonFooter";
import { apiClient } from "../../../core/apiClient";

const StoreList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ id: null, name: "", code: "", phone: "", address: "", isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchStores = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/catalog/stores")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setData(items.map((s) => ({
          id: s.id,
          key: s.id,
          name: s.name,
          code: s.code,
          phone: s.phone || "—",
          address: s.address || "—",
          status: s.isActive ? "Active" : "Inactive",
          isActive: s.isActive,
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load stores");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleSave = async (e, isEdit = false) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Store name is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        code: form.code || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        isActive: form.isActive,
      };
      if (isEdit && form.id) {
        await apiClient.put(`/catalog/stores/${form.id}`, payload);
      } else {
        await apiClient.post("/catalog/stores", payload);
      }
      setForm({ id: null, name: "", code: "", phone: "", address: "", isActive: true });
      document.querySelector(isEdit ? "#edit-store .btn-close" : "#add-store .btn-close")?.click();
      fetchStores();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to save store");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/catalog/stores/${id}`);
      fetchStores();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Cannot delete store (may have linked sales).");
    }
  };

  const filtered = data.filter((s) =>
    !searchTerm.trim() ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: "Store Name", dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: "Code", dataIndex: "code" },
    { title: "Phone", dataIndex: "phone" },
    { title: "Address", dataIndex: "address" },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => <span className={`badge ${text === "Active" ? "bg-success" : "bg-secondary"} badge-xs`}>{text}</span>,
    },
    {
      title: "Action",
      key: "actions",
      render: (_, record) => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link
              className="me-2 p-2"
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#edit-store"
              onClick={() => {
                setFormError(null);
                setForm({
                  id: record.id,
                  name: record.name,
                  code: record.code || "",
                  phone: record.phone === "—" ? "" : record.phone,
                  address: record.address === "—" ? "" : record.address,
                  isActive: record.isActive,
                });
              }}
            >
              <i data-feather="edit" className="feather-edit" />
            </Link>
            <Link className="p-2" to="#" onClick={() => handleDelete(record.id)}>
              <i data-feather="trash-2" className="feather-trash-2" />
            </Link>
          </div>
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
              <h4>Stores</h4>
              <h6>Manage your retail store branches</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchStores} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link
              to="#"
              className="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#add-store"
              onClick={() => {
                setFormError(null);
                setForm({ id: null, name: "", code: "", phone: "", address: "", isActive: true });
              }}
            >
              <PlusCircle className="me-2" /> Add Store
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
                  placeholder="Search stores..."
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
                <div className="text-center py-5 text-muted">No stores found.</div>
              )}
              {!loading && !error && filtered.length > 0 && <Table columns={columns} dataSource={filtered} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      {/* Add Store Modal */}
      <div className="modal fade" id="add-store">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Store</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={(e) => handleSave(e, false)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Store Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Code</label>
                  <input type="text" className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input type="text" className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Store"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Store Modal */}
      <div className="modal fade" id="edit-store">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Edit Store</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={(e) => handleSave(e, true)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Store Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Code</label>
                  <input type="text" className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input type="text" className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreList;
