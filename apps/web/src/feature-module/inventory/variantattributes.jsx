import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../core/pagination/datatable';
import CommonFooter from '../../core/common/footer/commonFooter';
import TooltipIcons from '../../core/common/tooltip-content/tooltipIcons';
import RefreshIcon from '../../core/common/tooltip-content/refresh';
import CollapesIcon from '../../core/common/tooltip-content/collapes';
import { apiClient } from '../../core/apiClient';

const VariantAttributes = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState({ id: null, name: '', values: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchAttributes = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get('/catalog/variant-attributes')
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((a) => ({
          id: a.id,
          key: a.id,
          variant: a.name,
          values: a.values,
          createdon: new Date(a.createdAt).toLocaleDateString('en-PK'),
          status: a.isActive ? 'Active' : 'Inactive',
          isActive: a.isActive,
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || 'Failed to load variant attributes');
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const handleSave = async (e, isEdit = false) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.values.trim()) {
      setFormError('Attribute name and values are required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = { name: formState.name, values: formState.values, isActive: formState.isActive };
      if (isEdit && formState.id) {
        await apiClient.put(`/catalog/variant-attributes/${formState.id}`, payload);
      } else {
        await apiClient.post('/catalog/variant-attributes', payload);
      }
      setFormState({ id: null, name: '', values: '', isActive: true });
      document.querySelector(isEdit ? '#edit-units .btn-close' : '#add-units .btn-close')?.click();
      fetchAttributes();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save variant attribute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/catalog/variant-attributes/${id}`);
      fetchAttributes();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete variant attribute');
    }
  };

  const filteredData = dataSource.filter((item) =>
    !searchTerm.trim() ||
    item.variant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.values.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: 'Variant', dataIndex: 'variant', sorter: (a, b) => a.variant.localeCompare(b.variant) },
    { title: 'Values', dataIndex: 'values' },
    { title: 'Created On', dataIndex: 'createdon' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (text) => (
        <span className={`badge table-badge ${text === 'Active' ? 'bg-success' : 'bg-secondary'} fw-medium fs-10`}>
          {text}
        </span>
      ),
    },
    {
      title: '',
      dataIndex: 'actions',
      key: 'actions',
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
                setFormState({ id: record.id, name: record.variant, values: record.values, isActive: record.isActive });
              }}
            >
              <i data-feather="edit" className="feather-edit"></i>
            </Link>
            <Link to="#" className="p-2" onClick={() => handleDelete(record.id)}>
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
                <h4 className="fw-bold">Variant Attributes</h4>
                <h6>Manage clothing sizes, colors, and fabric attributes</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon onClick={fetchAttributes} />
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
                  setFormState({ id: null, name: '', values: '', isActive: true });
                }}
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add Variant
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
                    placeholder="Search attributes..."
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
                    <p className="mt-2 text-muted">Loading variant attributes...</p>
                  </div>
                )}
                {!loading && error && (
                  <div className="text-center py-5">
                    <i className="ti ti-alert-triangle fs-40 text-danger mb-2 d-block" />
                    <h5 className="text-danger">Could not load variant attributes</h5>
                    <p className="text-muted">{error}</p>
                    <button className="btn btn-primary btn-sm" onClick={fetchAttributes}>Retry</button>
                  </div>
                )}
                {!loading && !error && filteredData.length === 0 && (
                  <div className="text-center py-5">
                    <i className="ti ti-checklist fs-40 text-muted mb-2 d-block" />
                    <h5 className="text-muted">No variant attributes found</h5>
                    <p className="text-muted">Add attributes like Size (S, M, L, XL) or Color (Black, White, Navy).</p>
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

      {/* Add Variant Modal */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Variant Attribute</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, false)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Attribute Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" placeholder="e.g., Size, Color" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Values (comma separated)<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" placeholder="e.g., S, M, L, XL, XXL" value={formState.values} onChange={(e) => setFormState({ ...formState, values: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Variant Modal */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Edit Variant Attribute</h4></div>
              <button type="button" className="close bg-danger text-white fs-16 btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={(e) => handleSave(e, true)}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label">Attribute Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Values (comma separated)<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={formState.values} onChange={(e) => setFormState({ ...formState, values: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default VariantAttributes;
