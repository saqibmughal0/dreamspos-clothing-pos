import React, { useState } from "react";
import ImageWithBasePath from "../../../core/img/imagewithbasebath";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../../Router/all_routes";
import { apiClient } from "../../../core/apiClient";

const Forgotpassword = () => {
  const route = all_routes;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter your registered email address");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setSuccessMsg(
        res.data?.message ||
          "If an account with that email exists, password reset instructions have been sent."
      );

      setTimeout(() => {
        navigate(`${route.resetpassword}?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit reset request. Please try again.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Wrapper */}
      <div className="main-wrapper">
        <div className="account-content">
          <div className="login-wrapper forgot-pass-wrap bg-img auth-split-wrapper">
            <div className="login-content authent-content">
              <form onSubmit={handleSubmit}>
                <div className="login-userset">
                  <div className="login-logo logo-normal">
                    <ImageWithBasePath src="assets/img/logo.png" alt="img" />
                  </div>
                  <Link to={route.dashboard} className="login-logo logo-white">
                    <ImageWithBasePath src="assets/img/logo-white.png" alt="Img" />
                  </Link>
                  <div className="login-userheading">
                    <h3>Forgot Password?</h3>
                    <h4 className="fs-15">
                      Enter your email address and we'll send you instructions and a reset code.
                    </h4>
                  </div>

                  {errorMsg && (
                    <div className="alert alert-danger py-2 mb-3 fs-13">
                      {errorMsg}
                    </div>
                  )}
                  {successMsg && (
                    <div className="alert alert-success py-2 mb-3 fs-13">
                      {successMsg}
                    </div>
                  )}

                  <div className="mb-3 text-start">
                    <label className="form-label">
                      Email Address <span className="text-danger"> *</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@mrbilal.com"
                        className="form-control border-end-0"
                        required
                      />
                      <span className="input-group-text border-start-0">
                        <i className="ti ti-mail" />
                      </span>
                    </div>
                  </div>

                  <div className="form-login">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-100"
                    >
                      {loading ? "Sending Reset Code..." : "Send Reset Code"}
                    </button>
                  </div>

                  <div className="signinform text-center">
                    <h4>
                      Return to{" "}
                      <Link to={route.signin} className="hover-a">
                        Sign In
                      </Link>
                    </h4>
                  </div>

                  <div className="my-4 d-flex justify-content-center align-items-center copyright-text">
                    <p>Copyright © 2025 MR Bilal</p>
                  </div>
                </div>
              </form>
            </div>
            <div className="login-side-img d-none d-lg-block">
              <img
                src="/assets/img/authentication/Golden Mannequins in Embroidered Elegance.png"
                alt="MR Bilal - Golden Mannequins in Embroidered Elegance"
              />
            </div>
          </div>
        </div>
      </div>
      {/* /Main Wrapper */}
    </>
  );
};

export default Forgotpassword;
