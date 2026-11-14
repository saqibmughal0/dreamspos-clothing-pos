import React, { useState } from "react";
import ImageWithBasePath from "../../../core/img/imagewithbasebath";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../../Router/all_routes";
import { apiClient } from "../../../core/apiClient";
import { triggerGoogleAuth } from "../../../core/googleAuth";

const Register = () => {
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const route = all_routes;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter your name");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Please enter your email address");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter a password");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    if (!termsAgreed) {
      setErrorMsg("Please accept the Terms & Privacy policy");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data?.success) {
        setSuccessMsg("Account created! A verification code has been sent to your email.");
        setTimeout(() => {
          navigate(`${route.emailverification}?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        }, 1200);
      } else {
        setErrorMsg(res.data?.message || "Registration failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setGoogleLoading(true);

    triggerGoogleAuth({
      onSuccess: async (credential) => {
        try {
          const res = await apiClient.post("/auth/google", { credential });
          if (res.data?.success && res.data.data?.accessToken) {
            localStorage.setItem("accessToken", res.data.data.accessToken);
            localStorage.setItem("user", JSON.stringify(res.data.data.user));
            navigate(route.newdashboard);
          } else {
            setErrorMsg(res.data?.message || "Google sign-up failed");
          }
        } catch (err) {
          const msg = err.response?.data?.message || "Google sign-up failed on server.";
          setErrorMsg(msg);
        } finally {
          setGoogleLoading(false);
        }
      },
      onError: (err) => {
        setGoogleLoading(false);
        setErrorMsg(typeof err === "string" ? err : "Google sign-up could not be completed.");
      }
    });
  };

  return (
    <>
      {/* Main Wrapper */}
      <div className="main-wrapper">
        <div className="account-content">
          <div className="login-wrapper register-wrap bg-img auth-split-wrapper">
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
                    <h3>Register</h3>
                    <h4>Create New MR Bilal Account</h4>
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
                  <div className="mb-3">
                    <label className="form-label">
                      Name <span className="text-danger"> *</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="MR Bilal Owner"
                        className="form-control border-end-0"
                        required
                      />
                      <span className="input-group-text border-start-0">
                        <i className="ti ti-user" />
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Email <span className="text-danger"> *</span>
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
                  <div className="mb-3">
                    <label className="form-label">
                      Password <span className="text-danger"> *</span>
                    </label>
                    <div className="pass-group">
                      <input
                        type={passwordVisibility.password ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="******"
                        className="pass-input form-control"
                        required
                      />
                      <span
                        className={`ti toggle-password ${passwordVisibility.password ? "ti-eye" : "ti-eye-off"
                          }`}
                        onClick={() => togglePasswordVisibility("password")}
                      ></span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Confirm Password <span className="text-danger"> *</span>
                    </label>
                    <div className="pass-group">
                      <input
                        type={
                          passwordVisibility.confirmPassword ? "text" : "password"
                        }
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="******"
                        className="pass-input form-control"
                        required
                      />
                      <span
                        className={`ti toggle-password ${passwordVisibility.confirmPassword
                          ? "ti-eye"
                          : "ti-eye-off"
                          }`}
                        onClick={() =>
                          togglePasswordVisibility("confirmPassword")
                        }
                      ></span>
                    </div>
                  </div>
                  <div className="form-login authentication-check">
                    <div className="row">
                      <div className="col-sm-12">
                        <div className="custom-control custom-checkbox justify-content-start">
                          <label className="checkboxs ps-4 mb-0 pb-0 line-height-1">
                            <input
                              type="checkbox"
                              checked={termsAgreed}
                              onChange={(e) => setTermsAgreed(e.target.checked)}
                            />
                            <span className="checkmarks" />I agree to the{" "}
                            <Link to="#" className="text-primary">
                              Terms &amp; Privacy
                            </Link>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-login">
                    <button
                      type="submit"
                      disabled={loading || googleLoading}
                      className="btn btn-primary w-100"
                    >
                      {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                  </div>
                  <div className="signinform">
                    <h4>
                      Already have an account ?{" "}
                      <Link to={route.signin} className="hover-a">
                        Sign In Instead
                      </Link>
                    </h4>
                  </div>
                  <div className="form-setlogin or-text">
                    <h4>OR</h4>
                  </div>
                  <div className="mt-2">
                    <div className="d-flex align-items-center justify-content-center">
                      <button
                        type="button"
                        onClick={handleGoogleSignUp}
                        disabled={googleLoading || loading}
                        className="btn btn-white auth-google-btn br-10 p-2 border d-inline-flex align-items-center justify-content-center w-100"
                        style={{ maxWidth: "260px" }}
                      >
                        <ImageWithBasePath
                          className="img-fluid m-1 me-2"
                          src="assets/img/icons/google-logo.svg"
                          alt="Google"
                        />
                        <span className="fs-14 fw-medium text-gray-9">
                          {googleLoading ? "Connecting..." : "Sign up with Google"}
                        </span>
                      </button>
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

export default Register;
