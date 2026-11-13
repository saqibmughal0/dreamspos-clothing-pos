import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Select from "react-select";
import PosModals from '../../core/modals/pos-modal/posModals';
import { usePosStore } from '../../core/posStore';
import { useBarcodeScanner } from '../../core/hooks/useBarcodeScanner';
import { apiClient } from '../../core/apiClient';
import { CheckoutModal } from '../../core/modals/pos-modal/CheckoutModal';
import { ThermalReceiptModal } from '../../core/modals/pos-modal/ThermalReceiptModal';
import { CashRegisterModal } from '../../core/modals/pos-modal/CashRegisterModal';
import { ClothingExchangeModal } from '../../core/modals/pos-modal/ClothingExchangeModal';

// Initial Single-Brand Clothing Retail Catalog (Apparel & Variants)
const INITIAL_APPAREL_CATALOG = [
  {
    id: "prod-tee-01",
    name: "Classic Crewneck Cotton Tee",
    sku: "APP-TSH-01",
    barcode: "890123450010",
    categoryCode: "t-shirts",
    categoryName: "T-Shirts & Tops",
    sellingPrice: 24.99,
    taxRate: 8.5,
    stockQuantity: 190,
    image: "assets/img/products/pos-product-01.png",
    variants: [
      { id: "var-tsh-blk-s", size: "S", color: "Jet Black", sku: "APP-TSH-BLK-S", barcode: "890123450101", price: 24.99, stockQty: 25 },
      { id: "var-tsh-blk-m", size: "M", color: "Jet Black", sku: "APP-TSH-BLK-M", barcode: "890123450102", price: 24.99, stockQty: 40 },
      { id: "var-tsh-blk-l", size: "L", color: "Jet Black", sku: "APP-TSH-BLK-L", barcode: "890123450103", price: 24.99, stockQty: 30 },
      { id: "var-tsh-wht-m", size: "M", color: "Pure White", sku: "APP-TSH-WHT-M", barcode: "890123450104", price: 24.99, stockQty: 35 },
      { id: "var-tsh-wht-l", size: "L", color: "Pure White", sku: "APP-TSH-WHT-L", barcode: "890123450105", price: 24.99, stockQty: 20 },
      { id: "var-tsh-nvy-m", size: "M", color: "Navy Blue", sku: "APP-TSH-NVY-M", barcode: "890123450106", price: 24.99, stockQty: 30 }
    ]
  },
  {
    id: "prod-sht-01",
    name: "Oxford Button-Down Long Sleeve Shirt",
    sku: "APP-SHT-01",
    barcode: "890123450020",
    categoryCode: "shirts",
    categoryName: "Shirts",
    sellingPrice: 49.99,
    taxRate: 8.5,
    stockQuantity: 78,
    image: "assets/img/products/pos-product-02.png",
    variants: [
      { id: "var-sht-blu-m", size: "M", color: "Sky Blue", sku: "APP-SHT-BLU-M", barcode: "890123450201", price: 49.99, stockQty: 20 },
      { id: "var-sht-blu-l", size: "L", color: "Sky Blue", sku: "APP-SHT-BLU-L", barcode: "890123450202", price: 49.99, stockQty: 18 },
      { id: "var-sht-wht-m", size: "M", color: "Crisp White", sku: "APP-SHT-WHT-M", barcode: "890123450203", price: 49.99, stockQty: 25 },
      { id: "var-sht-wht-l", size: "L", color: "Crisp White", sku: "APP-SHT-WHT-L", barcode: "890123450204", price: 49.99, stockQty: 15 }
    ]
  },
  {
    id: "prod-jns-01",
    name: "Slim Fit Stretch Denim Jeans",
    sku: "APP-JNS-01",
    barcode: "890123450030",
    categoryCode: "jeans",
    categoryName: "Jeans & Trousers",
    sellingPrice: 69.99,
    taxRate: 8.5,
    stockQuantity: 99,
    image: "assets/img/products/pos-product-03.png",
    variants: [
      { id: "var-jns-ind-30", size: "30", color: "Dark Indigo", sku: "APP-JNS-IND-30", barcode: "890123450301", price: 69.99, stockQty: 15 },
      { id: "var-jns-ind-32", size: "32", color: "Dark Indigo", sku: "APP-JNS-IND-32", barcode: "890123450302", price: 69.99, stockQty: 28 },
      { id: "var-jns-ind-34", size: "34", color: "Dark Indigo", sku: "APP-JNS-IND-34", barcode: "890123450303", price: 69.99, stockQty: 20 },
      { id: "var-jns-blk-32", size: "32", color: "Washed Black", sku: "APP-JNS-BLK-32", barcode: "890123450304", price: 69.99, stockQty: 22 },
      { id: "var-jns-blk-34", size: "34", color: "Washed Black", sku: "APP-JNS-BLK-34", barcode: "890123450305", price: 69.99, stockQty: 14 }
    ]
  },
  {
    id: "prod-hod-01",
    name: "Heavyweight Fleece Pullover Hoodie",
    sku: "APP-HOD-01",
    barcode: "890123450040",
    categoryCode: "hoodies",
    categoryName: "Hoodies & Jackets",
    sellingPrice: 59.99,
    taxRate: 8.5,
    stockQuantity: 112,
    image: "assets/img/products/pos-product-04.png",
    variants: [
      { id: "var-hod-gry-s", size: "S", color: "Heather Grey", sku: "APP-HOD-GRY-S", barcode: "890123450401", price: 59.99, stockQty: 15 },
      { id: "var-hod-gry-m", size: "M", color: "Heather Grey", sku: "APP-HOD-GRY-M", barcode: "890123450402", price: 59.99, stockQty: 25 },
      { id: "var-hod-gry-l", size: "L", color: "Heather Grey", sku: "APP-HOD-GRY-L", barcode: "890123450403", price: 59.99, stockQty: 20 },
      { id: "var-hod-blk-m", size: "M", color: "Onyx Black", sku: "APP-HOD-BLK-M", barcode: "890123450404", price: 59.99, stockQty: 30 },
      { id: "var-hod-blk-l", size: "L", color: "Onyx Black", sku: "APP-HOD-BLK-L", barcode: "890123450405", price: 59.99, stockQty: 22 }
    ]
  },
  {
    id: "prod-sho-01",
    name: "Chino Casual Everyday Shorts",
    sku: "APP-SHO-01",
    barcode: "890123450050",
    categoryCode: "shorts",
    categoryName: "Shorts",
    sellingPrice: 34.99,
    taxRate: 8.5,
    stockQuantity: 65,
    image: "assets/img/products/pos-product-05.png",
    variants: [
      { id: "var-sho-khk-30", size: "30", color: "Khaki Tan", sku: "APP-SHO-KHK-30", barcode: "890123450501", price: 34.99, stockQty: 15 },
      { id: "var-sho-khk-32", size: "32", color: "Khaki Tan", sku: "APP-SHO-KHK-32", barcode: "890123450502", price: 34.99, stockQty: 20 },
      { id: "var-sho-khk-34", size: "34", color: "Khaki Tan", sku: "APP-SHO-KHK-34", barcode: "890123450503", price: 34.99, stockQty: 15 },
      { id: "var-sho-olv-32", size: "32", color: "Olive Green", sku: "APP-SHO-OLV-32", barcode: "890123450504", price: 34.99, stockQty: 15 }
    ]
  },
  {
    id: "prod-trs-01",
    name: "Tailored Slim Fit Chino Trousers",
    sku: "APP-TRS-01",
    barcode: "890123450060",
    categoryCode: "trousers",
    categoryName: "Jeans & Trousers",
    sellingPrice: 54.99,
    taxRate: 8.5,
    stockQuantity: 70,
    image: "assets/img/products/pos-product-06.png",
    variants: [
      { id: "var-trs-khk-30", size: "30", color: "British Khaki", sku: "APP-TRS-KHK-30", barcode: "890123450601", price: 54.99, stockQty: 18 },
      { id: "var-trs-khk-32", size: "32", color: "British Khaki", sku: "APP-TRS-KHK-32", barcode: "890123450602", price: 54.99, stockQty: 22 },
      { id: "var-trs-chr-32", size: "32", color: "Charcoal Grey", sku: "APP-TRS-CHR-32", barcode: "890123450603", price: 54.99, stockQty: 16 },
      { id: "var-trs-chr-34", size: "34", color: "Charcoal Grey", sku: "APP-TRS-CHR-34", barcode: "890123450604", price: 54.99, stockQty: 14 }
    ]
  }
];

const customerOptions = [
  { value: "cust-walkin", label: "Walk-in Customer" },
  { value: "cust-james", label: "James Anderson (VIP)" },
  { value: "cust-sarah", label: "Sarah Connor (Member)" },
  { value: "cust-michael", label: "Michael Scott" },
  { value: "cust-emma", label: "Emma Watson" }
];

const Pos = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState(INITIAL_APPAREL_CATALOG);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [scanMessage, setScanMessage] = useState('');

  // Modals state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);

  const Location = useLocation();

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
  useEffect(() => {
    let isMounted = true;
    apiClient.get('/products')
      .then((res) => {
        if (isMounted && res.data?.success && res.data.data?.items?.length > 0) {
          setProducts(res.data.data.items);
        }
      })
      .catch((err) => {
        console.warn("Using offline apparel catalog:", err.message);
      });

    return () => {
      isMounted = false;
    };
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
      try {
        const res = await apiClient.get(`/products/barcode/${encodeURIComponent(searchQuery.trim())}`);
        if (res.data?.success && res.data.data) {
          const item = res.data.data;
          addItem({
            id: item.id,
            variantId: item.variantId || null,
            name: item.name,
            size: item.size || null,
            color: item.color || null,
            sku: item.sku,
            sellingPrice: item.sellingPrice,
            taxRate: item.taxRate,
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
        taxRate: prod.taxRate || 8.5,
        image: prod.image,
        stockQty: selectedVariant.stockQty
      });
    } else {
      addItem({
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        sellingPrice: prod.sellingPrice,
        taxRate: prod.taxRate || 8.5,
        image: prod.image,
        stockQty: prod.stockQuantity
      });
    }
  };

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = () => {
    setShowCheckoutModal(false);
    setShowReceiptModal(true);
  };

  return (
    <div className='main-wrapper pos-five'>
      <div className="page-wrapper pos-pg-wrapper ms-0">
        <div className="content pos-design p-0">
          <div className="row pos-wrapper">
            {/* Products Main Column */}
            <div className="col-md-12 col-lg-7 col-xl-8 d-flex">
              <div className="pos-categories tabs_wrapper p-0 flex-fill">
                <div className="content-wrap">
                  {/* Category Tabs */}
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
                      <li
                        id="t-shirts"
                        onClick={() => setActiveTab('t-shirts')}
                        className={`cursor-pointer ${activeTab === 't-shirts' ? 'active' : ''}`}
                      >
                        <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('t-shirts'); }}>
                          <img src="assets/img/categories/category-02.svg" alt="Tees" />
                        </Link>
                        <h6><Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('t-shirts'); }}>T-Shirts & Tops</Link></h6>
                      </li>
                      <li
                        id="shirts"
                        onClick={() => setActiveTab('shirts')}
                        className={`cursor-pointer ${activeTab === 'shirts' ? 'active' : ''}`}
                      >
                        <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('shirts'); }}>
                          <img src="assets/img/categories/category-03.svg" alt="Shirts" />
                        </Link>
                        <h6><Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('shirts'); }}>Shirts</Link></h6>
                      </li>
                      <li
                        id="jeans"
                        onClick={() => setActiveTab('jeans')}
                        className={`cursor-pointer ${activeTab === 'jeans' ? 'active' : ''}`}
                      >
                        <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('jeans'); }}>
                          <img src="assets/img/categories/category-04.svg" alt="Jeans" />
                        </Link>
                        <h6><Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('jeans'); }}>Jeans & Denim</Link></h6>
                      </li>
                      <li
                        id="hoodies"
                        onClick={() => setActiveTab('hoodies')}
                        className={`cursor-pointer ${activeTab === 'hoodies' ? 'active' : ''}`}
                      >
                        <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('hoodies'); }}>
                          <img src="assets/img/categories/category-05.svg" alt="Hoodies" />
                        </Link>
                        <h6><Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('hoodies'); }}>Hoodies & Outerwear</Link></h6>
                      </li>
                      <li
                        id="shorts"
                        onClick={() => setActiveTab('shorts')}
                        className={`cursor-pointer ${activeTab === 'shorts' ? 'active' : ''}`}
                      >
                        <Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('shorts'); }}>
                          <img src="assets/img/categories/category-06.svg" alt="Shorts" />
                        </Link>
                        <h6><Link to="#" onClick={(e) => { e.preventDefault(); setActiveTab('shorts'); }}>Shorts & Active</Link></h6>
                      </li>
                    </ul>
                  </div>

                  {/* Sub Header & Search Bar */}
                  <div className="tab-content-wrap">
                    <div className="d-flex align-items-center justify-content-between flex-wrap mb-2 p-3 bg-white border-bottom">
                      <div className="mb-2">
                        <h5 className="mb-1 fw-bold">Dreams Apparel POS</h5>
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
                          onClick={() => setShowExchangeModal(true)}
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
                          Register Shift
                        </button>
                      </div>
                    </div>

                    {scanMessage && (
                      <div className="alert alert-info py-2 px-3 m-3 mb-0 fs-13 d-flex align-items-center">
                        <i className="ti ti-barcode me-2 fs-16" />
                        {scanMessage}
                      </div>
                    )}

                    {/* Products Grid */}
                    <div className="pos-products p-3">
                      <div className="row g-3">
                        {filteredProducts.map((prod) => {
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
                                    src={prod.image || "assets/img/products/pos-product-01.png"}
                                    alt={prod.name}
                                    onError={(e) => { e.currentTarget.src = "assets/img/products/pos-product-01.svg"; }}
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

                        {filteredProducts.length === 0 && (
                          <div className="col-12 text-center py-5">
                            <i className="ti ti-package-off fs-40 text-muted mb-2 d-block" />
                            <h5 className="text-muted">No products found matching "{searchQuery}"</h5>
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
                                        Rs {(item.price * item.quantity - item.discount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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
                              <td className="text-gray-9 fw-semibold text-end py-1">Rs {getSubtotal().toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                            </tr>
                            {orderDiscount > 0 && (
                              <tr>
                                <td className="text-danger fs-13 py-1">Discount</td>
                                <td className="text-danger fw-semibold text-end py-1">-Rs {orderDiscount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                              </tr>
                            )}
                            <tr>
                              <td className="text-muted fs-13 py-1">Sales Tax (Est.)</td>
                              <td className="text-gray-9 fw-semibold text-end py-1">Rs {getTotalTax().toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                            </tr>
                            {shippingFee > 0 && (
                              <tr>
                                <td className="text-muted fs-13 py-1">Shipping</td>
                                <td className="text-gray-9 fw-semibold text-end py-1">Rs {shippingFee.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                              </tr>
                            )}
                            <tr className="border-top border-dashed">
                              <td className="fw-bold fs-15 py-2">Total Payable</td>
                              <td className="text-primary fw-bold text-end fs-16 py-2">Rs {getGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
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
                      Place Order (Rs {getGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })})
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
                onClick={() => holdCurrentOrder(`Hold Order #${heldOrders.length + 1}`)}
                disabled={cart.length === 0}
              >
                <i className="ti ti-player-pause me-2" />
                Hold Order
              </button>
              <button
                type="button"
                className="btn btn-info d-inline-flex align-items-center justify-content-center position-relative"
                onClick={() => setShowHeldOrdersModal(true)}
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
                disabled={cart.length === 0}
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
                onClick={() => setShowExchangeModal(true)}
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
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
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
