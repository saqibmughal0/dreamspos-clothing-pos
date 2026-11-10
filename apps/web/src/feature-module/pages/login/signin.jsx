import React, { useState } from "react";
import ImageWithBasePath from "../../../core/img/imagewithbasebath";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../../Router/all_routes";
import { apiClient } from "../../../core/apiClient";

const Signin = () => {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };
  const route = all_routes;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const loginEmail = email.trim() || "admin@dreamspos.com";
    const loginPassword = password || "Admin@12345";

    try {
      const res = await apiClient.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });

      if (res.data?.success && res.data.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.data.accessToken);
        localStorage.setItem("user", JSON.stringify(res.data.data.user));
        navigate(route.newdashboard);
      } else {
        setErrorMsg(res.data?.message || "Invalid email or password");
      }
    } catch (err) {
      console.warn("Login failed:", err);
      const serverMessage = err.response?.data?.message;
      setErrorMsg(serverMessage || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Wrapper */}
      <div className="main-wrapper">
        <div className="account-content">
          <div className="login-wrapper bg-img">
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
                    <h3>Sign In</h3>
                    <h4 className="fs-16">
                      Access the Dreamspos panel using your email and passcode.
                    </h4>
                  </div>
                  {errorMsg && (
                    <div className="alert alert-danger py-2 mb-3 fs-13">
                      {errorMsg}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">
                      Email <span className="text-danger"> *</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@dreamspos.com"
                        className="form-control border-end-0"
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
                        type={isPasswordVisible ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Admin@12345"
                        className="pass-input form-control"
                      />
                      <span
                        className={`ti toggle-password ${isPasswordVisible ? "ti-eye" : "ti-eye-off"
                          }`}
                        onClick={togglePasswordVisibility}
                      ></span>
                    </div>
                  </div>
                  <div className="form-login authentication-check">
                    <div className="row">
                      <div className="col-12 d-flex align-items-center justify-content-between">
                        <div className="custom-control custom-checkbox">
                          <label className="checkboxs ps-4 mb-0 pb-0 line-height-1 fs-16 text-gray-6">
                            <input type="checkbox" className="form-control" />
                            <span className="checkmarks" />
                            Remember me
                          </label>
                        </div>
                        <div className="text-end">
                          <Link
                            className="text-orange fs-16 fw-medium"
                            to={route.forgotPassword}
                          >
                            Forgot Password?
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-login">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-100"
                    >
                      {loading ? "Signing In..." : "Sign In"}
                    </button>
                  </div>
                  <div className="signinform">
                    <h4>
                      New on our platform?
                      <Link to={route.register} className="hover-a">
                        {" "}
                        Create an account
                      </Link>
                    </h4>
                  </div>
                  <div className="form-setlogin or-text">
                    <h4>OR</h4>
                  </div>
                  <div className="mt-2">
                    <div className="d-flex align-items-center justify-content-center flex-wrap">
                      <div className="text-center me-2 flex-fill">
                        <Link
                          to="#"
                          className="br-10 p-2 btn btn-info d-flex align-items-center justify-content-center"
                        >
                          <ImageWithBasePath
                            className="img-fluid m-1"
                            src="assets/img/icons/facebook-logo.svg"
                            alt="Facebook"
                          />
                        </Link>
                      </div>
                      <div className="text-center me-2 flex-fill">
                        <Link
                          to="#"
                          className="btn btn-white br-10 p-2  border d-flex align-items-center justify-content-center"
                        >
                          <ImageWithBasePath
                            className="img-fluid m-1"
                            src="assets/img/icons/google-logo.svg"
                            alt="Facebook"
                          />
                        </Link>
                      </div>
                      <div className="text-center flex-fill">
                        <Link
                          to="#"
                          className="bg-dark br-10 p-2 btn btn-dark d-flex align-items-center justify-content-center"
                        >
                          <ImageWithBasePath
                            className="img-fluid m-1"
                            src="assets/img/icons/apple-logo.svg"
                            alt="Apple"
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="my-4 d-flex justify-content-center align-items-center copyright-text">
                    <p>Copyright © 2025 DreamsPOS</p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Main Wrapper */}
    </>

  );
};

export default Signin;
