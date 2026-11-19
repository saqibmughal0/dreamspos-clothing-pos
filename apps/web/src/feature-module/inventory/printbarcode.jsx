import React, { useState, useEffect } from "react";
import CommonFooter from "../../core/common/footer/commonFooter";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import { apiClient } from "../../core/apiClient";
import { BarcodeSvg } from "../../core/common/BarcodeSvg";

const PrintBarcode = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showStoreName, setShowStoreName] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
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
      setError(err?.response?.data?.message || err?.message || "Failed to load products for barcode printing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addProductToQueue = (prod) => {
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

  const updateQty = (id, delta) => {
    setSelectedItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, x.qty + delta) } : x))
    );
  };

  const removeItem = (id) => {
    setSelectedItems((prev) => prev.filter((x) => x.id !== id));
  };

  const filteredProducts = products.filter(
    (p) =>
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeStoreName = stores.find((s) => s.id === selectedStore)?.name || "MR Bilal POS";

  return (
    <div className="page-wrapper notes-page-wrapper">
      <div className="content">
        <div className="page-header d-print-none">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">Print Barcode</h4>
              <h6>Generate and print Code128 garment hangtag barcodes</h6>
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
                <label className="form-label">Search Product / SKU / Barcode</label>
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
              <div className="text-center py-4 text-muted">No products found in inventory. Add products first.</div>
            ) : (
              <div className="d-flex flex-wrap gap-2 mb-3">
                {filteredProducts.slice(0, 12).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => addProductToQueue(p)}
                  >
                    + {p.name} ({p.sku})
                  </button>
                ))}
              </div>
            )}

            {selectedItems.length > 0 && (
              <div className="table-responsive mb-3">
                <table className="table table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Barcode</th>
                      <th>Price</th>
                      <th>Labels Qty</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.sku}</td>
                        <td>{item.barcode}</td>
                        <td>Rs {item.price.toFixed(2)}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => updateQty(item.id, -1)}>-</button>
                            <span className="btn btn-light">{item.qty}</span>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => updateQty(item.id, 1)}>+</button>
                          </div>
                        </td>
                        <td>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(item.id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex gap-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" checked={showStoreName} onChange={(e) => setShowStoreName(e.target.checked)} id="swStore" />
                  <label className="form-check-label" htmlFor="swStore">Store Name</label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" checked={showProductName} onChange={(e) => setShowProductName(e.target.checked)} id="swProd" />
                  <label className="form-check-label" htmlFor="swProd">Product Name</label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} id="swPrice" />
                  <label className="form-check-label" htmlFor="swPrice">Price (Rs)</label>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedItems([])}>Reset</button>
                <button type="button" className="btn btn-primary" disabled={selectedItems.length === 0} onClick={() => window.print()}>
                  <i className="ti ti-printer me-1" /> Print Barcodes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Label Grid */}
        {selectedItems.length > 0 && (
          <div className="row g-3">
            {selectedItems.flatMap((item) =>
              Array.from({ length: item.qty }).map((_, idx) => (
                <div key={`${item.id}-${idx}`} className="col-md-3 col-sm-4 col-6">
                  <div className="border bg-white p-3 text-center rounded">
                    {showStoreName && <div className="fw-bold fs-12 mb-1">{activeStoreName}</div>}
                    {showProductName && <div className="fs-13 text-truncate mb-1">{item.name}</div>}
                    <div className="my-1 px-2">
                      <BarcodeSvg value={item.barcode} height={44} />
                    </div>
                    <div className="fs-11 text-muted">{item.barcode}</div>
                    {showPrice && <div className="fw-bold fs-14 mt-1">Rs {item.price.toLocaleString()}</div>}
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

export default PrintBarcode;
