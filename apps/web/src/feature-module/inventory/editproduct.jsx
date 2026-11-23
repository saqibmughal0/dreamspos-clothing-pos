import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { all_routes } from "../../Router/all_routes";
import { ArrowLeft, PlusCircle, Trash2 } from "feather-icons-react/build/IconComponents";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { apiClient } from "../../core/apiClient";
import { NO_PRODUCT_IMAGE, resolveMediaUrl } from "../../core/utils/mediaUrl";

const EditProduct = () => {
  const route = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    articleCode: "",
    barcode: "",
    categoryId: "",
    brandId: "",
    unitId: "",
    season: "All-Season",
    fabric: "",
    gender: "Unisex",
    costPrice: "0",
    sellingPrice: "0",
    taxRate: "0",
    alertQuantity: "5",
    description: "",
    image: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProvider, setUploadProvider] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const [variants, setVariants] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadData = async () => {
    if (!productId) {
      setError("No product ID specified. Please select a product from Product List.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes, brandRes, unitRes] = await Promise.all([
        apiClient.get(`/products/${productId}`),
        apiClient.get("/catalog/categories"),
        apiClient.get("/catalog/brands"),
        apiClient.get("/catalog/units"),
      ]);
      setCategories(catRes.data?.data?.items || []);
      setBrands(brandRes.data?.data?.items || []);
      setUnits(unitRes.data?.data?.items || []);

      const p = prodRes.data?.data;
      if (!p) {
        setError("Product not found.");
      } else {
        setForm({
          name: p.name || "",
          sku: p.sku || "",
          articleCode: p.articleCode || "",
          barcode: p.barcode || "",
          categoryId: p.categoryId || "",
          brandId: p.brandId || "",
          unitId: p.unitId || "",
          season: p.season || "All-Season",
          fabric: p.fabric || "",
          gender: p.gender || "Unisex",
          costPrice: String(p.costPrice ?? 0),
          sellingPrice: String(p.sellingPrice ?? 0),
          taxRate: String(p.taxRate ?? 0),
          alertQuantity: String(p.alertQuantity ?? 5),
          description: p.description || "",
          image: p.image || "",
        });
        setVariants(
          (p.variants || []).map((v) => ({
            id: v.id,
            size: v.size || "",
            color: v.color || "",
            sku: v.sku || "",
            barcode: v.barcode || "",
            costPrice: String(v.costPrice ?? p.costPrice ?? 0),
            priceDiff: String(v.priceDiff ?? 0),
            stockQty: String(v.stockQty ?? 0),
          }))
        );
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      { size: "", color: "", sku: "", barcode: "", costPrice: form.costPrice || "0", priceDiff: "0", stockQty: "0" }
    ]);
  };

  const removeVariantRow = (idx) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateVariant = (idx, field, val) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v)));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type.toLowerCase())) {
      setUploadError("Unsupported file format. Please select a JPG, JPEG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size exceeds the 5MB limit.");
      e.target.value = "";
      return;
    }

    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    const instantUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(instantUrl);
    setUploadError(null);
    setUploadProvider(null);
    setUploadProgress(0);
    setUploadingImage(true);

    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await apiClient.post("/products/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
          }
        },
      });
      if (res.data?.success && res.data.data?.url) {
        const uploadedUrl = res.data.data.url;
        const provider = res.data.data.provider || (uploadedUrl.startsWith("https://") ? "cloudinary" : "local");
        setForm((prev) => ({ ...prev, image: uploadedUrl }));
        setUploadProvider(provider);
        setUploadProgress(100);
      } else {
        setUploadError("Image upload failed. Please try again.");
      }
    } catch (err) {
      setUploadError(err?.response?.data?.message || err?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const removeImage = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    setUploadProvider(null);
    setUploadProgress(0);
    setUploadError(null);
    setForm((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId) return;
    setSubmitError(null);

    if (!form.name.trim() || !form.sku.trim() || !form.categoryId || !form.unitId) {
      setSubmitError("Product Name, SKU, Category, and Unit are required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      articleCode: form.articleCode.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      categoryId: form.categoryId,
      brandId: form.brandId || null,
      unitId: form.unitId,
      season: form.season || undefined,
      fabric: form.fabric.trim() || undefined,
      gender: form.gender || undefined,
      costPrice: Number(form.costPrice || 0),
      sellingPrice: Number(form.sellingPrice || 0),
      taxRate: Number(form.taxRate || 0),
      alertQuantity: parseInt(form.alertQuantity || "5", 10),
      description: form.description.trim() || undefined,
      image: form.image.trim() || null,
      variants: variants.map((v, idx) => ({
        ...(v.id ? { id: v.id } : {}),
        size: v.size.trim() || "Standard",
        color: v.color.trim() || "Standard",
        sku: v.sku.trim() || `${form.sku.trim()}-${idx + 1}`,
        barcode: v.barcode.trim() || v.sku.trim() || `${form.sku.trim()}-${idx + 1}`,
        costPrice: Number(v.costPrice || form.costPrice || 0),
        priceDiff: Number(v.priceDiff || 0),
        stockQty: Number(v.stockQty || 0),
      })),
    };

    setSubmitting(true);
    try {
      await apiClient.put(`/products/${productId}`, payload);
      navigate(route.productlist);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Edit Product</h4>
              <h6>Update clothing product details and variants</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <RefreshIcon onClick={loadData} />
            <CollapesIcon />
            <li>
              <div className="page-btn">
                <Link to={route.productlist} className="btn btn-secondary">
                  <ArrowLeft className="me-2" />
                  Back to Products
                </Link>
              </div>
            </li>
          </ul>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Loading product...</p>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <Link to={route.productlist} className="btn btn-sm btn-secondary">Back to Product List</Link>
          </div>
        )}

        {!loading && !error && (
          <form onSubmit={handleSubmit}>
            {submitError && <div className="alert alert-danger">{submitError}</div>}

            <div className="card mb-4">
              <div className="card-header"><h5 className="card-title mb-0">Product Information</h5></div>
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-4 col-sm-6 mb-3">
                    <label className="form-label">Product Name<span className="text-danger ms-1">*</span></label>
                    <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-lg-4 col-sm-6 mb-3">
                    <label className="form-label">SKU<span className="text-danger ms-1">*</span></label>
                    <input type="text" className="form-control" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                  </div>
                  <div className="col-lg-4 col-sm-6 mb-3">
                    <label className="form-label">Barcode</label>
                    <input type="text" className="form-control" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                  </div>
                  <div className="col-lg-4 col-sm-6 mb-3">
                    <label className="form-label">Category<span className="text-danger ms-1">*</span></label>
                    <select className="form-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                      <option value="">Choose Category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-lg-4 col-sm-6 mb-3">
                    <label className="form-label">Brand</label>
                    <select className="form-select" value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
                      <option value="">None</option>
                      {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="col-lg-4 col-sm-6 mb-3">
                    <label className="form-label">Unit<span className="text-danger ms-1">*</span></label>
                    <select className="form-select" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} required>
                      <option value="">Choose Unit</option>
                      {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>)}
                    </select>
                  </div>
                  <div className="col-lg-3 col-sm-6 mb-3">
                    <label className="form-label">Cost Price (Rs)</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
                  </div>
                  <div className="col-lg-3 col-sm-6 mb-3">
                    <label className="form-label">Selling Price (Rs)</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
                  </div>
                  <div className="col-lg-3 col-sm-6 mb-3">
                    <label className="form-label">Tax Rate (%)</label>
                    <input type="number" min="0" max="100" step="0.01" className="form-control" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
                  </div>
                  <div className="col-lg-3 col-sm-6 mb-3">
                    <label className="form-label">Low Stock Alert Qty</label>
                    <input type="number" min="0" className="form-control" value={form.alertQuantity} onChange={(e) => setForm({ ...form, alertQuantity: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">Product Image</h5>
              </div>
              <div className="card-body">
                {uploadError && <div className="alert alert-danger py-2">{uploadError}</div>}
                <input
                  type="file"
                  id="editProductImageInput"
                  accept="image/jpeg,image/png,image/webp"
                  className="d-none"
                  onChange={handleImageUpload}
                />
                {localPreviewUrl || form.image ? (
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <img
                      src={localPreviewUrl || resolveMediaUrl(form.image)}
                      alt="Product preview"
                      style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      onError={(e) => {
                        e.currentTarget.src = NO_PRODUCT_IMAGE;
                      }}
                    />
                    <div>
                      <div className="d-flex gap-2 mb-1">
                        <label
                          htmlFor="editProductImageInput"
                          className="btn btn-sm btn-outline-primary mb-0"
                          style={{ cursor: "pointer" }}
                        >
                          {uploadingImage ? `Uploading (${uploadProgress}%)...` : "Replace Image"}
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={removeImage}
                          disabled={uploadingImage}
                        >
                          <Trash2 className="me-1" size={14} /> Remove Image
                        </button>
                      </div>
                      {uploadingImage && (
                        <div className="progress mt-1" style={{ height: "6px", maxWidth: "240px" }}>
                          <div className="progress-bar" role="progressbar" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                      {!uploadingImage && form.image && !uploadError && (
                        <p className="text-success fs-12 mt-1 mb-0">
                          {uploadProvider === "cloudinary" || form.image.startsWith("https://")
                            ? "Stored on Cloudinary."
                            : "Stored in local development uploads."}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="editProductImageInput"
                      className="btn btn-outline-primary"
                      style={{ cursor: "pointer" }}
                    >
                      {uploadingImage ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Uploading ({uploadProgress}%)...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="me-2" size={16} />
                          Upload Product Photo
                        </>
                      )}
                    </label>
                    <p className="text-muted fs-12 mt-2 mb-0">Accepted: JPG, JPEG, PNG, WebP (max 5MB).</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Variants</h5>
                <button type="button" className="btn btn-sm btn-primary" onClick={addVariantRow}>
                  <PlusCircle className="me-1" size={14} /> Add Variant
                </button>
              </div>
              <div className="card-body">
                {variants.length === 0 ? (
                  <p className="text-muted mb-0">No variants added.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Size</th>
                          <th>Color</th>
                          <th>SKU</th>
                          <th>Barcode</th>
                          <th>Price Diff (Rs)</th>
                          <th>Stock</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, idx) => (
                          <tr key={v.id || idx}>
                            <td><input type="text" className="form-control form-control-sm" value={v.size} onChange={(e) => updateVariant(idx, "size", e.target.value)} /></td>
                            <td><input type="text" className="form-control form-control-sm" value={v.color} onChange={(e) => updateVariant(idx, "color", e.target.value)} /></td>
                            <td><input type="text" className="form-control form-control-sm" value={v.sku} onChange={(e) => updateVariant(idx, "sku", e.target.value)} /></td>
                            <td><input type="text" className="form-control form-control-sm" value={v.barcode} onChange={(e) => updateVariant(idx, "barcode", e.target.value)} /></td>
                            <td><input type="number" step="0.01" className="form-control form-control-sm" value={v.priceDiff} onChange={(e) => updateVariant(idx, "priceDiff", e.target.value)} /></td>
                            <td><input type="number" min="0" className="form-control form-control-sm" value={v.stockQty} onChange={(e) => updateVariant(idx, "stockQty", e.target.value)} /></td>
                            <td>
                              {!v.id && (
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeVariantRow(idx)}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mb-4">
              <Link to={route.productlist} className="btn btn-secondary">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Updating..." : "Update Product"}
              </button>
            </div>
          </form>
        )}
      </div>
      <CommonFooter />
    </div>
  );
};

export default EditProduct;
