import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { apiClient } from "../../core/apiClient";

const SubCategories = () => {
  const [dataSource, setDataSource] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formState, setFormState] = useState({ id: null, categoryId: "", name: "", code: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, catRes] = await Promise.all([
        apiClient.get("/catalog/subcategories"),
        apiClient.get("/catalog/categories")
      ]);
      const items = subRes.data?.data?.items || [];
      setCategories(catRes.data?.data?.items || []);
      setDataSource(items.map((s) => ({
        id: s.id,
        key: s.id,
        categoryId: s.categoryId,
        category: s.category?.name || "—",
        parentcategory: s.category?.name || "—",
        subcategory: s.name,
        categorycode: s.code,
        description: s.description || "—",
        status: "Active",
      })));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load sub-categories");
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (e, isEdit = false) => {
    e.preventDefault();
    if (!formState.categoryId || !formState.name.trim()) {
      setFormError("Parent category and sub-category name are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        categoryId: formState.categoryId,
        name: formState.name,
        code: formState.code || undefined,
        description: formState.description || undefined,
      };
      if (isEdit && formState.id) {
        await apiClient.put(`/catalog/subcategories/${formState.id}`, payload);
      } else {
        await apiClient.post("/catalog/subcategories", payload);
      }
      setFormState({ id: null, categoryId: "", name: "", code: "", description: "" });
      document.querySelector(isEdit ? "#edit-subcategory .btn-close" : "#add-subcategory .btn-close")?.click();
      fetchData();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to save sub-category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/catalog/subcategories/${id}`);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete sub-category");
    }
  };

  const filteredData = dataSource.filter((item) =>
    !searchTerm.trim() ||
    item.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: "Category", dataIndex: "category", sorter: (a, b) => a.category.localeCompare(b.category) },
    { title: "Sub Category", dataIndex: "subcategory", sorter: (a, b) => a.subcategory.localeCompare(b.subcategory) },
    { title: "Category Code", dataIndex: "categorycode" },
    { title: "Description", dataIndex: "description" },
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
              data-bs-target="#edit-subcategory"
              onClick={() => {
                setFormError(null);
                setFormState({
                  id: record.id,
                  categoryId: record.categoryId,
                  name: record.subcategory,
                  code: record.categorycode || "",
                  description: record.description === "—" ? "" : record.description,
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
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4 className="fw-bold">Sub Category</h4>
                <h6>Manage your clothing sub-categories</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon onClick={fetchData} />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-subcategory"
                onClick={() => {
                  setFormError(null);
                  setFormState({ id: null, categoryId: categories[0]?.id || "", name: "", code: "", description: "" });
                }}
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add Sub Category
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
                    placeholder="Search sub-categories..."
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
                    <p className="mt-2 text-muted">Loading sub-categories...</p>
                  </div>
                )}
                {!loading && error && (
                  <div className="text-center py-5">
                    <i className="ti ti-alert-triangle fs-40 text-danger mb-2 d-block" />
                    <h5 className="text-danger">Could not load sub-categories</h5>
                    <p className="text-muted">{error}</p>
                    <button className="btn btn-primary btn-sm" onClick={fetchData}>Retry</button>
                  </div>
                )}
                {!loading && !error && filteredData.length === 0 && (
                  <div className="text-center py-5">
                    <i className="ti ti-category-2 fs-40 text-muted mb-2 d-block" />
                    <h5 className="text-muted">No sub-categories found</h5>
                    <p className="text-muted">Create a category first, then add sub-categories here.</p>
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

      {/* Add SubCategory Modal */}
      <div className="modal fade" id="add-subcategory">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Sub Category</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, false)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Parent Category<span className="text-danger ms-1">*</span></label>
                  <select
                    className="form-select"
                    value={formState.categoryId}
                    onChange={(e) => setFormState({ ...formState, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Sub Category Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Add Sub Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit SubCategory Modal */}
      <div className="modal fade" id="edit-subcategory">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Edit Sub Category</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, true)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Parent Category<span className="text-danger ms-1">*</span></label>
                  <select
                    className="form-select"
                    value={formState.categoryId}
                    onChange={(e) => setFormState({ ...formState, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Sub Category Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
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

export default SubCategories;
