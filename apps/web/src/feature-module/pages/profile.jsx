import React, { useState, useEffect, useRef } from "react";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import { Link } from "react-router-dom";
import { apiClient } from "../../core/apiClient";
import { triggerGoogleAuth } from "../../core/googleAuth";

const Profile = () => {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setNewPasswordVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Email Change State
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailChangePassword, setEmailChangePassword] = useState("");
  const [emailChangeOtp, setEmailChangeOtp] = useState("");
  const [emailStep, setEmailStep] = useState(1); // 1 = request, 2 = verify
  const [emailChanging, setEmailChanging] = useState(false);

  // Google Linking State
  const [googleActionLoading, setGoogleActionLoading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiClient.get("/users/me");
      if (res.data?.success && res.data.data?.user) {
        const u = res.data.data.user;
        const nameParts = (u.name || "").trim().split(" ");
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setUserName(u.name || "");
        setRole(u.role || "Cashier");
        setAvatar(u.avatar || null);
        setGoogleLinked(!!u.googleLinked);

        // Update localStorage user cache
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (err) {
      console.warn("Failed to fetch profile from API, checking localStorage:", err);
      try {
        const cached = JSON.parse(localStorage.getItem("user") || "{}");
        if (cached.name) {
          const parts = (cached.name || "").trim().split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
          setEmail(cached.email || "");
          setPhone(cached.phone || "");
          setUserName(cached.name || "");
          setRole(cached.role || "Cashier");
          setAvatar(cached.avatar || null);
          setGoogleLinked(!!cached.googleLinked);
        }
      } catch (e) {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 2 MB limit. Please select a smaller photo.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMsg("Accepted image formats are JPG, PNG, and WebP.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await apiClient.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.success && res.data.data?.avatar) {
        const newAvatar = res.data.data.avatar;
        setAvatar(newAvatar);
        setSuccessMsg("Profile picture updated successfully!");

        // Update localStorage
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        stored.avatar = newAvatar;
        localStorage.setItem("user", JSON.stringify(stored));
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload image. Please try again.";
      setErrorMsg(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (!avatar) return;

    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await apiClient.delete("/users/me/avatar");
      if (res.data?.success) {
        setAvatar(null);
        setSuccessMsg("Profile picture removed successfully.");

        // Update localStorage
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        stored.avatar = null;
        localStorage.setItem("user", JSON.stringify(stored));
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to remove image.";
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const combinedName = userName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!combinedName) {
      setErrorMsg("Please provide your name.");
      return;
    }

    if (newPassword && !currentPassword) {
      setErrorMsg("Current password is required to change your password.");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: combinedName,
        phone: phone.trim()
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await apiClient.put("/users/me", payload);
      if (res.data?.success) {
        setSuccessMsg(res.data.message || "Profile changes saved successfully!");
        setCurrentPassword("");
        setNewPassword("");

        if (res.data.data?.user) {
          localStorage.setItem("user", JSON.stringify(res.data.data.user));
          setUserName(res.data.data.user.name);
          setPhone(res.data.data.user.phone || "");
        }
      } else {
        setErrorMsg(res.data?.message || "Failed to save profile changes.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save profile changes. Please try again.";
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  // Google Linking Handler
  const handleLinkGoogle = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setGoogleActionLoading(true);

    triggerGoogleAuth({
      onSuccess: async (credential) => {
        try {
          const res = await apiClient.post("/users/me/google/link", { credential });
          if (res.data?.success) {
            setGoogleLinked(true);
            setSuccessMsg("Google account successfully linked!");
            fetchProfile();
          } else {
            setErrorMsg(res.data?.message || "Failed to link Google account.");
          }
        } catch (err) {
          setErrorMsg(err.response?.data?.message || "Failed to link Google account.");
        } finally {
          setGoogleActionLoading(false);
        }
      },
      onError: (err) => {
        setGoogleActionLoading(false);
        setErrorMsg(typeof err === "string" ? err : "Google authorization failed.");
      }
    });
  };

  const handleUnlinkGoogle = async () => {
    if (!window.confirm("Are you sure you want to unlink your Google account?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    setGoogleActionLoading(true);

    try {
      const res = await apiClient.post("/users/me/google/unlink");
      if (res.data?.success) {
        setGoogleLinked(false);
        setSuccessMsg("Google account unlinked successfully.");
        fetchProfile();
      } else {
        setErrorMsg(res.data?.message || "Failed to unlink Google account.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to unlink Google account.");
    } finally {
      setGoogleActionLoading(false);
    }
  };

  // Email Change Handlers
  const handleRequestEmailChange = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newEmailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmailInput)) {
      setErrorMsg("Please enter a valid new email address.");
      return;
    }

    if (!emailChangePassword) {
      setErrorMsg("Current password is required to request an email change.");
      return;
    }

    setEmailChanging(true);
    try {
      const res = await apiClient.post("/users/me/email-change/request", {
        newEmail: newEmailInput.trim(),
        currentPassword: emailChangePassword
      });

      if (res.data?.success) {
        setEmailStep(2);
        setSuccessMsg(res.data.message || "Verification code sent to your new email address.");
      } else {
        setErrorMsg(res.data?.message || "Failed to request email change.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to initiate email change.");
    } finally {
      setEmailChanging(false);
    }
  };

  const handleVerifyEmailChange = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!emailChangeOtp.trim()) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    setEmailChanging(true);
    try {
      const res = await apiClient.post("/users/me/email-change/verify", {
        otp: emailChangeOtp.trim()
      });

      if (res.data?.success) {
        setEmail(res.data.email || newEmailInput);
        setSuccessMsg("Email address successfully updated!");
        setShowEmailChange(false);
        setEmailStep(1);
        setNewEmailInput("");
        setEmailChangePassword("");
        setEmailChangeOtp("");
        fetchProfile();
      } else {
        setErrorMsg(res.data?.message || "Invalid or expired verification code.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to verify email change.");
    } finally {
      setEmailChanging(false);
    }
  };

  const getAvatarSrc = () => {
    if (!avatar) {
      return "assets/img/profiles/avator1.jpg";
    }
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      return avatar;
    }
    const apiUrl = import.meta.env.VITE_API_URL || "";
    const backendOrigin = apiUrl.replace(/\/api\/?$/, "");
    return `${backendOrigin}${avatar}`;
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4>Profile</h4>
            <h6>User Profile &amp; Settings</h6>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4>Profile Details</h4>
          </div>
          <div className="card-body profile-body">
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

            <h5 className="mb-2">
              <i className="ti ti-user text-primary me-1" />
              Basic Information
            </h5>

            <div className="profile-pic-upload image-field">
              <div className="profile-pic p-2 position-relative" style={{ width: "90px", height: "90px" }}>
                <img
                  src={getAvatarSrc()}
                  className="object-fit-cover w-100 h-100 rounded-circle border"
                  alt="user avatar"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/img/profiles/avator1.jpg";
                  }}
                />
                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "22px", height: "22px", cursor: "pointer" }}
                    title="Remove Image"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="mb-3">
                <div className="image-upload mb-0 d-inline-flex">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    id="profile-avatar-upload"
                  />
                  <label
                    htmlFor="profile-avatar-upload"
                    className="btn btn-primary fs-13 mb-0"
                    style={{ cursor: "pointer" }}
                  >
                    {uploading ? "Uploading..." : "Change Image"}
                  </label>
                </div>
                <p className="mt-2 text-muted fs-12">
                  Upload an image below 2 MB. Accepted file formats: JPG, PNG, WebP.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveChanges}>
              <div className="row">
                <div className="col-lg-6 col-sm-12">
                  <div className="mb-3">
                    <label className="form-label">
                      First Name<span className="text-danger ms-1">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setUserName(`${e.target.value} ${lastName}`.trim());
                      }}
                      required
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="mb-3">
                    <label className="form-label">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setUserName(`${firstName} ${e.target.value}`.trim());
                      }}
                    />
                  </div>
                </div>

                <div className="col-lg-6 col-sm-12">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label mb-0">
                        Email Address
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEmailChange(!showEmailChange);
                          setEmailStep(1);
                        }}
                        className="btn btn-link p-0 text-primary fs-12 text-decoration-none"
                      >
                        {showEmailChange ? "Cancel" : "Change Email"}
                      </button>
                    </div>
                    <input
                      type="email"
                      className="form-control bg-light"
                      value={email}
                      disabled
                      readOnly
                    />
                    <small className="text-muted">Primary verified account email</small>
                  </div>
                </div>

                <div className="col-lg-6 col-sm-12">
                  <div className="mb-3">
                    <label className="form-label">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="form-control"
                    />
                  </div>
                </div>

                {/* Email Change Flow Box */}
                {showEmailChange && (
                  <div className="col-12 mb-3">
                    <div className="p-3 border rounded bg-light">
                      <h6 className="text-dark mb-2">
                        <i className="ti ti-mail-forward me-1 text-primary"></i>
                        Secure Email Change (Requires 2-Step Verification)
                      </h6>
                      {emailStep === 1 ? (
                        <div className="row g-2 align-items-end">
                          <div className="col-md-5">
                            <label className="form-label fs-12">New Email Address</label>
                            <input
                              type="email"
                              className="form-control form-control-sm"
                              placeholder="new.email@example.com"
                              value={newEmailInput}
                              onChange={(e) => setNewEmailInput(e.target.value)}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fs-12">Current Password</label>
                            <input
                              type="password"
                              className="form-control form-control-sm"
                              placeholder="Enter current password"
                              value={emailChangePassword}
                              onChange={(e) => setEmailChangePassword(e.target.value)}
                            />
                          </div>
                          <div className="col-md-3">
                            <button
                              type="button"
                              onClick={handleRequestEmailChange}
                              disabled={emailChanging}
                              className="btn btn-primary btn-sm w-100"
                            >
                              {emailChanging ? "Sending OTP..." : "Send Verification Code"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="row g-2 align-items-end">
                          <div className="col-md-6">
                            <label className="form-label fs-12">
                              Enter 6-Digit Verification Code sent to <strong>{newEmailInput}</strong>
                            </label>
                            <input
                              type="text"
                              maxLength={6}
                              className="form-control form-control-sm text-center letter-spacing-2"
                              placeholder="123456"
                              value={emailChangeOtp}
                              onChange={(e) => setEmailChangeOtp(e.target.value)}
                            />
                          </div>
                          <div className="col-md-3">
                            <button
                              type="button"
                              onClick={handleVerifyEmailChange}
                              disabled={emailChanging}
                              className="btn btn-success btn-sm w-100"
                            >
                              {emailChanging ? "Verifying..." : "Confirm & Update"}
                            </button>
                          </div>
                          <div className="col-md-3">
                            <button
                              type="button"
                              onClick={() => setEmailStep(1)}
                              className="btn btn-outline-secondary btn-sm w-100"
                            >
                              Back
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="col-lg-6 col-sm-12">
                  <div className="mb-3">
                    <label className="form-label">
                      Display / User Name<span className="text-danger ms-1">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="col-lg-6 col-sm-12">
                  <div className="mb-3">
                    <label className="form-label">
                      Assigned Role
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={role}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                {/* Google Connected Account Section */}
                <div className="col-12 mt-3">
                  <div className="card border p-3 bg-light mb-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <h6 className="mb-1 text-dark d-flex align-items-center">
                          <ImageWithBasePath
                            src="assets/img/icons/google-icon.svg"
                            alt="Google"
                            className="me-2"
                            style={{ width: "20px", height: "20px" }}
                          />
                          Google Account Connection
                        </h6>
                        <p className="fs-13 text-muted mb-0">
                          {googleLinked
                            ? "Your Google account is securely linked for one-click authentication."
                            : "Link your Google account to enable quick sign-in without passwords."}
                        </p>
                      </div>
                      <div>
                        {googleLinked ? (
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                              ✓ Linked
                            </span>
                            <button
                              type="button"
                              onClick={handleUnlinkGoogle}
                              disabled={googleActionLoading}
                              className="btn btn-sm btn-outline-danger"
                            >
                              {googleActionLoading ? "Processing..." : "Unlink"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleLinkGoogle}
                            disabled={googleActionLoading}
                            className="btn btn-sm btn-outline-primary"
                          >
                            {googleActionLoading ? "Connecting..." : "Link Google Account"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 mt-2">
                  <h5 className="mb-2">
                    <i className="ti ti-lock text-primary me-1" />
                    Security &amp; Password
                  </h5>
                  <p className="text-muted fs-13 mb-3">
                    Leave password fields empty if you do not wish to change your password.
                  </p>
                </div>

                <div className="col-lg-6 col-sm-12">
                  <div className="mb-3">
                    <label className="form-label">Current Password</label>
                    <div className="pass-group">
                      <input
                        type={isPasswordVisible ? "text" : "password"}
                        className="pass-input form-control"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <span
                        className={`ti toggle-password ${
                          isPasswordVisible ? "ti-eye" : "ti-eye-off"
                        }`}
                        onClick={() => setPasswordVisible(!isPasswordVisible)}
                      ></span>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6 col-sm-12">
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <div className="pass-group">
                      <input
                        type={isNewPasswordVisible ? "text" : "password"}
                        className="pass-input form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter at least 6 characters"
                      />
                      <span
                        className={`ti toggle-password ${
                          isNewPasswordVisible ? "ti-eye" : "ti-eye-off"
                        }`}
                        onClick={() => setNewPasswordVisible(!isNewPasswordVisible)}
                      ></span>
                    </div>
                  </div>
                </div>

                <div className="col-12 d-flex justify-content-end mt-4">
                  <button
                    type="button"
                    onClick={fetchProfile}
                    className="btn btn-secondary me-2 shadow-none"
                    disabled={saving}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary shadow-none"
                    disabled={saving}
                  >
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
