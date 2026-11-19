import React, { useState, useEffect } from "react";
import CommonFooter from "../../core/common/footer/commonFooter";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";
import { QrSvg } from "../../core/common/BarcodeSvg";

const QRcode = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showRef, setShowRef] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [whRes, stRes, prodRes] = await Promise.all([
        apiClient.get("/catalog/warehouses"),
        apiClient.get("/catalog/stores"),
        apiClient.get("/products", { params: { limit: 100 } }),
      ]);
      const whs = whRes.data?.data?.items || [];
      const sts = stRes.data?.data?.items || [];
      const prods = prodRes.data?.data?.items || [];
      setWarehouses(whs);
      setStores(sts);
      setProducts(prods);
      if (whs[0]) setSelectedWarehouse(whs[0].id);
      if (sts[0]) setSelectedStore(sts[0].id);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load products for QR printing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addProduct = (prod) => {
    setSelectedItems((prev) => {
      const exists = prev.find((x) => x.id === prod.id);
      if (exists) return prev.map((x) => (x.id === prod.id ? { ...x, qty: x.qty + 1 } : x));
      return [
        ...prev,
        {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          barcode: prod.barcode || prod.sku,
          price: Number(prod.sellingPrice || 0),
          qty: 1,
        },
      ];
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-wrapper notes-page-wrapper">
      <div className="content">
        <div className="page-header d-print-none">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">Print QR Code</h4>
              <h6>Generate and print product QR labels</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <RefreshIcon onClick={loadData} />
            <CollapesIcon />
          </ul>
        </div>

        {error && <div className="alert alert-danger d-print-none">{error}</div>}

        <div className="card mb-4 d-print-none">
          <div className="card-body">
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label">Warehouse</label>
                <select className="form-select" value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)}>
                  {warehouses.length === 0 && <option value="">No warehouses</option>}
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Store</label>
                <select className="form-select" value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
                  {stores.length === 0 && <option value="">MR Bilal POS</option>}
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Search Product</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {!loading && products.length === 0 ? (
              <div className="text-center py-4 text-muted">No products found in inventory.</div>
            ) : (
              <div className="d-flex flex-wrap gap-2 mb-3">
                {filteredProducts.slice(0, 12).map((p) => (
                  <button key={p.id} type="button" className="btn btn-sm btn-outline-primary" onClick={() => addProduct(p)}>
                    + {p.name} ({p.sku})
                  </button>
                ))}
              </div>
            )}

            <div className="d-flex align-items-center justify-content-between">
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" checked={showRef} onChange={(e) => setShowRef(e.target.checked)} id="swQrRef" />
                <label className="form-check-label" htmlFor="swQrRef">Show SKU / Reference</label>
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedItems([])}>Reset</button>
                <button type="button" className="btn btn-primary" disabled={selectedItems.length === 0} onClick={() => window.print()}>
                  <i className="ti ti-printer me-1" /> Print QR Codes
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div className="row g-3">
            {selectedItems.flatMap((item) =>
              Array.from({ length: item.qty }).map((_, idx) => (
                <div key={`${item.id}-${idx}`} className="col-md-3 col-sm-4 col-6">
                  <div className="border bg-white p-3 text-center rounded">
                    <div className="fw-bold fs-13 text-truncate mb-2">{item.name}</div>
                    <QrSvg value={item.barcode} size={96} />
                    {showRef && <div className="fs-11 text-muted mt-2">{item.sku}</div>}
                    <div className="fw-bold fs-13 mt-1">Rs {item.price.toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <CommonFooter />
    </div>
  );
};

export default QRcode;
