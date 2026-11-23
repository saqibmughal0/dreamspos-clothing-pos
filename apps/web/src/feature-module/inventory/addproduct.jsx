import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../Router/all_routes";
import { ArrowLeft, PlusCircle, Trash2 } from "feather-icons-react/build/IconComponents";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { apiClient } from "../../core/apiClient";
import { NO_PRODUCT_IMAGE, resolveMediaUrl } from "../../core/utils/mediaUrl";

const AddProduct = () => {
  const route = all_routes;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState(null);

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
    costPrice: "",
    sellingPrice: "",
    taxRate: "0",
    taxType: "EXCLUSIVE",
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

  const [hasVariants, setHasVariants] = useState(true);
  const [variants, setVariants] = useState([
    { size: "M", color: "Black", sku: "", barcode: "", costPrice: "", priceDiff: "0", stockQty: "0" }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadLookups = async () => {
    setLoadingLookups(true);
    setLookupError(null);
    try {
      const [catRes, brandRes, unitRes] = await Promise.all([
        apiClient.get("/catalog/categories"),
        apiClient.get("/catalog/brands"),
        apiClient.get("/catalog/units"),
      ]);
      const cats = catRes.data?.data?.items || [];
      const brs = brandRes.data?.data?.items || [];
      const uns = unitRes.data?.data?.items || [];
      setCategories(cats);
      setBrands(brs);
      setUnits(uns);
      setForm((prev) => ({
        ...prev,
        categoryId: prev.categoryId || cats[0]?.id || "",
        unitId: prev.unitId || uns[0]?.id || "",
      }));
    } catch (err) {
      setLookupError(err?.response?.data?.message || err?.message || "Failed to load categories, brands, or units.");
    } finally {
      setLoadingLookups(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  const generateCode = () => {
    const rand = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setForm((prev) => ({ ...prev, barcode: rand }));
  };

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
    setSubmitError(null);

    if (!form.name.trim() || !form.sku.trim() || !form.categoryId || !form.unitId) {
      setSubmitError("Product Name, SKU, Category, and Unit are required.");
      return;
    }

    const costPrice = Number(form.costPrice || 0);
    const sellingPrice = Number(form.sellingPrice || 0);
    if (costPrice < 0 || sellingPrice < 0) {
      setSubmitError("Cost price and selling price cannot be negative.");
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
      costPrice,
      sellingPrice,
      taxRate: Number(form.taxRate || 0),
      taxType: form.taxType,
      alertQuantity: parseInt(form.alertQuantity || "5", 10),
      description: form.description.trim() || undefined,
      image: form.image.trim() || undefined,
    };

    if (hasVariants && variants.length > 0) {
      payload.variants = variants.map((v, idx) => {
        const sizePart = (v.size || "STD").trim().toUpperCase();
        const colorPart = (v.color || "DEF").trim().toUpperCase().slice(0, 3);
        const autoSku = `${form.sku.trim()}-${sizePart}-${colorPart}-${idx + 1}`;
        return {
          size: v.size.trim() || "Standard",
          color: v.color.trim() || "Standard",
          sku: v.sku.trim() || autoSku,
          barcode: v.barcode.trim() || v.sku.trim() || autoSku,
          costPrice: v.costPrice !== "" ? Number(v.costPrice) : costPrice,
          priceDiff: Number(v.priceDiff || 0),
          stockQty: Number(v.stockQty || 0),
        };
      });
    }

    setSubmitting(true);
    try {
      await apiClient.post("/products", payload);
      navigate(route.productlist);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.message || "Failed to create product.");
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
              <h4>Create Product</h4>
              <h6>Add a new clothing product to your inventory</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <RefreshIcon onClick={loadLookups} />
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

        {lookupError && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <span>{lookupError}</span>
            <button type="button" className="btn btn-sm btn-danger" onClick={loadLookups}>Retry</button>
          </div>
        )}

        {!loadingLookups && (categories.length === 0 || units.length === 0) && (
          <div className="alert alert-warning">
            <strong>Setup Required:</strong>{" "}
            {categories.length === 0 && (
              <span>No categories found (<Link to={route.categorylist}>Add Category</Link>). </span>
            )}
            {units.length === 0 && (
              <span>No units found (<Link to={route.units}>Add Unit</Link>).</span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {submitError && <div className="alert alert-danger">{submitError}</div>}

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Product Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-lg-4 col-sm-6 mb-3">
                  <label className="form-label">Product Name<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Men's Cotton Kurta"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-lg-4 col-sm-6 mb-3">
                  <label className="form-label">SKU<span className="text-danger ms-1">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., KRT-001"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="col-lg-4 col-sm-6 mb-3">
                  <label className="form-label">Article Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., ART-2026-01"
                    value={form.articleCode}
                    onChange={(e) => setForm({ ...form, articleCode: e.target.value })}
                  />
                </div>

                <div className="col-lg-4 col-sm-6 mb-3">
                  <label className="form-label">Category<span className="text-danger ms-1">*</span></label>
                  <select
                    className="form-select"
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Choose Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-lg-4 col-sm-6 mb-3">
                  <label className="form-label">Brand</label>
                  <select
                    className="form-select"
                    value={form.brandId}
                    onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                  >
                    <option value="">None / Unbranded</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-lg-4 col-sm-6 mb-3">
                  <label className="form-label">Unit<span className="text-danger ms-1">*</span></label>
                  <select
                    className="form-select"
                    value={form.unitId}
                    onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                    required
                  >
                    <option value="">Choose Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                    ))}
                  </select>
                </div>

                <div className="col-lg-4 col-sm-6 mb-3">
                  <label className="form-label">Barcode</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Scan or generate barcode"
                      value={form.barcode}
                      onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    />
                    <button type="button" className="btn btn-outline-primary" onClick={generateCode}>
                      Generate
                    </button>
                  </div>
                </div>

                <div className="col-lg-4 col-sm-6 mb-3">
                  <label className="form-label">Season</label>
                  <select className="form-select" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                    <option value="All-Season">All-Season</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                    <option value="Festive">Festive / Eid</option>
                  </select>
                </div>

                <div className="col-lg-4 col-sm-6 mb-3">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>

                <div className="col-lg-4 col-sm-6 mb-3">
                  <label className="form-label">Fabric / Material</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Wash & Wear, Cotton, Lawn"
                    value={form.fabric}
                    onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                  />
                </div>

                <div className="col-lg-8 mb-3">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Optional garment notes"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Pricing &amp; Alerts (PKR)</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-lg-3 col-sm-6 mb-3">
                  <label className="form-label">Cost Price (Rs)<span className="text-danger ms-1">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="col-lg-3 col-sm-6 mb-3">
                  <label className="form-label">Selling Price (Rs)<span className="text-danger ms-1">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="col-lg-3 col-sm-6 mb-3">
                  <label className="form-label">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="form-control"
                    value={form.taxRate}
                    onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                  />
                </div>
                <div className="col-lg-3 col-sm-6 mb-3">
                  <label className="form-label">Low Stock Alert Qty</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={form.alertQuantity}
                    onChange={(e) => setForm({ ...form, alertQuantity: e.target.value })}
                  />
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
                id="productImageInput"
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
                        htmlFor="productImageInput"
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
                          ? "Image uploaded to Cloudinary storage."
                          : "Image uploaded to local development storage."}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="productImageInput"
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
                  <p className="text-muted fs-12 mt-2 mb-0">
                    Supports JPG, JPEG, PNG, and WebP up to 5MB.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="hasVariantsSwitch"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                />
                <label className="form-check-label fw-bold" htmlFor="hasVariantsSwitch">
                  Clothing Size &amp; Color Variants
                </label>
              </div>
              {hasVariants && (
                <button type="button" className="btn btn-sm btn-primary" onClick={addVariantRow}>
                  <PlusCircle className="me-1" size={14} /> Add Variant
                </button>
              )}
            </div>
            {hasVariants && (
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Size</th>
                        <th>Color</th>
                        <th>Variant SKU (optional)</th>
                        <th>Barcode (optional)</th>
                        <th>Price Diff (Rs)</th>
                        <th>Opening Stock</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="S, M, L, XL, 32"
                              value={v.size}
                              onChange={(e) => updateVariant(idx, "size", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Black, White, Navy"
                              value={v.color}
                              onChange={(e) => updateVariant(idx, "color", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Auto if blank"
                              value={v.sku}
                              onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Auto if blank"
                              value={v.barcode}
                              onChange={(e) => updateVariant(idx, "barcode", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control form-control-sm"
                              value={v.priceDiff}
                              onChange={(e) => updateVariant(idx, "priceDiff", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="form-control form-control-sm"
                              value={v.stockQty}
                              onChange={(e) => updateVariant(idx, "stockQty", e.target.value)}
                            />
                          </td>
                          <td>
                            {variants.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeVariantRow(idx)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2 mb-4">
            <Link to={route.productlist} className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving Product..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
      <CommonFooter />
    </div>
  );
};

export default AddProduct;
