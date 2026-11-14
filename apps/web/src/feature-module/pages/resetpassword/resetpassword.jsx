import React, { useState, useEffect } from "react";
import ImageWithBasePath from "../../../core/img/imagewithbasebath";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { all_routes } from "../../../Router/all_routes";
import { apiClient } from "../../../core/apiClient";

const Resetpassword = () => {
  const route = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    const urlToken = searchParams.get("token");
    if (urlEmail) setEmail(urlEmail);
    if (urlToken) setToken(urlToken);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter your email address");
      return;
    }
    if (!token.trim()) {
      setErrorMsg("Please enter your 6-digit reset code");
      return;
    }
    if (!newPassword) {
      setErrorMsg("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        token: token.trim(),
        newPassword
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || "Password reset successful! Redirecting to sign in...");
        setTimeout(() => {
          navigate(route.signin);
        }, 1500);
      } else {
        setErrorMsg(res.data?.message || "Password reset failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or expired reset code.";
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
          <div className="login-wrapper reset-pass-wrap bg-img auth-split-wrapper">
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
                    <h3>Reset Password</h3>
                    <h4 className="fs-15">
                      Enter your reset code and choose a new secure password.
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

                  <div className="mb-3 text-start">
                    <label className="form-label">
                      Reset Code (OTP) <span className="text-danger"> *</span>
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="6-digit reset code"
                      maxLength={10}
                      className="form-control text-center fs-18 fw-bold"
                      required
                    />
                  </div>

                  <div className="mb-3 text-start">
                    <label className="form-label">
                      New Password <span className="text-danger"> *</span>
                    </label>
                    <div className="pass-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="******"
                        className="pass-input form-control"
                        required
                      />
                      <span
                        className={`ti toggle-passwords ${showPassword ? "ti-eye" : "ti-eye-off"}`}
                        onClick={() => setShowPassword(!showPassword)}
                      ></span>
                    </div>
                  </div>

                  <div className="mb-3 text-start">
                    <label className="form-label">
                      Confirm New Password <span className="text-danger"> *</span>
                    </label>
                    <div className="pass-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="******"
                        className="pass-input form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-login">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-100"
                    >
                      {loading ? "Resetting Password..." : "Update Password"}
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

export default Resetpassword;
