import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Select from "react-select";
import { all_routes } from '../../Router/all_routes';
import PosModals from '../../core/modals/pos-modal/posModals';
import { usePosStore } from '../../core/posStore';
import { useBarcodeScanner } from '../../core/hooks/useBarcodeScanner';
import { apiClient } from '../../core/apiClient';
import { CheckoutModal } from '../../core/modals/pos-modal/CheckoutModal';
import { ThermalReceiptModal } from '../../core/modals/pos-modal/ThermalReceiptModal';
import { CashRegisterModal } from '../../core/modals/pos-modal/CashRegisterModal';
import { ClothingExchangeModal } from '../../core/modals/pos-modal/ClothingExchangeModal';
import { formatCurrency } from '../../core/utils/businessSettings';
import { NO_PRODUCT_IMAGE, resolveMediaUrl } from '../../core/utils/mediaUrl';

const WALK_IN_CUSTOMER = { value: null, label: "Walk-in Customer" };

const Pos = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [customerOptions, setCustomerOptions] = useState([WALK_IN_CUSTOMER]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [scanMessage, setScanMessage] = useState('');
  const [businessSettings, setBusinessSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeRegisterSession, setActiveRegisterSession] = useState(null);
  const [registerChecked, setRegisterChecked] = useState(false);
  const [registerNotice, setRegisterNotice] = useState('');

  // Modals state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);

  const Location = useLocation();
  const navigate = useNavigate();
  const isRegisterOpen = Boolean(activeRegisterSession);

  // POS Zustand Store
  const {
    cart,
    customer,
    orderDiscount,
    shippingFee,
    heldOrders,
    lastCompletedSale,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomer,
    holdCurrentOrder,
    recallOrder,
    deleteHeldOrder,
    getSubtotal,
    getTotalTax,
    getGrandTotal,
    getItemCount
  } = usePosStore();

  // Initialize Hardware & Keyboard-Wedge Barcode Scanner
  useBarcodeScanner({
    onScanSuccess: (item) => {
      setScanMessage(`Scanned: ${item.name}`);
      setTimeout(() => setScanMessage(''), 3000);
    },
    onScanError: (barcode) => {
      setScanMessage(`Barcode not found: ${barcode}`);
      setTimeout(() => setScanMessage(''), 3000);
    }
  });

  // Fetch live products from backend
  const loadProducts = () => {
    setProductsLoading(true);
    setProductsError(null);
    apiClient.get('/products')
      .then((res) => {
        if (res.data?.success && res.data.data?.items) {
          setProducts(res.data.data.items);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => {
        setProductsError(err.message || "Failed to load products. Check your connection.");
      })
      .finally(() => setProductsLoading(false));
  };

  // Check active cash register shift from backend (never rely on localStorage)
  const checkActiveRegister = useCallback(async (autoOpenIfMissing = false) => {
    try {
      const res = await apiClient.get('/pos/register/active');
      const session = res.data?.success ? res.data.data || null : null;
      setActiveRegisterSession(session);
      if (!session && autoOpenIfMissing) {
        setShowRegisterModal(true);
      }
    } catch {
      setActiveRegisterSession(null);
      if (autoOpenIfMissing) {
        setShowRegisterModal(true);
      }
    } finally {
      setRegisterChecked(true);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    checkActiveRegister(true);
    apiClient.get('/settings')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setBusinessSettings(res.data.data);
        }
      })
      .catch(() => {
        // Fallback to default PKR / 0% tax
      });
    // Fetch live categories from database
    apiClient.get('/catalog/categories')
      .then((res) => {
        const items = res.data?.data?.items || [];
        setCategories(items);
      })
      .catch(() => {
        setCategories([]);
      });
    // Fetch customers
    apiClient.get('/customers')
      .then((res) => {
        if (res.data?.success && res.data.data?.items) {
          const opts = res.data.data.items.map((c) => ({ value: c.id, label: c.name }));
          setCustomerOptions([WALK_IN_CUSTOMER, ...opts]);
        }
      })
      .catch(() => {
        // Keep walk-in only on error — do not expose fake customers
        setCustomerOptions([WALK_IN_CUSTOMER]);
      });
  }, []);

  // Filter products by category and search term
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        activeTab === 'all' ||
        p.categoryCode === activeTab ||
        (p.categoryName && p.categoryName.toLowerCase().includes(activeTab.toLowerCase()));

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.variants && p.variants.some((v) =>
          v.sku.toLowerCase().includes(q) ||
          v.barcode?.includes(q) ||
          v.color.toLowerCase().includes(q) ||
          v.size.toLowerCase().includes(q)
        ));

      return matchCategory && matchSearch;
    });
  }, [products, activeTab, searchQuery]);

  // Handle Search input Enter key for manual barcode entry
  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 3) {
      e.preventDefault();
      if (!isRegisterOpen) {
        setShowRegisterModal(true);
        return;
      }
      try {
        const res = await apiClient.get(`/products/barcode/${encodeURIComponent(searchQuery.trim())}`);
        if (res.data?.success && res.data.data) {
          const item = res.data.data;
          const defaultTaxRate = Number(businessSettings?.tax?.rate || 0);
          const itemTaxRate = Number(item.taxRate || 0) > 0 ? Number(item.taxRate) : defaultTaxRate;
          addItem({
            id: item.id,
            variantId: item.variantId || null,
            name: item.name,
            size: item.size || null,
            color: item.color || null,
            sku: item.sku,
            sellingPrice: item.sellingPrice,
            taxRate: itemTaxRate,
            taxType: businessSettings?.tax?.type || 'EXCLUSIVE',
            image: item.image,
            stockQty: item.stockQuantity
          });
          setScanMessage(`Added: ${item.name}`);
          setSearchQuery('');
          setTimeout(() => setScanMessage(''), 3000);
        }
      } catch (err) {
        // Just leave the search query for listing filter
      }
    }
  };

  // Add Product to Cart with Selected Variant
  const handleAddProductWithVariant = (prod) => {
    if (!isRegisterOpen) {
      setShowRegisterModal(true);
      return;
    }
    const defaultTaxRate = Number(businessSettings?.tax?.rate || 0);
    const defaultTaxType = businessSettings?.tax?.type || 'EXCLUSIVE';
    const prodRate = Number(prod.taxRate || 0);
    const effectiveTaxRate = prodRate > 0 ? prodRate : defaultTaxRate;
    const selectedVariant = selectedVariants[prod.id] || (prod.variants && prod.variants[0]);
    if (selectedVariant) {
      addItem({
        id: prod.id,
        variantId: selectedVariant.id,
        name: `${prod.name} (${selectedVariant.color} - ${selectedVariant.size})`,
        size: selectedVariant.size,
        color: selectedVariant.color,
        sku: selectedVariant.sku,
        sellingPrice: selectedVariant.price || prod.sellingPrice,
        taxRate: effectiveTaxRate,
        taxType: defaultTaxType,
        image: prod.image,
        stockQty: selectedVariant.stockQty
      });
    } else {
      addItem({
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        sellingPrice: prod.sellingPrice,
        taxRate: effectiveTaxRate,
        taxType: defaultTaxType,
        image: prod.image,
        stockQty: prod.stockQuantity
      });
    }
  };

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (!isRegisterOpen) {
      setShowRegisterModal(true);
      return;
    }
    if (cart.length === 0) return;
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = () => {
    setShowCheckoutModal(false);
    setShowReceiptModal(true);
    checkActiveRegister(false);
  };

  // Compute accurate Sales Tax label matching actual cart tax rates
  const cartTaxLabel = useMemo(() => {
    if (cart.length === 0) return `Sales Tax (${Number(businessSettings?.tax?.rate || 0)}%)`;
    const rates = Array.from(new Set(cart.map((c) => Number(c.taxRate || 0))));
    if (rates.length === 1) return `Sales Tax (${rates[0]}%)`;
    return 'Sales Tax';
  }, [cart, businessSettings]);

  return (
    <div className='main-wrapper pos-five'>
      <div className="page-wrapper pos-pg-wrapper ms-0">
        <div className="content pos-design p-0">
          <div className="row pos-wrapper">
            {/* Products Main Column */}
            <div className="col-md-12 col-lg-7 col-xl-8 d-flex">
              <div className="pos-categories tabs_wrapper p-0 flex-fill">
                <div className="content-wrap">
                  {/* Category Tabs (Dynamic from Database) */}
                  <div className="tab-wrap">
                    <ul className="tabs pos-category5 d-flex list-unstyled gap-2 p-2 overflow-auto mb-0">
                      <li
                        id="all"
                        onClick={() => setActiveTab('all')}
                        className={`cursor-pointer ${activeTab === 'all' ? 'active' : ''}`}
                      >
                        <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('all'); }}>
                          <img src="assets/img/categories/category-01.svg" alt="All" />
                        </Link>
                        <h6><Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('all'); }}>All Items</Link></h6>
                      </li>
                      {categories.map((cat) => {
                        const tabKey = cat.slug || cat.code || cat.name;
                        return (
                          <li
                            key={cat.id}
                            id={tabKey}
                            onClick={() => setActiveTab(tabKey)}
                            className={`cursor-pointer ${activeTab === tabKey ? 'active' : ''}`}
                          >
                            <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab(tabKey); }}>
                              <img src="assets/img/categories/category-01.svg" alt={cat.name} />
                            </Link>
                            <h6>
                              <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab(tabKey); }}>
                                {cat.name}
                              </Link>
                            </h6>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Sub Header & Search Bar */}
                  <div className="tab-content-wrap">
                    <div className="d-flex align-items-center justify-content-between flex-wrap mb-2 p-3 bg-white border-bottom">
                      <div className="mb-2">
                        <h5 className="mb-1 fw-bold">Point of Sale</h5>
                        <p className="text-muted fs-12 mb-0">
                          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <div className="input-icon-start search-pos position-relative">
                          <span className="input-icon-addon">
                            <i className="ti ti-search" />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search or Scan Barcode (Enter)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            data-barcode-input="true"
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-dark"
                          onClick={() => {
                            if (!isRegisterOpen) {
                              setShowRegisterModal(true);
                              return;
                            }
                            setShowExchangeModal(true);
                          }}
                        >
                          <i className="ti ti-repeat me-1" />
                          Exchange / Return
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setShowRegisterModal(true)}
                        >
                          <i className="ti ti-cash me-1" />
                          {isRegisterOpen ? 'Register Shift (Open)' : 'Register Shift'}
                        </button>
                      </div>
                    </div>

                    {registerNotice && (
                      <div className="alert alert-success alert-dismissible fade show py-2 px-3 m-3 mb-0 fs-13 d-flex align-items-center justify-content-between">
                        <span>
                          <i className="ti ti-circle-check me-2 fs-16" />
                          {registerNotice}
                        </span>
                        <button type="button" className="btn-close btn-sm" onClick={() => setRegisterNotice('')} aria-label="Close" />
                      </div>
                    )}

                    {registerChecked && !isRegisterOpen && (
                      <div className="alert alert-warning py-2 px-3 m-3 mb-0 fs-13 d-flex align-items-center justify-content-between">
                        <span>
                          <i className="ti ti-lock me-2 fs-16" />
                          <strong>POS Locked:</strong> Open a cash register shift to begin selling.
                        </span>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowRegisterModal(true)}>
                          Enter Opening Cash
                        </button>
                      </div>
                    )}

                    {scanMessage && (
                      <div className="alert alert-info py-2 px-3 m-3 mb-0 fs-13 d-flex align-items-center">
                        <i className="ti ti-barcode me-2 fs-16" />
                        {scanMessage}
                      </div>
                    )}

                    {/* Products Grid */}
                    <div className="pos-products p-3">
                      <div className="row g-3">
                        {productsLoading && (
                          <div className="col-12 text-center py-5">
                            <div className="spinner-border text-primary mb-2" role="status" />
                            <p className="text-muted mt-2">Loading products…</p>
                          </div>
                        )}
                        {!productsLoading && productsError && (
                          <div className="col-12 text-center py-5">
                            <i className="ti ti-wifi-off fs-40 text-danger mb-2 d-block" />
                            <h5 className="text-danger">Could not load products</h5>
                            <p className="text-muted">{productsError}</p>
                            <button className="btn btn-primary" onClick={loadProducts}>
                              <i className="ti ti-refresh me-1" />Retry
                            </button>
                          </div>
                        )}
                        {!productsLoading && !productsError && filteredProducts.map((prod) => {
                          const isCarted = cart.some(c => c.productId === prod.id);
                          const activeVar = selectedVariants[prod.id] || (prod.variants && prod.variants[0]);
                          const displayPrice = activeVar?.price || prod.sellingPrice;
                          const displayStock = activeVar?.stockQty ?? prod.stockQuantity ?? 10;

                          return (
                            <div className="col-sm-6 col-md-6 col-lg-6 col-xl-4 col-xxl-3" key={prod.id}>
                              <div className={`product-info card mb-0 h-100 ${isCarted ? "active" : ""}`} tabIndex={0}>
                                <div
                                  className="pro-img cursor-pointer"
                                  onClick={() => handleAddProductWithVariant(prod)}
                                >
                                  <img
                                    src={resolveMediaUrl(prod.image)}
                                    alt={prod.name}
                                    onError={(e) => { e.currentTarget.src = NO_PRODUCT_IMAGE; }}
                                  />
                                  {isCarted && (
                                    <span>
                                      <i className="ti ti-circle-check-filled" />
                                    </span>
                                  )}
                                </div>

                                <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
                                  <div>
                                    <h6 className="cat-name fs-12 text-muted mb-1">
                                      {prod.categoryName || "Apparel"}
                                    </h6>
                                    <h6 className="product-name fs-14 fw-semibold text-truncate mb-2" title={prod.name}>
                                      {prod.name}
                                    </h6>

                                    {/* Clothing Size and Color Variant Selector Pills */}
                                    {prod.variants && prod.variants.length > 0 && (
                                      <div className="variant-pills d-flex flex-wrap gap-1 mb-2">
                                        {prod.variants.map((v) => {
                                          const isSelected = activeVar?.id === v.id;
                                          return (
                                            <button
                                              key={v.id}
                                              type="button"
                                              className={`badge border text-xs px-2 py-1 ${isSelected ? 'bg-primary text-white border-primary' : 'bg-light text-dark'}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedVariants(prev => ({ ...prev, [prod.id]: v }));
                                              }}
                                            >
                                              {v.size} {v.color ? `· ${v.color}` : ''}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  <div className="d-flex align-items-center justify-content-between price mt-2 pt-2 border-top">
                                    <div>
                                      <p className="text-gray-9 mb-0 fw-bold fs-15">
                                        Rs {Number(displayPrice).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                      </p>
                                      <small className="text-muted" style={{ fontSize: '11px' }}>
                                        Stock: {displayStock} pcs
                                      </small>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-primary rounded-circle p-1 d-flex align-items-center justify-content-center"
                                      style={{ width: "32px", height: "32px" }}
                                      onClick={() => handleAddProductWithVariant(prod)}
                                      title="Add Variant to Cart"
                                    >
                                      <i className="ti ti-plus" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {!productsLoading && !productsError && filteredProducts.length === 0 && (
                          <div className="col-12 text-center py-5">
                            <i className="ti ti-package-off fs-40 text-muted mb-2 d-block" />
                            <h5 className="text-muted">
                              {searchQuery ? `No products found matching "${searchQuery}"` : "No products available"}
                            </h5>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right-Hand Cart & Checkout Sidebar */}
            <div className="col-md-12 col-lg-5 col-xl-4 ps-0 theiaStickySidebar d-lg-flex">
              <aside className="product-order-list bg-secondary-transparent flex-fill">
                <div className="card h-100 mb-0 d-flex flex-column justify-content-between">
                  <div className="card-body p-3">
                    {/* Header */}
                    <div className="order-head d-flex align-items-center justify-content-between w-100 mb-3">
                      <div>
                        <h4 className="fw-bold mb-0">Active Register Cart</h4>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge badge-dark fs-11 fw-semibold">
                          #TXN-{Date.now().toString().slice(-4)}
                        </span>
                        <button
                          type="button"
                          className="btn btn-link link-danger fs-16 p-0 border-0"
                          onClick={clearCart}
                          title="Clear Cart"
                        >
                          <i className="ti ti-trash-x-filled" />
                        </button>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="customer-info block-section mb-3">
                      <h6 className="fs-13 fw-semibold mb-2">Customer Assignment</h6>
                      <div className="d-flex align-items-center gap-2">
                        <div className="flex-grow-1">
                          <Select
                            options={customerOptions}
                            classNamePrefix="react-select select"
                            placeholder="Select Customer"
                            defaultValue={customerOptions[0]}
                            onChange={(opt) => {
                              if (opt) setCustomer({ id: opt.value, name: opt.label });
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-teal btn-icon fs-18 d-flex align-items-center justify-content-center"
                          data-bs-toggle="modal"
                          data-bs-target="#create"
                          title="Add New Customer"
                        >
                          <i className="ti ti-user-plus" />
                        </button>
                      </div>
                    </div>

                    {/* Order Details List */}
                    <div className="product-added block-section">
                      <div className="head-text d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                          <h6 className="me-2 mb-0 fw-bold">Order Details</h6>
                          <div className="badge bg-light text-gray-9 fs-12 fw-semibold py-1 px-2 border rounded">
                            Items : <span className="text-teal">{getItemCount()}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-link clear-icon fs-11 fw-medium text-danger text-decoration-none p-0"
                          onClick={clearCart}
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="product-wrap">
                        {cart.length === 0 ? (
                          <div className="empty-cart text-center py-4 bg-light rounded border border-dashed my-2">
                            <div className="fs-32 text-muted mb-1">
                              <i className="ti ti-shopping-cart" />
                            </div>
                            <p className="fw-semibold text-muted mb-0">No Products Selected</p>
                            <small className="text-muted">Scan barcode or click items to add</small>
                          </div>
                        ) : (
                          <div className="product-list border-0 p-0" style={{ maxHeight: "280px", overflowY: "auto" }}>
                            <div className="table-responsive">
                              <table className="table table-borderless align-middle mb-0">
                                <thead>
                                  <tr>
                                    <th className="fw-bold bg-light fs-12 py-2">Item</th>
                                    <th className="fw-bold bg-light fs-12 py-2 text-center">QTY</th>
                                    <th className="fw-bold bg-light fs-12 py-2 text-end">Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cart.map((item) => (
                                    <tr key={item.cartKey} className="border-bottom">
                                      <td className="py-2">
                                        <div className="d-flex align-items-start">
                                          <button
                                            type="button"
                                            className="btn btn-link text-danger p-0 me-2 delete-icon border-0"
                                            onClick={() => removeItem(item.cartKey)}
                                            title="Remove line"
                                          >
                                            <i className="ti ti-trash-x-filled" />
                                          </button>
                                          <div>
                                            <h6 className="fs-13 fw-semibold mb-0 text-truncate" style={{ maxWidth: "140px" }}>
                                              {item.name}
                                            </h6>
                                            {(item.size || item.color) && (
                                              <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                                                {item.color} {item.size ? `[${item.size}]` : ""}
                                              </small>
                                            )}
                                            <small className="badge bg-light text-muted" style={{ fontSize: "10px" }}>
                                              {item.sku}
                                            </small>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-2">
                                        <div className="qty-item m-0 d-flex align-items-center justify-content-center">
                                          <button
                                            type="button"
                                            className="btn btn-xs btn-light border p-0 px-2 fw-bold"
                                            onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                                          >
                                            -
                                          </button>
                                          <span className="mx-2 fw-bold fs-13">{item.quantity}</span>
                                          <button
                                            type="button"
                                            className="btn btn-xs btn-light border p-0 px-2 fw-bold"
                                            onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                                          >
                                            +
                                          </button>
                                        </div>
                                      </td>
                                      <td className="fs-13 fw-semibold text-gray-9 text-end py-2">
                                        {formatCurrency(item.price * item.quantity - item.discount, businessSettings?.currency, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Payment Summary */}
                      <div className="order-total bg-white p-0 mt-3 pt-2 border-top">
                        <h6 className="fw-bold mb-2">Payment Summary</h6>
                        <table className="table table-borderless table-sm mb-0">
                          <tbody>
                            <tr>
                              <td className="text-muted fs-13 py-1">Sub Total</td>
                              <td className="text-gray-9 fw-semibold text-end py-1">{formatCurrency(getSubtotal(), businessSettings?.currency, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                            </tr>
                            {orderDiscount > 0 && (
                              <tr>
                                <td className="text-danger fs-13 py-1">Discount</td>
                                <td className="text-danger fw-semibold text-end py-1">-{formatCurrency(orderDiscount, businessSettings?.currency, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                              </tr>
                            )}
                            <tr>
                              <td className="text-muted fs-13 py-1">{cartTaxLabel}</td>
                              <td className="text-gray-9 fw-semibold text-end py-1">{formatCurrency(getTotalTax(), businessSettings?.currency, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                            </tr>
                            {shippingFee > 0 && (
                              <tr>
                                <td className="text-muted fs-13 py-1">Shipping</td>
                                <td className="text-gray-9 fw-semibold text-end py-1">{formatCurrency(shippingFee, businessSettings?.currency, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                              </tr>
                            )}
                            <tr className="border-top border-dashed">
                              <td className="fw-bold fs-15 py-2">Total Payable</td>
                              <td className="text-primary fw-bold text-end fs-16 py-2">{formatCurrency(getGrandTotal(), businessSettings?.currency, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Quick Payment Tender Selectors */}
                    <div className="card payment-method bg-light border p-2 mt-3 mb-3">
                      <h6 className="fs-12 fw-bold text-muted mb-2 text-uppercase">Tender Method</h6>
                      <div className="row g-2">
                        <div className="col-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-white border w-100 py-2 d-flex flex-column align-items-center"
                            onClick={handleOpenCheckout}
                            disabled={cart.length === 0}
                          >
                            <img src="assets/img/icons/cash-icon.svg" style={{ width: "20px" }} className="mb-1" alt="Cash" />
                            <span className="fs-11 fw-semibold">Cash</span>
                          </button>
                        </div>
                        <div className="col-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-white border w-100 py-2 d-flex flex-column align-items-center"
                            onClick={handleOpenCheckout}
                            disabled={cart.length === 0}
                          >
                            <img src="assets/img/icons/card.svg" style={{ width: "20px" }} className="mb-1" alt="Card" />
                            <span className="fs-11 fw-semibold">Card</span>
                          </button>
                        </div>
                        <div className="col-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-white border w-100 py-2 d-flex flex-column align-items-center"
                            onClick={handleOpenCheckout}
                            disabled={cart.length === 0}
                          >
                            <img src="assets/img/icons/scan-icon.svg" style={{ width: "20px" }} className="mb-1" alt="Bank" />
                            <span className="fs-11 fw-semibold">Bank</span>
                          </button>
                        </div>
                        <div className="col-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-white border w-100 py-2 d-flex flex-column align-items-center"
                            onClick={handleOpenCheckout}
                            disabled={cart.length === 0}
                          >
                            <img src="assets/img/icons/split-bill.svg" style={{ width: "20px" }} className="mb-1" alt="Split" />
                            <span className="fs-11 fw-semibold">Split</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Place Order Checkout Button */}
                    <button
                      type="button"
                      className="btn btn-primary w-100 py-3 fw-bold fs-16 d-flex align-items-center justify-content-center shadow-sm"
                      onClick={handleOpenCheckout}
                      disabled={cart.length === 0}
                    >
                      <i className="ti ti-shopping-cart me-2 fs-18" />
                      Place Order ({formatCurrency(getGrandTotal(), businessSettings?.currency, { minimumFractionDigits: 0, maximumFractionDigits: 2 })})
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          {/* Bottom POS Quick Actions Bar */}
          <div className="pos-footer bg-white p-3 border-top">
            <div className="d-flex align-items-center justify-content-center flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-orange d-inline-flex align-items-center justify-content-center"
                onClick={() => {
                  if (!isRegisterOpen) {
                    setShowRegisterModal(true);
                    return;
                  }
                  holdCurrentOrder(`Hold Order #${heldOrders.length + 1}`);
                }}
                disabled={!isRegisterOpen || cart.length === 0}
              >
                <i className="ti ti-player-pause me-2" />
                Hold Order
              </button>
              <button
                type="button"
                className="btn btn-info d-inline-flex align-items-center justify-content-center position-relative"
                onClick={() => {
                  if (!isRegisterOpen) {
                    setShowRegisterModal(true);
                    return;
                  }
                  setShowHeldOrdersModal(true);
                }}
                disabled={!isRegisterOpen}
              >
                <i className="ti ti-shopping-bag me-2" />
                View Held Orders
                {heldOrders.length > 0 && (
                  <span className="badge bg-danger ms-2">{heldOrders.length}</span>
                )}
              </button>
              <button
                type="button"
                className="btn btn-cyan d-inline-flex align-items-center justify-content-center"
                onClick={handleOpenCheckout}
                disabled={!isRegisterOpen || cart.length === 0}
              >
                <i className="ti ti-cash-banknote me-2" />
                Checkout
              </button>
              <button
                type="button"
                className="btn btn-indigo d-inline-flex align-items-center justify-content-center"
                onClick={clearCart}
              >
                <i className="ti ti-reload me-2" />
                Reset Cart
              </button>
              <button
                type="button"
                className="btn btn-secondary d-inline-flex align-items-center justify-content-center"
                onClick={() => setShowReceiptModal(true)}
                disabled={!lastCompletedSale}
              >
                <i className="ti ti-printer me-2" />
                Print Last Receipt
              </button>
              <button
                type="button"
                className="btn btn-danger d-inline-flex align-items-center justify-content-center"
                onClick={() => {
                  if (!isRegisterOpen) {
                    setShowRegisterModal(true);
                    return;
                  }
                  setShowExchangeModal(true);
                }}
                disabled={!isRegisterOpen}
              >
                <i className="ti ti-repeat me-2" />
                Clothing Exchange
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Held Orders Custom Modal */}
      {showHeldOrdersModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fs-16 fw-bold">
                  <i className="ti ti-player-pause me-2 text-primary" /> Active Held Orders ({heldOrders.length})
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowHeldOrdersModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {heldOrders.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="ti ti-inbox fs-40 mb-2 d-block" />
                    No orders currently on hold.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead className="bg-light">
                        <tr>
                          <th>Reference</th>
                          <th>Time</th>
                          <th>Customer</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {heldOrders.map((h) => {
                          const orderTotal = h.items.reduce((s, it) => s + (it.price * it.quantity - it.discount), 0);
                          return (
                            <tr key={h.id}>
                              <td className="fw-bold">{h.referenceName}</td>
                              <td>{h.heldAt}</td>
                              <td>{h.customer?.name || "Walk-in Customer"}</td>
                              <td>{h.items.length} items</td>
                              <td className="fw-bold text-primary">Rs {orderTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => {
                                    recallOrder(h.id);
                                    setShowHeldOrdersModal(false);
                                  }}
                                >
                                  Recall & Resume
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => deleteHeldOrder(h.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowHeldOrdersModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Tender Express Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* 58mm / 80mm Printable Thermal Receipt Modal */}
      <ThermalReceiptModal
        saleData={lastCompletedSale}
        onClose={() => setShowReceiptModal(false)}
      />

      {/* Cash Register Shift Reconciliation Modal */}
      <CashRegisterModal
        isOpen={showRegisterModal || (registerChecked && !isRegisterOpen)}
        mandatoryOpen={!isRegisterOpen}
        currency={businessSettings?.currency}
        hasUnpaidCart={cart.length > 0}
        heldOrdersCount={heldOrders.length}
        onClose={() => {
          if (isRegisterOpen) {
            setShowRegisterModal(false);
          }
        }}
        onSessionChanged={(session, notice) => {
          setActiveRegisterSession(session);
          if (notice) {
            setRegisterNotice(notice);
            setTimeout(() => setRegisterNotice(''), 5000);
          }
          if (session) {
            setShowRegisterModal(false);
          }
        }}
        onReturnToDashboard={() => navigate(all_routes.newdashboard || '/index')}
      />

      {/* Clothing Size / Color Exchange Modal */}
      <ClothingExchangeModal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
      />

      {/* Template Existing Native Modals (Tax, Shipping, Discount, Barcode modals) */}
      <PosModals />
    </div>
  );
};

export default Pos;
