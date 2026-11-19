import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import CommonFooter from "../../core/common/footer/commonFooter";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";

const Warranty = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formState, setFormState] = useState({ id: null, name: "", duration: "7", durationUnit: "Days", description: "", isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchWarranties = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/catalog/warranties")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((w) => ({
          id: w.id,
          key: w.id,
          name: w.name,
          description: w.description || "—",
          duration: `${w.duration} ${w.durationUnit}`,
          rawDuration: w.duration,
          durationUnit: w.durationUnit,
          status: w.isActive ? "Active" : "Inactive",
          isActive: w.isActive,
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load warranties");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  const handleSave = async (e, isEdit = false) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      setFormError("Warranty / Policy name is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        name: formState.name,
        duration: Number(formState.duration || 0),
        durationUnit: formState.durationUnit,
        description: formState.description || undefined,
        isActive: formState.isActive,
      };
      if (isEdit && formState.id) {
        await apiClient.put(`/catalog/warranties/${formState.id}`, payload);
      } else {
        await apiClient.post("/catalog/warranties", payload);
      }
      setFormState({ id: null, name: "", duration: "7", durationUnit: "Days", description: "", isActive: true });
      document.querySelector(isEdit ? "#edit-units .btn-close" : "#add-units .btn-close")?.click();
      fetchWarranties();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to save warranty");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/catalog/warranties/${id}`);
      fetchWarranties();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete warranty");
    }
  };

  const filteredData = dataSource.filter((item) =>
    !searchTerm.trim() || item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: "Name", dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: "Description", dataIndex: "description" },
    { title: "Duration", dataIndex: "duration" },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => (
        <span className={`badge table-badge ${text === "Active" ? "bg-success" : "bg-secondary"} fw-medium fs-10`}>
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
              data-bs-target="#edit-units"
              onClick={() => {
                setFormError(null);
                setFormState({
                  id: record.id,
                  name: record.name,
                  duration: String(record.rawDuration),
                  durationUnit: record.durationUnit,
                  description: record.description === "—" ? "" : record.description,
                  isActive: record.isActive,
                });
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
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4 className="fw-bold">Warranties</h4>
                <h6>Manage garment exchange &amp; warranty policies</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon onClick={fetchWarranties} />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-units"
                onClick={() => {
                  setFormError(null);
                  setFormState({ id: null, name: "", duration: "7", durationUnit: "Days", description: "", isActive: true });
                }}
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add Warranty
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
                    placeholder="Search warranties..."
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
                    <p className="mt-2 text-muted">Loading warranties...</p>
                  </div>
                )}
                {!loading && error && (
                  <div className="text-center py-5">
                    <i className="ti ti-alert-triangle fs-40 text-danger mb-2 d-block" />
                    <h5 className="text-danger">Could not load warranties</h5>
                    <p className="text-muted">{error}</p>
                    <button className="btn btn-primary btn-sm" onClick={fetchWarranties}>Retry</button>
                  </div>
                )}
                {!loading && !error && filteredData.length === 0 && (
                  <div className="text-center py-5">
                    <i className="ti ti-certificate fs-40 text-muted mb-2 d-block" />
                    <h5 className="text-muted">No warranties found</h5>
                    <p className="text-muted">Add exchange or color-guarantee policies here.</p>
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

      {/* Add Warranty Modal */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Warranty</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, false)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Warranty / Policy Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" placeholder="e.g., 7-Day Size Exchange" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} required />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Duration<span className="text-danger ms-1">*</span></label>
                    <input type="number" min="1" className="form-control" value={formState.duration} onChange={(e) => setFormState({ ...formState, duration: e.target.value })} required />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Period</label>
                    <select className="form-select" value={formState.durationUnit} onChange={(e) => setFormState({ ...formState, durationUnit: e.target.value })}>
                      <option value="Days">Days</option>
                      <option value="Months">Months</option>
                      <option value="Years">Years</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} value={formState.description} onChange={(e) => setFormState({ ...formState, description: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Warranty"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Warranty Modal */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Edit Warranty</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, true)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Warranty / Policy Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} required />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Duration<span className="text-danger ms-1">*</span></label>
                    <input type="number" min="1" className="form-control" value={formState.duration} onChange={(e) => setFormState({ ...formState, duration: e.target.value })} required />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Period</label>
                    <select className="form-select" value={formState.durationUnit} onChange={(e) => setFormState({ ...formState, durationUnit: e.target.value })}>
                      <option value="Days">Days</option>
                      <option value="Months">Months</option>
                      <option value="Years">Years</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} value={formState.description} onChange={(e) => setFormState({ ...formState, description: e.target.value })} />
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
    </>
  );
};

export default Warranty;
