import React from "react";
import CommonFooter from "../../core/common/footer/commonFooter";

const Wishlist = () => (
  <div className="page-wrapper">
    <div className="content">
      <div className="page-header">
        <div className="page-title">
          <h4>Wishlist</h4>
          <h6>Online storefront wishlist</h6>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-heart-off fs-40 text-muted mb-2 d-block" />
          <h5 className="text-muted">No Wishlist Items</h5>
          <p className="text-muted mb-0">Online storefront wishlists are not enabled in this POS.</p>
        </div>
      </div>
    </div>
    <CommonFooter />
  </div>
);

export default Wishlist;
