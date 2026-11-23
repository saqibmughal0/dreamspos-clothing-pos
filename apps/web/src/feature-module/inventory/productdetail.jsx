import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiClient } from "../../core/apiClient";
import { all_routes } from "../../Router/all_routes";
import { NO_PRODUCT_IMAGE, resolveMediaUrl } from "../../core/utils/mediaUrl";
import { formatCurrency } from "../../core/utils/businessSettings";

const ProductDetail = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");

  const [product, setProduct] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([
      apiClient.get("/settings").catch(() => ({ data: null })),
      productId
        ? apiClient.get(`/products/${encodeURIComponent(productId)}`)
        : apiClient.get("/products", { params: { limit: 1 } }),
    ])
      .then(([settingsRes, prodRes]) => {
        if (!mounted) return;
        if (settingsRes?.data?.success && settingsRes.data.data) {
          setSettings(settingsRes.data.data);
        }
        if (prodRes?.data?.success && prodRes.data.data) {
          const data = prodRes.data.data;
          if (productId) {
            setProduct(data);
          } else if (Array.isArray(data.items) && data.items.length > 0) {
            setProduct(data.items[0]);
          } else {
            setProduct(null);
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err?.response?.data?.message || err?.message || "Failed to load product details.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [productId]);

  const fmt = (val) => formatCurrency(val, settings?.currency);

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-center justify-content-between">
            <div className="page-title">
              <h4>Product Details</h4>
              <h6>Full details of a product</h6>
            </div>
            <div className="page-btn d-flex gap-2">
              {product && (
                <Link
                  to={`${all_routes.editproduct}?id=${product.id}`}
                  className="btn btn-outline-primary"
                >
                  Edit Product
                </Link>
              )}
              <Link to={all_routes.productlist} className="btn btn-primary">
                Back to Products
              </Link>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 text-muted mb-0">Loading product details...</p>
              </div>
            </div>
          ) : !product ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <h5 className="mb-1">No Product Found</h5>
                <p className="text-muted mb-3">Select a product from the Product List to view its full details.</p>
                <Link to={all_routes.productlist} className="btn btn-primary btn-sm">
                  Go to Product List
                </Link>
              </div>
            </div>
          ) : (
            <div className="row">
              <div className="col-lg-8 col-sm-12">
                <div className="card">
                  <div className="card-body">
                    <div className="productdetails">
                      <ul className="product-bar">
                        <li>
                          <h4>Product</h4>
                          <h6>{product.name}</h6>
                        </li>
                        <li>
                          <h4>Category</h4>
                          <h6>{product.categoryName || product.category?.name || "—"}</h6>
                        </li>
                        <li>
                          <h4>Brand</h4>
                          <h6>{product.brandName || product.brand?.name || "—"}</h6>
                        </li>
                        <li>
                          <h4>Unit</h4>
                          <h6>{product.unitName || product.unit?.name || "—"}</h6>
                        </li>
                        <li>
                          <h4>SKU</h4>
                          <h6>{product.sku}</h6>
                        </li>
                        <li>
                          <h4>Barcode</h4>
                          <h6>{product.barcode || "—"}</h6>
                        </li>
                        <li>
                          <h4>Cost Price</h4>
                          <h6>{fmt(product.costPrice)}</h6>
                        </li>
                        <li>
                          <h4>Selling Price</h4>
                          <h6>{fmt(product.sellingPrice)}</h6>
                        </li>
                        <li>
                          <h4>Tax Rate</h4>
                          <h6>{Number(product.taxRate || 0)}%</h6>
                        </li>
                        <li>
                          <h4>Stock Quantity</h4>
                          <h6>{Number(product.stockQuantity ?? 0)}</h6>
                        </li>
                        <li>
                          <h4>Status</h4>
                          <h6>{product.isActive !== false ? "Active" : "Inactive"}</h6>
                        </li>
                        <li>
                          <h4>Description</h4>
                          <h6>{product.description || "—"}</h6>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-sm-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Product Image</h5>
                  </div>
                  <div className="card-body text-center">
                    <img
                      src={resolveMediaUrl(product.image)}
                      alt={product.name}
                      style={{
                        width: "100%",
                        maxHeight: "300px",
                        objectFit: "contain",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                      onError={(e) => {
                        e.currentTarget.src = NO_PRODUCT_IMAGE;
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
