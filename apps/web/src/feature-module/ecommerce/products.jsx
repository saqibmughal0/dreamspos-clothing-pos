import React from "react";
import CommonFooter from "../../core/common/footer/commonFooter";

const Products = () => (
  <div className="page-wrapper">
    <div className="content">
      <div className="page-header">
        <div className="page-title">
          <h4>Online Store Products</h4>
          <h6>Online storefront catalog</h6>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-building-store fs-40 text-muted mb-2 d-block" />
          <h5 className="text-muted">Online Storefront Not Configured</h5>
          <p className="text-muted mb-0">Manage your real store catalog under Inventory &rarr; Products.</p>
        </div>
      </div>
    </div>
    <CommonFooter />
  </div>
);

export default Products;
