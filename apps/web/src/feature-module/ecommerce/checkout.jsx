import React from "react";
import CommonFooter from "../../core/common/footer/commonFooter";

const Checkout = () => (
  <div className="page-wrapper">
    <div className="content">
      <div className="page-header">
        <div className="page-title">
          <h4>Online Checkout</h4>
          <h6>Online storefront checkout</h6>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-credit-card-off fs-40 text-muted mb-2 d-block" />
          <h5 className="text-muted">Online Storefront Not Configured</h5>
          <p className="text-muted mb-0">No online checkout sessions exist. Use the POS terminal for in-store billing.</p>
        </div>
      </div>
    </div>
    <CommonFooter />
  </div>
);

export default Checkout;
