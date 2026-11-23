import {
  ChevronUp,
  Edit,
  Eye,
  RotateCcw,
  Trash2,
} from "feather-icons-react/build/IconComponents";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import Brand from "../../core/modals/inventory/brand";
import { all_routes } from "../../Router/all_routes";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import Table from "../../core/pagination/datatable";
import { setToogleHeader } from "../../core/redux/action";
import { Download } from "react-feather";
import { apiClient } from "../../core/apiClient";

const ProductList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const dispatch = useDispatch();
  const data = useSelector((state) => state.rootReducer.toggle_header);

  const categories = Array.from(new Set(dataSource.map((d) => d.category).filter((c) => c && c !== "—")));
  const brands = Array.from(new Set(dataSource.map((d) => d.brand).filter((b) => b && b !== "—")));
  const filteredData = dataSource.filter((item) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q || item.product.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesBrand = selectedBrand === "ALL" || item.brand === selectedBrand;
    return matchesSearch && matchesCat && matchesBrand;
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiClient.get("/products")
      .then((res) => {
        if (res.data?.success && res.data.data?.items) {
          const mapped = res.data.data.items.map((p, idx) => ({
            id: p.id,
            key: p.id || idx,
            sku: p.sku || "—",
            product: p.name,
            productImage: p.image || (Array.isArray(p.images) ? p.images[0] : "") || "",
            category: p.categoryName || "Apparel",
            brand: p.brandName || "—",
            price: `Rs ${Number(p.sellingPrice || 0).toFixed(2)}`,
            unit: p.unitName || "pc",
            qty: `${p.stockQuantity ?? 0} Pcs`,
            createdby: "Admin"
          }));
          setDataSource(mapped);
        } else {
          setDataSource([]);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load product list");
        setDataSource([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  const route = all_routes;


  const columns = [
    {
      title: "SKU",
      dataIndex: "sku",
      sorter: (a, b) => a.sku.length - b.sku.length,
    },
    {
      title: "Product",
      dataIndex: "product",
      render: (text, record) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <ImageWithBasePath alt="" src={record.productImage} />
          </Link>
          <Link to="#">{text}</Link>
        </div>
      ),
      sorter: (a, b) => a.product.length - b.product.length,
    },


    {
      title: "Category",
      dataIndex: "category",
      sorter: (a, b) => a.category.length - b.category.length,
    },

    {
      title: "Brand",
      dataIndex: "brand",
      sorter: (a, b) => a.brand.length - b.brand.length,
    },
    {
      title: "Price",
      dataIndex: "price",
      sorter: (a, b) => a.price.length - b.price.length,
    },
    {
      title: "Unit",
      dataIndex: "unit",
      sorter: (a, b) => a.unit.length - b.unit.length,
    },
    {
      title: "Qty",
      dataIndex: "qty",
      sorter: (a, b) => a.qty.length - b.qty.length,
    },

    {
      title: "Created By",
      dataIndex: "createdby",
      render: (text, record) => (
        <span className="userimgname">
          <Link to="/profile" className="product-img">
            <ImageWithBasePath alt="" src={record.img} />
          </Link>
          <Link to="/profile">{text}</Link>
        </span>
      ),
      sorter: (a, b) => a.createdby.length - b.createdby.length,
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link className="me-2 p-2" to={`${route.productdetails}?id=${record.id}`}>
              <Eye className="feather-view" />
            </Link>
            <Link className="me-2 p-2" to={`${route.editproduct}?id=${record.id}`}>
              <Edit className="feather-edit" />
            </Link>
            <Link
              className="confirm-text p-2"
              to="#" data-bs-toggle="modal" data-bs-target="#delete-modal"
            >
              <Trash2 className="feather-trash-2" />
            </Link>
          </div>
        </div>
      ),
      sorter: (a, b) => a.createdby.length - b.createdby.length,
    },
  ];

  const renderTooltip = (props) => (
    <Tooltip id="pdf-tooltip" {...props}>
      Pdf
    </Tooltip>
  );
  const renderExcelTooltip = (props) => (
    <Tooltip id="excel-tooltip" {...props}>
      Excel
    </Tooltip>
  );

  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );
  const renderCollapseTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Collapse
    </Tooltip>
  );
  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Product List</h4>
                <h6>Manage your products</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <li>
                <OverlayTrigger placement="top" overlay={renderTooltip}>
                  <Link>
                    <ImageWithBasePath src="assets/img/icons/pdf.svg" alt="img" />
                  </Link>
                </OverlayTrigger>
              </li>
              <li>
                <OverlayTrigger placement="top" overlay={renderExcelTooltip}>
                  <Link data-bs-toggle="tooltip" data-bs-placement="top">
                    <ImageWithBasePath
                      src="assets/img/icons/excel.svg"
                      alt="img"
                    />
                  </Link>
                </OverlayTrigger>
              </li>

              <li>
                <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                  <Link data-bs-toggle="tooltip" data-bs-placement="top">
                    <RotateCcw />
                  </Link>
                </OverlayTrigger>
              </li>
              <li>
                <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                  <Link
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    id="collapse-header"
                    className={data ? "active" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(setToogleHeader(!data));
                    }}
                  >
                    <ChevronUp />
                  </Link>
                </OverlayTrigger>
              </li>
            </ul>
            <div className="page-btn">
              <Link to={route.addproduct} className="btn btn-primary">
              <i className='ti ti-circle-plus me-1'></i>
                Add New Product
              </Link>
            </div>
            <div className="page-btn import">
              <Link
                to="#"
                className="btn btn-secondary color"
                data-bs-toggle="modal"
                data-bs-target="#view-notes"
              >
                <Download className="feather me-2" />
                Import Product
              </Link>
            </div>
          </div>
          {/* /product list */}
          <div className="card table-list-card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search by SKU or product name..."
                    className="form-control form-control-sm formsearch"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <select
                  className="form-select form-select-sm w-auto me-2"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  className="form-select form-select-sm w-auto"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                >
                  <option value="ALL">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body">

              {/* <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search"
                    className="form-control form-control-sm formsearch"
                  />
                  <Link to className="btn btn-searchset">
                    <i data-feather="search" className="feather-search" />
                  </Link>
                </div>
              </div>
              <div className="search-path">
                <Link
                  className={`btn btn-filter ${
                    isFilterVisible ? "setclose" : ""
                  }`}
                  id="filter_search"
                >
                  <Filter
                    className="filter-icon"
                    onClick={toggleFilterVisibility}
                  />
                  <span onClick={toggleFilterVisibility}>
                    <ImageWithBasePath
                      src="assets/img/icons/closes.svg"
                      alt="img"
                    />
                  </span>
                </Link>
              </div>
              <div className="form-sort">
                <Sliders className="info-img" />
                <Select
                  className="img-select"
                  classNamePrefix="react-select"
                  options={options}
                  placeholder="14 09 23"
                />
              </div>
            </div> */}
              {/* /Filter */}
              {/* <div
              className={`card${isFilterVisible ? " visible" : ""}`}
              id="filter_inputs"
              style={{ display: isFilterVisible ? "block" : "none" }}
            >
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-lg-12 col-sm-12">
                    <div className="row">
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <Box className="info-img" />
                          <Select
                            className="img-select"
                            classNamePrefix="react-select"
                            options={productlist}
                            placeholder="Choose Product"
                          />
                        </div>
                      </div>
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <StopCircle className="info-img" />
                          <Select
                            className="img-select"
                            classNamePrefix="react-select"
                            options={categorylist}
                            placeholder="Choose Category"
                          />
                        </div>
                      </div>
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <GitMerge className="info-img" />
                          <Select
                            className="img-select"
                            classNamePrefix="react-select"
                            options={subcategorylist}
                            placeholder="Choose Sub Category"
                          />
                        </div>
                      </div>
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <StopCircle className="info-img" />
                          <Select
                            className="img-select"
                            classNamePrefix="react-select"
                            options={brandlist}
                            placeholder="Enter brand name"
                          />
                        </div>
                      </div>
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <i className="fas fa-money-bill info-img" />

                          <Select
                            className="img-select"
                            classNamePrefix="react-select"
                            options={price}
                            placeholder="Price"
                          />
                        </div>
                      </div>
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <Link className="btn btn-filters ms-auto">
                            {" "}
                            <i
                              data-feather="search"
                              className="feather-search"
                            />{" "}
                            Search{" "}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
              {/* /Filter */}
              <div className="table-responsive">
                {loading && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-2 text-muted">Loading products...</p>
                  </div>
                )}
                {!loading && error && (
                  <div className="text-center py-5">
                    <i className="ti ti-alert-triangle fs-40 text-danger mb-2 d-block" />
                    <h5 className="text-danger">Could not load products</h5>
                    <p className="text-muted">{error}</p>
                  </div>
                )}
                {!loading && !error && filteredData.length === 0 && (
                  <div className="text-center py-5">
                    <i className="ti ti-package-off fs-40 text-muted mb-2 d-block" />
                    <h5 className="text-muted">No products found</h5>
                    <p className="text-muted">No items match the current inventory filters.</p>
                  </div>
                )}
                {!loading && !error && filteredData.length > 0 && (
                  <Table columns={columns} dataSource={filteredData} />
                )}
              </div>
            </div>
          </div>
          {/* /product list */}
          <Brand />
        </div>
      </div>
      <>
        {/* delete modal */}
        <div className="modal fade" id="delete-modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content p-5 px-3 text-center">
                  <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                    <i className="ti ti-trash fs-24 text-danger" />
                  </span>
                  <h4 className="fs-20 text-gray-9 fw-bold mb-2 mt-1">
                    Delete Product
                  </h4>
                  <p className="text-gray-6 mb-0 fs-16">
                    Are you sure you want to delete product?
                  </p>
                  <div className="modal-footer-btn mt-3 d-flex justify-content-center">
                    <button
                      type="button"
                      className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary fs-13 fw-medium p-2 px-3" data-bs-dismiss="modal"
                    >
                      Yes Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>

    </>

  );
};

export default ProductList;
