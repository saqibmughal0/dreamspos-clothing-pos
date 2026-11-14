import React, { useEffect, useState } from 'react'
import ImageWithBasePath from '../../core/img/imagewithbasebath'
import { Link, useNavigate } from 'react-router-dom'
import { Tooltip } from 'antd';
import { all_routes } from '../../Router/all_routes';
import { Settings, User } from 'feather-icons-react/build/IconComponents';
import { CashRegisterModal } from '../../core/modals/pos-modal/CashRegisterModal';
import { ThermalReceiptModal } from '../../core/modals/pos-modal/ThermalReceiptModal';
import { ClothingExchangeModal } from '../../core/modals/pos-modal/ClothingExchangeModal';
import { usePosStore } from '../../core/posStore';
import { apiClient } from '../../core/apiClient';

const PosHeader = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    });

    const handleLogout = async (e) => {
        if (e) e.preventDefault();
        try {
            await apiClient.post("/auth/logout");
        } catch {
            // ignore
        }
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate(all_routes.signin);
    };

    const getPosAvatar = () => {
        if (!currentUser?.avatar) return "/assets/img/profiles/avator1.jpg";
        if (currentUser.avatar.startsWith("http://") || currentUser.avatar.startsWith("https://")) {
            return currentUser.avatar;
        }
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const backendOrigin = apiUrl.replace(/\/api\/?$/, "");
        return `${backendOrigin}${currentUser.avatar}`;
    };

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const lastSale = usePosStore((state) => state.lastCompletedSale);

    const toggleFullscreen = (elem) => {
        elem = elem || document.documentElement;
        if (
            !document.fullscreenElement &&
            !document.mozFullScreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement
        ) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(
                document.fullscreenElement ||
                document.mozFullScreenElement ||
                document.webkitFullscreenElement ||
                document.msFullscreenElement
            );
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("mozfullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.addEventListener("msfullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener(
                "mozfullscreenchange",
                handleFullscreenChange
            );
            document.removeEventListener(
                "webkitfullscreenchange",
                handleFullscreenChange
            );
            document.removeEventListener(
                "msfullscreenchange",
                handleFullscreenChange
            );
        };
    }, []);

    return (
        <>
            {/* Header */}
            <div className="header pos-header">
                {/* Logo */}
                <div className="header-left active">
                    <Link to={all_routes.newdashboard} className="logo logo-normal">
                        <ImageWithBasePath src="assets/img/logo.png" alt="Img" />
                    </Link>
                    <Link to={all_routes.newdashboard} className="logo logo-white">
                        <ImageWithBasePath src="assets/img/logo-white.png" alt="Img" />
                    </Link>
                    <Link to={all_routes.newdashboard} className="logo-small">
                        <ImageWithBasePath src="assets/img/logo-small.png" alt="Img" />
                    </Link>
                </div>
                {/* /Logo */}
                <Link id="mobile_btn" className="mobile_btn d-none" to="#sidebar">
                    <span className="bar-icon">
                        <span />
                        <span />
                        <span />
                    </span>
                </Link>
                {/* Header Menu */}
                <ul className="nav user-menu">
                    {/* Search */}
                    <li className="nav-item time-nav">
                        <span className="bg-teal text-white d-inline-flex align-items-center">
                            <ImageWithBasePath
                                src="assets/img/icons/clock-icon.svg"
                                alt="img"
                                className="me-2"
                            />
                            09:25:32
                        </span>
                    </li>
                    {/* /Search */}
                    <li className="nav-item pos-nav">
                        <Link
                            to={all_routes.newdashboard}
                            className="btn btn-purple btn-md d-inline-flex align-items-center"
                        >
                            <i className="ti ti-world me-1" />
                            Dashboard
                        </Link>
                    </li>

                    <li className="nav-item nav-item-box">
                        <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#calculator"
                            className="bg-orange border-orange text-white"
                        >
                            <i className="ti ti-calculator" />
                        </Link>
                    </li>
                    <li className="nav-item nav-item-box">
                        <Tooltip title='Maximize' placement='right'>
                            <Link
                                to="#"
                                id="btnFullscreen"
                                onClick={() => toggleFullscreen()}
                                className={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
                            >
                                <i className="ti ti-maximize" />
                            </Link>
                        </Tooltip>

                    </li>
                    <li
                        className="nav-item nav-item-box"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        data-bs-title="Cash Register"
                    >
                        <Tooltip title='Cash Register Shift' placement='right'>
                            <Link to="#" onClick={(e) => { e.preventDefault(); setShowRegisterModal(true); }}>
                                <i className="ti ti-cash" />
                            </Link>
                        </Tooltip>

                    </li>
                    <li
                        className="nav-item nav-item-box"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        data-bs-title="Clothing Exchange / Returns"
                    >
                        <Tooltip title='Clothing Exchange / Return' placement='right'>
                            <Link to="#" onClick={(e) => { e.preventDefault(); setShowExchangeModal(true); }}>
                                <i className="ti ti-repeat" />
                            </Link>
                        </Tooltip>

                    </li>
                    <li
                        className="nav-item nav-item-box"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        data-bs-title="Print Last Reciept"
                    >
                        <Tooltip title='Print Last Receipt (58mm/80mm)' placement='right'>
                            <Link to="#" onClick={(e) => { e.preventDefault(); setShowReceiptModal(true); }}>
                                <i className="ti ti-printer" />
                            </Link>
                        </Tooltip>

                    </li>
                    <li
                        className="nav-item nav-item-box"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        data-bs-title="Today’s Sale"
                    >
                    <Tooltip title='Today&apos;s Sale' placement='right'>
                        <Link to="#" data-bs-toggle="modal" data-bs-target="#today-sale">
                            <i className="ti ti-progress" />
                        </Link>
                        </Tooltip>
                    </li>
                    <li
                        className="nav-item nav-item-box"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        data-bs-title="Today’s Profit"
                    >
                    <Tooltip title='Today’s Profit' placement='right'>
                        <Link to="#" data-bs-toggle="modal" data-bs-target="#today-profit">
                            <i className="ti ti-chart-infographic" />
                        </Link>
                        </Tooltip>
                    </li>
                    <li
                        className="nav-item nav-item-box"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        data-bs-title="POS Settings"
                    >
                    <Tooltip title='POS Settings' placement='bottom'>
                        <Link to={all_routes.possettings}>
                            <i className="ti ti-settings" />
                        </Link>
                        </Tooltip>
                    </li>
                    <li className="nav-item dropdown has-arrow main-drop profile-nav">
                        <Link
                            to="#"
                            className="nav-link userset"
                            data-bs-toggle="dropdown"
                        >
                            <span className="user-info p-0">
                                <span className="user-letter">
                                    <img
                                        src={getPosAvatar()}
                                        alt="User Avatar"
                                        className="img-fluid rounded-circle"
                                        style={{ width: "36px", height: "36px", objectFit: "cover" }}
                                        onError={(e) => {
                                            e.currentTarget.src = "/assets/img/profiles/avator1.jpg";
                                        }}
                                    />
                                </span>
                            </span>
                        </Link>
                        <div className="dropdown-menu menu-drop-user">
                            <div className="profilename">
                                <div className="profileset">
                                    <span className="user-img">
                                        <img
                                            src={getPosAvatar()}
                                            alt="User Avatar"
                                            className="img-fluid rounded-circle"
                                            style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                            onError={(e) => {
                                                e.currentTarget.src = "/assets/img/profiles/avator1.jpg";
                                            }}
                                        />
                                        <span className="status online" />
                                    </span>
                                    <div className="profilesets">
                                        <h6>{currentUser?.name || "MR Bilal Admin"}</h6>
                                        <h5>{currentUser?.role || "Admin"}</h5>
                                    </div>
                                </div>
                                <hr className="m-0" />
                                <Link className="dropdown-item" to={all_routes.profile}>
                                    <User className="me-2"/>
                                    My Profile
                                </Link>
                                <Link className="dropdown-item" to={all_routes.generalsettings}>
                                    <Settings className="me-2"/>
                                    Settings
                                </Link>
                                <hr className="m-0" />
                                <Link className="dropdown-item logout pb-0" to="#" onClick={handleLogout}>
                                    <ImageWithBasePath
                                        src="assets/img/icons/log-out.svg"
                                        className="me-2"
                                        alt="img"
                                    />
                                    Logout
                                </Link>
                            </div>
                        </div>
                    </li>
                </ul>
                {/* /Header Menu */}
                {/* Mobile Menu */}
                <div className="dropdown mobile-user-menu">
                    <Link
                        to="#"
                        className="nav-link dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        <i className="fa fa-ellipsis-v" />
                    </Link>
                    <div className="dropdown-menu dropdown-menu-right">
                        <Link className="dropdown-item" to={all_routes.profile}>
                            My Profile
                        </Link>
                        <Link className="dropdown-item" to={all_routes.generalsettings}>
                            Settings
                        </Link>
                        <Link className="dropdown-item" to="#" onClick={handleLogout}>
                            Logout
                        </Link>
                    </div>
                </div>
                {/* /Mobile Menu */}
            </div>
            {/* Header */}

            {/* Shift Reconciliation Modal */}
            <CashRegisterModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
            />

            {/* Thermal Receipt 58mm / 80mm Modal */}
            <ThermalReceiptModal
                saleData={lastSale}
                onClose={() => setShowReceiptModal(false)}
            />

            {/* Clothing Size / Color Exchange Modal */}
            <ClothingExchangeModal
                isOpen={showExchangeModal}
                onClose={() => setShowExchangeModal(false)}
            />
        </>

    )
}

export default PosHeader
