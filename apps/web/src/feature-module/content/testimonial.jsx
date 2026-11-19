import React from "react";
import CommonFooter from "../../core/common/footer/commonFooter";

const Testimonial = () => (
  <div className="page-wrapper">
    <div className="content">
      <div className="page-header">
        <div className="page-title">
          <h4>Testimonials</h4>
          <h6>CMS testimonials</h6>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-quote-off fs-40 text-muted mb-2 d-block" />
          <h5 className="text-muted">No Testimonials Configured</h5>
          <p className="text-muted mb-0">No CMS testimonial records exist.</p>
        </div>
      </div>
    </div>
    <CommonFooter />
  </div>
);

export default Testimonial;
