import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { apiClient } from "../../core/apiClient";

const CategoryList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formState, setFormState] = useState({ id: null, name: "", code: "", slug: "", isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchCategories = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/catalog/categories")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((c) => ({
          id: c.id,
          key: c.id,
          category: c.name,
          code: c.code,
          categoryslug: c.slug,
          createdon: new Date(c.createdAt).toLocaleDateString("en-PK"),
          status: c.isActive ? "Active" : "Inactive",
          isActive: c.isActive,
          productCount: c._count?.products || 0,
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load categories");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSave = async (e, isEdit = false) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      setFormError("Category name is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit && formState.id) {
        await apiClient.put(`/catalog/categories/${formState.id}`, {
          name: formState.name,
          code: formState.code || undefined,
          slug: formState.slug || undefined,
          isActive: formState.isActive,
        });
      } else {
        await apiClient.post("/catalog/categories", {
          name: formState.name,
          code: formState.code || undefined,
          slug: formState.slug || undefined,
          isActive: formState.isActive,
        });
      }
      setFormState({ id: null, name: "", code: "", slug: "", isActive: true });
      document.querySelector(isEdit ? "#edit-category .btn-close" : "#add-category .btn-close")?.click();
      fetchCategories();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/catalog/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Cannot delete category (it may have linked products).");
    }
  };

  const filteredData = dataSource.filter((item) =>
    !searchTerm.trim() ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.categoryslug || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: "Category Slug",
      dataIndex: "categoryslug",
      sorter: (a, b) => (a.categoryslug || "").localeCompare(b.categoryslug || ""),
    },
    {
      title: "Products",
      dataIndex: "productCount",
    },
    {
      title: "Created On",
      dataIndex: "createdon",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => (
        <span className={`badge ${text === "Active" ? "bg-success" : "bg-secondary"} fw-medium fs-10`}>
          {text}
        </span>
      ),
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
              data-bs-target="#edit-category"
              onClick={() => {
                setFormError(null);
                setFormState({
                  id: record.id,
                  name: record.category,
                  code: record.code || "",
                  slug: record.categoryslug || "",
                  isActive: record.isActive,
                });
              }}
            >
              <i data-feather="edit" className="feather-edit"></i>
            </Link>
            <Link
              className="p-2"
              to="#"
              onClick={() => handleDelete(record.id)}
            >
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
                <h4 className="fw-bold">Category</h4>
                <h6>Manage your clothing categories</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon onClick={fetchCategories} />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-category"
                onClick={() => {
                  setFormError(null);
                  setFormState({ id: null, name: "", code: "", slug: "", isActive: true });
                }}
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add Category
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
                    placeholder="Search categories..."
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
                    <p className="mt-2 text-muted">Loading categories...</p>
                  </div>
                )}
                {!loading && error && (
                  <div className="text-center py-5">
                    <i className="ti ti-alert-triangle fs-40 text-danger mb-2 d-block" />
                    <h5 className="text-danger">Could not load categories</h5>
                    <p className="text-muted">{error}</p>
                    <button className="btn btn-primary btn-sm" onClick={fetchCategories}>Retry</button>
                  </div>
                )}
                {!loading && !error && filteredData.length === 0 && (
                  <div className="text-center py-5">
                    <i className="ti ti-category fs-40 text-muted mb-2 d-block" />
                    <h5 className="text-muted">No categories found</h5>
                    <p className="text-muted">Click "Add Category" to create your first clothing category.</p>
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

      {/* Add Category Modal */}
      <div className="modal fade" id="add-category">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Category</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, false)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Category Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Shalwar Kameez, Kurtas, Trousers"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Category Slug</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Auto-generated if left blank"
                    value={formState.slug}
                    onChange={(e) => setFormState({ ...formState, slug: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary fs-13 fw-medium p-2 px-3" disabled={submitting}>
                  {submitting ? "Saving..." : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      <div className="modal fade" id="edit-category">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Edit Category</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, true)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Category Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Category Slug</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.slug}
                    onChange={(e) => setFormState({ ...formState, slug: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary fs-13 fw-medium p-2 px-3" disabled={submitting}>
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

export default CategoryList;
