import React from "react";
import CommonFooter from "../../core/common/footer/commonFooter";

const Activities = () => {
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4>All Notifications</h4>
            <h6>Store activity &amp; alerts</h6>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="ti ti-bell-off fs-40 text-muted mb-2 d-block" />
            <h5 className="text-muted">No recent activity notifications</h5>
            <p className="text-muted mb-0">System notifications will appear here as activity is recorded.</p>
          </div>
        </div>
      </div>
      <CommonFooter />
    </div>
  );
};

export default Activities;
