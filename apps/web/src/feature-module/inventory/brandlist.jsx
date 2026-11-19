import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom/dist";
import Table from "../../core/pagination/datatable";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { PlusCircle } from "feather-icons-react/build/IconComponents";
import { apiClient } from "../../core/apiClient";

const BrandList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formState, setFormState] = useState({ id: null, name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchBrands = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/catalog/brands")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((b) => ({
          id: b.id,
          key: b.id,
          brand: b.name,
          description: b.description || "",
          productCount: b._count?.products || 0,
          createdon: new Date(b.createdAt).toLocaleDateString("en-PK"),
          status: "Active",
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load brands");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleSave = async (e, isEdit = false) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      setFormError("Brand name is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit && formState.id) {
        await apiClient.put(`/catalog/brands/${formState.id}`, {
          name: formState.name,
          description: formState.description || undefined,
        });
      } else {
        await apiClient.post("/catalog/brands", {
          name: formState.name,
          description: formState.description || undefined,
        });
      }
      setFormState({ id: null, name: "", description: "" });
      document.querySelector(isEdit ? "#edit-brand .btn-close" : "#add-brand .btn-close")?.click();
      fetchBrands();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to save brand");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/catalog/brands/${id}`);
      fetchBrands();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Cannot delete brand");
    }
  };

  const filteredData = dataSource.filter((item) =>
    !searchTerm.trim() || item.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: "Brand", dataIndex: "brand", sorter: (a, b) => a.brand.localeCompare(b.brand) },
    { title: "Products", dataIndex: "productCount" },
    { title: "Created Date", dataIndex: "createdon" },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => <span className="badge table-badge bg-success fw-medium fs-10">{text}</span>,
    },
    {
      title: "",
      dataIndex: "actions",
      key: "actions",
      render: (_, record) => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link
              className="me-2 p-2"
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#edit-brand"
              onClick={() => {
                setFormError(null);
                setFormState({ id: record.id, name: record.brand, description: record.description || "" });
              }}
            >
              <i data-feather="edit" className="feather-edit"></i>
            </Link>
            <Link className="p-2" to="#" onClick={() => handleDelete(record.id)}>
              <i data-feather="trash-2" className="feather-trash-2"></i>
            </Link>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Brand</h4>
                <h6>Manage your clothing brands</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon onClick={fetchBrands} />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-brand"
                onClick={() => {
                  setFormError(null);
                  setFormState({ id: null, name: "", description: "" });
                }}
              >
                <PlusCircle className="me-2" />
                Add Brand
              </Link>
            </div>
          </div>

          <div className="card table-list-card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                {loading && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-2 text-muted">Loading brands...</p>
                  </div>
                )}
                {!loading && error && (
                  <div className="text-center py-5">
                    <i className="ti ti-alert-triangle fs-40 text-danger mb-2 d-block" />
                    <h5 className="text-danger">Could not load brands</h5>
                    <p className="text-muted">{error}</p>
                    <button className="btn btn-primary btn-sm" onClick={fetchBrands}>Retry</button>
                  </div>
                )}
                {!loading && !error && filteredData.length === 0 && (
                  <div className="text-center py-5">
                    <i className="ti ti-tag-off fs-40 text-muted mb-2 d-block" />
                    <h5 className="text-muted">No brands found</h5>
                    <p className="text-muted">Click "Add Brand" to add a clothing brand.</p>
                  </div>
                )}
                {!loading && !error && filteredData.length > 0 && (
                  <Table columns={columns} dataSource={filteredData} />
                )}
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add Brand Modal */}
      <div className="modal fade" id="add-brand">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Brand</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, false)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Brand Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., MR Bilal Collection"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Add Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Brand Modal */}
      <div className="modal fade" id="edit-brand">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Edit Brand</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, true)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Brand Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandList;
