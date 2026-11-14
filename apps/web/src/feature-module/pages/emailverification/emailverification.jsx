import React, { useState, useEffect } from "react";
import ImageWithBasePath from "../../../core/img/imagewithbasebath";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { all_routes } from "../../../Router/all_routes";
import { apiClient } from "../../../core/apiClient";

const EmailVerification = () => {
  const route = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState(searchParams.get("token") || "");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    const urlToken = searchParams.get("token");
    if (urlEmail) setEmail(urlEmail);
    if (urlToken) setOtp(urlToken);
  }, [searchParams]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    if (!otp.trim()) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/verify-email", {
        email: email.trim().toLowerCase(),
        token: otp.trim()
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || "Email verified successfully!");

        if (res.data.data?.accessToken) {
          localStorage.setItem("accessToken", res.data.data.accessToken);
          localStorage.setItem("user", JSON.stringify(res.data.data.user));
          setTimeout(() => {
            navigate(route.newdashboard);
          }, 1200);
        } else {
          setTimeout(() => {
            navigate(route.signin);
          }, 1500);
        }
      } else {
        setErrorMsg(res.data?.message || "Verification failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or expired verification code.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    if (e) e.preventDefault();
    if (countdown > 0) return;

    if (!email.trim()) {
      setErrorMsg("Please enter your email to resend verification code.");
      return;
    }

    setResendLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await apiClient.post("/auth/resend-verification", {
        email: email.trim().toLowerCase()
      });

      setSuccessMsg(res.data?.message || "A new verification code has been sent!");
      setCountdown(60);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend verification code.";
      setErrorMsg(msg);
    } finally {
      setResendLoading(false);
    }
  };

  const maskEmail = (str) => {
    if (!str || !str.includes("@")) return "your email";
    const [name, domain] = str.split("@");
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
  };

  return (
    <>
      {/* Main Wrapper */}
      <div className="main-wrapper">
        <div className="account-content">
          <div className="login-wrapper email-veri-wrap bg-img auth-split-wrapper">
            <div className="login-content authent-content">
              <form onSubmit={handleVerify} className="digit-group">
                <div className="login-userset">
                  <div className="login-logo logo-normal">
                    <ImageWithBasePath src="assets/img/logo.png" alt="img" />
                  </div>
                  <Link to={route.dashboard} className="login-logo logo-white">
                    <ImageWithBasePath src="assets/img/logo-white.png" alt="Img" />
                  </Link>
                  <div>
                    <div className="login-userheading">
                      <h3>Email Verification</h3>
                      <h4 className="fs-15">
                        {email
                          ? `Enter the code sent to ${maskEmail(email)}`
                          : "Enter your registered email and the verification code sent to you."}
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
                          placeholder="user@example.com"
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
                        Verification Code (OTP) <span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="6-digit code e.g. 123456"
                        maxLength={10}
                        className="form-control text-center fs-20 fw-bold letter-spacing-2"
                        required
                      />
                    </div>

                    <div className="mb-3 text-center">
                      <p className="text-gray-9 fs-14">
                        Didn't receive the code?{" "}
                        {countdown > 0 ? (
                          <span className="text-muted fw-medium">Resend in {countdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendLoading}
                            className="btn btn-link text-primary p-0 fs-14 fw-medium text-decoration-none"
                          >
                            {resendLoading ? "Sending..." : "Resend Code"}
                          </button>
                        )}
                      </p>
                    </div>

                    <div className="mb-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-100"
                      >
                        {loading ? "Verifying..." : "Verify & Proceed"}
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

export default EmailVerification;
