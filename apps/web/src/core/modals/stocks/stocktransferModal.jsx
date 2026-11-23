import React from "react";
import Select from "react-select";
import ImageWithBasePath from "../../img/imagewithbasebath";
import { Link } from "react-router-dom";

const StockTransferModal = () => {
  const optionsChoose = [
    { value: "choose", label: "Choose" },
    { value: "lobarHandy", label: "Lobar Handy" },
    { value: "quaintWarehouse", label: "Quaint Warehouse" },
  ];

  const optionsSelosyLogerro = [
    { value: "choose", label: "Choose" },
    { value: "selosy", label: "Selosy" },
    { value: "logerro", label: "Logerro" },
  ];

  const optionsStore1Store2 = [
    { value: "choose", label: "Choose" },
    { value: "store1", label: "Store 1" },
    { value: "store2", label: "Store 2" },
  ];

  const optionsSentPending = [
    { value: "choose", label: "Choose" },
    { value: "sent", label: "Sent" },
    { value: "pending", label: "Pending" },
  ];
  return (
    <div>
      {/* Add Stock */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-0 custom-modal-header">
                  <div className="page-title">
                    <h4>Add Transfer</h4>
                  </div>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body custom-modal-body">
                  <form>
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="input-blocks">
                          <label>Warehouse From</label>
                          <Select classNamePrefix="react-select" options={optionsChoose} />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="input-blocks">
                          <label>Warehouse To</label>
                          <Select
                            classNamePrefix="react-select"
                            options={optionsSelosyLogerro}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="input-blocks">
                          <label>Responsible Person</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="input-blocks search-form mb-3">
                          <label>Product</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Select Product"
                          />
                          <i
                            data-feather="search"
                            className="feather-search custom-search"
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="input-blocks search-form mb-0">
                          <label>Notes</label>
                          <textarea
                            className="form-control"
                            defaultValue={""}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer-btn">
                      <button
                        type="button"
                        className="btn btn-cancel me-2"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-submit">
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Stock */}
      {/* Edit Stock */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-0 custom-modal-header">
                  <div className="page-title">
                    <h4>Edit Transfer</h4>
                  </div>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body custom-modal-body">
                  <form>
                    <div className="input-blocks search-form">
                      <label>Product</label>
                      <input
                        type="text"
                        className="form-control"
                        defaultValue="Nike Jordan"
                      />
                      <i
                        data-feather="search"
                        className="feather-search custom-search"
                      />
                    </div>
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="input-blocks">
                          <label>Warehouse From</label>
                          <Select classNamePrefix="react-select" options={optionsChoose} />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="input-blocks">
                          <label>Warehouse To</label>
                          <Select
                            classNamePrefix="react-select"
                            options={optionsSelosyLogerro}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="input-blocks">
                          <label>Reference No</label>
                          <input
                            type="text"
                            className="form-control"
                            defaultValue={32434545}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="input-blocks search-form mb-3">
                          <label>Product</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Select Product"
                            defaultValue="Nike Jordan"
                          />
                          <i
                            data-feather="search"
                            className="feather-search custom-search"
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="modal-body-table">
                          <div className="table-responsive">
                            <table className="table  datanew">
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>SKU</th>
                                  <th>Category</th>
                                  <th>Qty</th>
                                  <th className="no-sort">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td colSpan="5" className="text-center text-muted py-3">
                                    No products selected
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="input-blocks search-form mb-0">
                          <label>Notes</label>
                          <textarea
                            className="form-control"
                            defaultValue=""
                          />
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer-btn">
                      <button
                        type="button"
                        className="btn btn-cancel me-2"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-submit">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Edit Stock */}
      {/* Import Transfer */}
      <div className="modal fade" id="view-notes">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-0 custom-modal-header">
                  <div className="page-title">
                    <h4>Import Transfer</h4>
                  </div>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </div>
              <div className="modal-body custom-modal-body">
                <form>
                  <div className="row">
                    <div className="col-lg-4 col-sm-6 col-12">
                      <div className="input-blocks">
                        <label>From</label>
                        <Select
                          classNamePrefix="react-select"
                          options={optionsStore1Store2}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-6 col-12">
                      <div className="input-blocks">
                        <label>To</label>
                        <Select
                          classNamePrefix="react-select"
                          options={optionsStore1Store2}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-6 col-12">
                      <div className="input-blocks">
                        <label>Satus</label>
                        <Select
                          classNamePrefix="react-select"
                          options={optionsSentPending}
                        />
                      </div>
                    </div>
                    <div className="col-lg-12 col-sm-6 col-12">
                      <div className="row">
                        <div>
                          <div className="modal-footer-btn download-file">
                            <Link to="#" className="btn btn-submit">
                              Download Sample File
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="input-blocks image-upload-down">
                        <label> Upload CSV File</label>
                        <div className="image-upload download">
                          <input type="file" />
                          <div className="image-uploads">
                            <ImageWithBasePath
                              src="assets/img/download-img.png"
                              alt="img"
                            />
                            <h4>
                              Drag and drop a <span>file to upload</span>
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-12 col-sm-6 col-12">
                      <div className="mb-3">
                        <label className="form-label">Shipping</label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3 summer-description-box transfer">
                      <label className="form-label">Description</label>
                      <div id="summernote3"></div>
                      <p>Maximum 60 Characters</p>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="modal-footer-btn">
                      <button
                        type="button"
                        className="btn btn-cancel me-2"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-submit">
                        Submit
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Import Transfer */}
    </div>
  );
};

export default StockTransferModal;
