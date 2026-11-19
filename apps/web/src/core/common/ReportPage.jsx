import React, { useState, useEffect, useCallback } from "react";
import Table from "../pagination/datatable";
import CommonFooter from "./footer/commonFooter";
import TooltipIcons from "./tooltip-content/tooltipIcons";
import RefreshIcon from "./tooltip-content/refresh";
import CollapesIcon from "./tooltip-content/collapes";
import { apiClient } from "../apiClient";

const ReportPage = ({
  title,
  subtitle,
  endpoint,
  columns,
  mapRow,
  showStoreFilter = false,
  summaryBuilder = null,
}) => {
  const [rows, setRows] = useState([]);
  const [rawMeta, setRawMeta] = useState({});
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (showStoreFilter) {
      apiClient.get("/catalog/stores")
        .then((res) => setStores(res.data?.data?.items || []))
        .catch(() => setStores([]));
    }
  }, [showStoreFilter]);

  const fetchReport = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (startDate && endDate) {
      params.startDate = new Date(startDate).toISOString();
      params.endDate = new Date(endDate + "T23:59:59").toISOString();
    }
    if (storeId) params.storeId = storeId;

    apiClient.get(endpoint, { params })
      .then((res) => {
        const data = res.data?.data || {};
        const items = data.items || [];
        setRawMeta(data);
        setRows(items.map((item, idx) => mapRow(item, idx)));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || `Failed to load ${title}`);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [endpoint, startDate, endDate, storeId, mapRow, title]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filtered = rows.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q));
  });

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const headers = columns.map((c) => c.title);
    const keys = columns.map((c) => c.dataIndex);
    const lines = [
      headers.join(","),
      ...filtered.map((row) =>
        keys.map((k) => `"${String(row[k] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryItems = summaryBuilder ? summaryBuilder(filtered, rawMeta) : [];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-print-none">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>{title}</h4>
              <h6>{subtitle}</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <TooltipIcons />
            <RefreshIcon onClick={fetchReport} />
            <CollapesIcon />
          </ul>
          <div className="page-btn d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={exportCsv} disabled={filtered.length === 0}>
              <i className="ti ti-download me-1" /> Export CSV
            </button>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <i className="ti ti-printer me-1" /> Print
            </button>
          </div>
        </div>

        {summaryItems.length > 0 && (
          <div className="row mb-3">
            {summaryItems.map((s) => (
              <div key={s.label} className="col-md-3 col-sm-6 mb-2">
                <div className="card mb-0">
                  <div className="card-body py-3">
                    <p className="text-muted mb-1 fs-13">{s.label}</p>
                    <h5 className="mb-0 fw-bold">{s.value}</h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card table-list-card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 d-print-none">
            <div className="d-flex align-items-center flex-wrap gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ width: "200px" }}
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <input
                type="date"
                className="form-control form-control-sm"
                style={{ width: "150px" }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
              />
              <input
                type="date"
                className="form-control form-control-sm"
                style={{ width: "150px" }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
              />
              {showStoreFilter && (
                <select
                  className="form-select form-select-sm"
                  style={{ width: "160px" }}
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                >
                  <option value="">All Stores</option>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
              {(startDate || endDate || storeId) && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => { setStartDate(""); setEndDate(""); setStoreId(""); }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="card-body">
            <div className="table-responsive">
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" />
                  <p className="mt-2 text-muted">Loading {title.toLowerCase()}...</p>
                </div>
              )}
              {!loading && error && (
                <div className="alert alert-danger d-flex justify-content-between align-items-center">
                  <span>{error}</span>
                  <button type="button" className="btn btn-sm btn-danger" onClick={fetchReport}>Retry</button>
                </div>
              )}
              {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-5 text-muted">
                  <i className="ti ti-report-off fs-36 d-block mb-2" />
                  No records found for {title.toLowerCase()}.
                </div>
              )}
              {!loading && !error && filtered.length > 0 && (
                <Table columns={columns} dataSource={filtered} />
              )}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />
    </div>
  );
};

export default ReportPage;
