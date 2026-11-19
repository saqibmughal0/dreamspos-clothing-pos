import React from "react";
import CommonFooter from "../../core/common/footer/commonFooter";

const Orders = () => (
  <div className="page-wrapper">
    <div className="content">
      <div className="page-header">
        <div className="page-title">
          <h4>Online Orders</h4>
          <h6>Online storefront orders</h6>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-package-off fs-40 text-muted mb-2 d-block" />
          <h5 className="text-muted">No Online Orders</h5>
          <p className="text-muted mb-0">Online storefront orders are not enabled. View in-store sales under Sales &rarr; Sales List.</p>
        </div>
      </div>
    </div>
    <CommonFooter />
  </div>
);

export default Orders;
