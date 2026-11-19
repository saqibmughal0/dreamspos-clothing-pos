import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle } from "feather-icons-react/build/IconComponents";
import { Link } from "react-router-dom";
import TooltipIcons from "../../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../../core/common/tooltip-content/collapes";
import Table from "../../../core/pagination/datatable.jsx";
import CommonFooter from "../../../core/common/footer/commonFooter";
import { apiClient } from "../../../core/apiClient";

const IncomeCategory = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchCategories = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/finance/income-categories")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((c) => ({
          id: c.id,
          key: c.id,
          Code: c.code,
          Category: c.name,
          Added_Date: new Date(c.createdAt).toLocaleDateString("en-PK"),
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load income categories");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Category name is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiClient.post("/finance/income-categories", {
        name: form.name,
        code: form.code || undefined,
        description: form.description || undefined,
      });
      setForm({ name: "", code: "", description: "" });
      document.querySelector("#add-income-cat .btn-close")?.click();
      fetchCategories();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to save income category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/finance/income-categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete income category");
    }
  };

  const columns = [
    { title: "Code", dataIndex: "Code" },
    { title: "Category", dataIndex: "Category" },
    { title: "Added Date", dataIndex: "Added_Date" },
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
              <h4>Income Category</h4>
              <h6>Manage income categories</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchCategories} />
            <CollapesIcon />
          </ul>
          <div className="page-btn">
            <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-income-cat">
              <PlusCircle className="me-2" /> Add Category
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-responsive">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
              {!loading && error && <div className="alert alert-danger">{error}</div>}
              {!loading && !error && dataSource.length === 0 && (
                <div className="text-center py-5 text-muted">No income categories found.</div>
              )}
              {!loading && !error && dataSource.length > 0 && (
                <Table columns={columns} dataSource={dataSource} />
              )}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      <div className="modal fade" id="add-income-cat">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Income Category</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Category Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Code</label>
                  <input type="text" className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save Category"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeCategory;
