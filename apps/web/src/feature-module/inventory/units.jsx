import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { apiClient } from "../../core/apiClient";

export const Units = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formState, setFormState] = useState({ id: null, name: "", shortName: "", allowDecimal: false });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchUnits = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/catalog/units")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((u) => ({
          id: u.id,
          key: u.id,
          unit: u.name,
          shortname: u.shortName,
          allowDecimal: u.allowDecimal,
          noofproducts: String(u._count?.products || 0),
          createdon: new Date(u.createdAt).toLocaleDateString("en-PK"),
          status: "Active",
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load units");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleSave = async (e, isEdit = false) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.shortName.trim()) {
      setFormError("Unit name and short name are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        name: formState.name,
        shortName: formState.shortName,
        allowDecimal: formState.allowDecimal,
      };
      if (isEdit && formState.id) {
        await apiClient.put(`/catalog/units/${formState.id}`, payload);
      } else {
        await apiClient.post("/catalog/units", payload);
      }
      setFormState({ id: null, name: "", shortName: "", allowDecimal: false });
      document.querySelector(isEdit ? "#edit-units .btn-close" : "#add-units .btn-close")?.click();
      fetchUnits();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to save unit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/catalog/units/${id}`);
      fetchUnits();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Cannot delete unit");
    }
  };

  const filteredData = dataSource.filter((item) =>
    !searchTerm.trim() ||
    item.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.shortname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: "Unit", dataIndex: "unit", sorter: (a, b) => a.unit.localeCompare(b.unit) },
    { title: "Short Name", dataIndex: "shortname", sorter: (a, b) => a.shortname.localeCompare(b.shortname) },
    { title: "No of Products", dataIndex: "noofproducts" },
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
              data-bs-target="#edit-units"
              onClick={() => {
                setFormError(null);
                setFormState({
                  id: record.id,
                  name: record.unit,
                  shortName: record.shortname,
                  allowDecimal: Boolean(record.allowDecimal),
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
                <h4 className="fw-bold">Units</h4>
                <h6>Manage your measurement units (Piece, Suit, Meter, etc.)</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon onClick={fetchUnits} />
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
                  setFormState({ id: null, name: "", shortName: "", allowDecimal: false });
                }}
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add Unit
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
                    placeholder="Search units..."
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
                    <p className="mt-2 text-muted">Loading units...</p>
                  </div>
                )}
                {!loading && error && (
                  <div className="text-center py-5">
                    <i className="ti ti-alert-triangle fs-40 text-danger mb-2 d-block" />
                    <h5 className="text-danger">Could not load units</h5>
                    <p className="text-muted">{error}</p>
                    <button className="btn btn-primary btn-sm" onClick={fetchUnits}>Retry</button>
                  </div>
                )}
                {!loading && !error && filteredData.length === 0 && (
                  <div className="text-center py-5">
                    <i className="ti ti-ruler fs-40 text-muted mb-2 d-block" />
                    <h5 className="text-muted">No units found</h5>
                    <p className="text-muted">Add units such as Piece (Pc), Suit (Suit), or Meter (m).</p>
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

      {/* Add Unit Modal */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Unit</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, false)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Unit Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Piece"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Short Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Pc"
                    value={formState.shortName}
                    onChange={(e) => setFormState({ ...formState, shortName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Add Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Unit Modal */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Edit Unit</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, true)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Unit Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Short Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.shortName}
                    onChange={(e) => setFormState({ ...formState, shortName: e.target.value })}
                    required
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
    </>
  );
};
export default Units;
