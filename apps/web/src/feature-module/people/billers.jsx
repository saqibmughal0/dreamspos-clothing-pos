import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { apiClient } from "../../core/apiClient";

const Biller = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    id: null,
    name: "",
    companyName: "",
    email: "",
    phone: "",
    city: "",
    country: "Pakistan",
    address: "",
    taxNumber: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchBillers = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/billers", { params: searchTerm.trim() ? { search: searchTerm.trim() } : {} })
      .then((res) => {
        const items = res.data?.data?.items || [];
        setData(items.map((b, idx) => ({
          id: b.id,
          key: b.id || idx,
          code: `BL-${String(idx + 1).padStart(3, "0")}`,
          biller: b.name,
          company: b.companyName || "—",
          email: b.email || "—",
          phone: b.phone || "—",
          city: b.city || "—",
          country: b.country || "Pakistan",
          address: b.address || "",
          taxNumber: b.taxNumber || "",
          status: b.isActive ? "Active" : "Inactive",
          isActive: b.isActive,
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load billers");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [searchTerm]);

  useEffect(() => {
    fetchBillers();
  }, [fetchBillers]);

  const handleSave = async (e, isEdit = false) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Biller name is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        companyName: form.companyName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        city: form.city || undefined,
        country: form.country || "Pakistan",
        address: form.address || undefined,
        taxNumber: form.taxNumber || undefined,
        isActive: form.isActive,
      };
      if (isEdit && form.id) {
        await apiClient.put(`/billers/${form.id}`, payload);
      } else {
        await apiClient.post("/billers", payload);
      }
      setForm({ id: null, name: "", companyName: "", email: "", phone: "", city: "", country: "Pakistan", address: "", taxNumber: "", isActive: true });
      document.querySelector(isEdit ? "#edit-biller .btn-close" : "#add-biller .btn-close")?.click();
      fetchBillers();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to save biller");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/billers/${id}`);
      fetchBillers();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete biller");
    }
  };

  const columns = [
    { title: "Code", dataIndex: "code" },
    { title: "Biller", dataIndex: "biller", sorter: (a, b) => a.biller.localeCompare(b.biller) },
    { title: "Company Name", dataIndex: "company" },
    { title: "Email", dataIndex: "email" },
    { title: "Phone", dataIndex: "phone" },
    { title: "Country", dataIndex: "country" },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => <span className={`badge ${text === "Active" ? "bg-success" : "bg-secondary"} badge-xs`}>{text}</span>,
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link
              className="me-2 p-2"
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#edit-biller"
              onClick={() => {
                setFormError(null);
                setForm({
                  id: record.id,
                  name: record.biller,
                  companyName: record.company === "—" ? "" : record.company,
                  email: record.email === "—" ? "" : record.email,
                  phone: record.phone === "—" ? "" : record.phone,
                  city: record.city === "—" ? "" : record.city,
                  country: record.country || "Pakistan",
                  address: record.address || "",
                  taxNumber: record.taxNumber || "",
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
              <h4>Billers</h4>
              <h6>Manage authorized store billers</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchBillers} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link
              to="#"
              className="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#add-biller"
              onClick={() => {
                setFormError(null);
                setForm({ id: null, name: "", companyName: "", email: "", phone: "", city: "", country: "Pakistan", address: "", taxNumber: "", isActive: true });
              }}
            >
              <i className="ti ti-circle-plus me-1"></i> Add Biller
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
                  placeholder="Search billers..."
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
              {!loading && !error && data.length === 0 && (
                <div className="text-center py-5 text-muted">No billers found. Click "Add Biller" to add one.</div>
              )}
              {!loading && !error && data.length > 0 && <Table columns={columns} dataSource={data} />}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      {/* Add Biller Modal */}
      <div className="modal fade" id="add-biller">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Biller</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={(e) => handleSave(e, false)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Biller Name<span className="text-danger ms-1">*</span></label>
                    <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Company Name</label>
                    <input type="text" className="form-control" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">City</label>
                    <input type="text" className="form-control" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Country</label>
                    <input type="text" className="form-control" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Address</label>
                    <input type="text" className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Biller"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Biller Modal */}
      <div className="modal fade" id="edit-biller">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Edit Biller</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={(e) => handleSave(e, true)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Biller Name<span className="text-danger ms-1">*</span></label>
                    <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Company Name</label>
                    <input type="text" className="form-control" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">City</label>
                    <input type="text" className="form-control" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Country</label>
                    <input type="text" className="form-control" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  </div>
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

export default Biller;
