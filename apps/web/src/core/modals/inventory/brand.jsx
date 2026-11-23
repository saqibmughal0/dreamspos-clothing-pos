import React from 'react'
import { Link } from 'react-router-dom'
import Select from 'react-select'
import ImageWithBasePath from '../../img/imagewithbasebath';

const Brand = () => {
    const product = [
        { value: 'choose', label: 'Choose' },
      ];
      const category = [
        { value: 'choose', label: 'Choose' },
      ];
      const status = [
        { value: 'choose', label: 'Choose' },
      ];
      
    return (
        <div>
                {/* Import Product */}
                <div className="modal fade" id="view-notes">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="page-wrapper-new p-0">
                                <div className="content">
                                    <div className="modal-header border-0 custom-modal-header">
                                        <div className="page-title">
                                            <h4>Import Product</h4>
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
                                                <div className="col-lg-4 col-sm-6 col-12">
                                                    <div className="input-blocks">
                                                        <label>Product</label>
                                                        <Select options={product} classNamePrefix="react-select" placeholder="Choose" />

                                                    </div>
                                                </div>
                                                <div className="col-lg-4 col-sm-6 col-12">
                                                    <div className="input-blocks">
                                                        <label>Category</label>
                                                        <Select options={category} classNamePrefix="react-select" placeholder="Choose" />

                                                    </div>
                                                </div>
                                                <div className="col-lg-4 col-sm-6 col-12">
                                                    <div className="input-blocks">
                                                        <label>Satus</label>
                                                        <Select options={status} classNamePrefix="react-select" placeholder="Choose" />

                                                    </div>
                                                </div>
                                                <div className="col-lg-12 col-sm-6 col-12">
                                                    <div className="row">
                                                        <div>
                                                            <div className="modal-footer-btn download-file">
                                                                <Link
                                                                    to="#"
                                                                    className="btn btn-submit"
                                                                >
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
                                                                <ImageWithBasePath src="assets/img/download-img.png" alt="img" />
                                                                <h4>
                                                                    Drag and drop a <span>file to upload</span>
                                                                </h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-lg-12 col-sm-6 col-12">
                                                    <div className="mb-3">
                                                        <label className="form-label">Created by</label>
                                                        <input type="text" className="form-control" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-12">
                                                <div className="mb-3 input-blocks">
                                                    <label className="form-label">Description</label>
                                                    <textarea className="form-control" defaultValue={""} />
                                                    <p className="mt-1">Maximum 60 Characters</p>
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
                                                    <Link to="#" className="btn btn-submit">
                                                        Submit
                                                    </Link>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* /Import Product */}
        </div>
    )
}

export default Brand
