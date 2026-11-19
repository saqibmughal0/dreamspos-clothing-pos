import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/pagination/datatable";
import TooltipIcons from "../../core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { apiClient } from "../../core/apiClient";

const ExpiredProduct = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchExpired = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/products/expired")
      .then((res) => {
        const items = res.data?.data?.items || [];
        setDataSource(items.map((p) => ({
          id: p.id,
          key: p.id,
          sku: p.sku,
          product: p.name,
          category: p.categoryName || "—",
          manufactureddate: p.manufacturedDate ? new Date(p.manufacturedDate).toLocaleDateString("en-PK") : "—",
          expireddate: p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("en-PK") : "—",
          status: p.isExpired ? "Expired" : "Expiring Soon",
        })));
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || "Failed to load expired products");
        setDataSource([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchExpired();
  }, [fetchExpired]);

  const filteredData = dataSource.filter((item) =>
    !searchTerm.trim() ||
    item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: "SKU", dataIndex: "sku", sorter: (a, b) => a.sku.localeCompare(b.sku) },
    { title: "Product", dataIndex: "product", sorter: (a, b) => a.product.localeCompare(b.product) },
    { title: "Category", dataIndex: "category" },
    { title: "Manufactured Date", dataIndex: "manufactureddate" },
    { title: "Expired Date", dataIndex: "expireddate" },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => (
        <span className={`badge ${text === "Expired" ? "bg-danger" : "bg-warning"} fw-medium fs-10`}>
          {text}
        </span>
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
                <h4 className="fw-bold">Expired Products</h4>
                <h6>Products with expiry dates (only shown where applicable)</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon onClick={fetchExpired} />
              <CollapesIcon />
            </ul>
          </div>

          <div className="card table-list-card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search expired products..."
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
                    <p className="mt-2 text-muted">Checking expiry records...</p>
                  </div>
                )}
                {!loading && error && (
                  <div className="text-center py-5">
                    <i className="ti ti-alert-triangle fs-40 text-danger mb-2 d-block" />
                    <h5 className="text-danger">Could not load expired products</h5>
                    <p className="text-muted">{error}</p>
                    <button className="btn btn-primary btn-sm" onClick={fetchExpired}>Retry</button>
                  </div>
                )}
                {!loading && !error && filteredData.length === 0 && (
                  <div className="text-center py-5">
                    <i className="ti ti-circle-check fs-40 text-success mb-2 d-block" />
                    <h5 className="text-muted">No expired products</h5>
                    <p className="text-muted">Clothing items without expiry dates do not appear here.</p>
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
    </div>
  );
};

export default ExpiredProduct;
