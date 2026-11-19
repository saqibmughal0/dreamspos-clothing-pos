import React from "react";
import CommonFooter from "../../core/common/footer/commonFooter";

const Reviews = () => (
  <div className="page-wrapper">
    <div className="content">
      <div className="page-header">
        <div className="page-title">
          <h4>Product Reviews</h4>
          <h6>Customer reviews</h6>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-message-off fs-40 text-muted mb-2 d-block" />
          <h5 className="text-muted">No Reviews Found</h5>
          <p className="text-muted mb-0">Customer product reviews are not enabled in this POS.</p>
        </div>
      </div>
    </div>
    <CommonFooter />
  </div>
);

export default Reviews;
