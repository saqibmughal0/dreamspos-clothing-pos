import React from 'react'
import { Link } from 'react-router-dom'
import ImageWithBasePath from '../../../core/img/imagewithbasebath'
import { all_routes } from '../../../Router/all_routes'


const TwoColumnSidebar = () => {

    const route = all_routes;

    return (
        <>
            {/* Two Col Sidebar */}
            <div className="two-col-sidebar" id="two-col-sidebar">
                <div className="sidebar sidebar-twocol">
                    <div className="twocol-mini">
                        <div className="sidebar-left slimscroll">
                            <div
                                className="nav flex-column align-items-center nav-pills"
                                id="sidebar-tabs"
                                role="tablist"
                                aria-orientation="vertical"
                            >
                                <Link
                                    to="#"
                                    className="nav-link active"
                                    title="Dashboard"
                                    data-bs-toggle="tab"
                                    data-bs-target="#dashboard"
                                >
                                    <i className="ti ti-smart-home" />
                                </Link>
                                <Link
                                    to="#"
                                    className="nav-link"
                                    title="Inventory"
                                    data-bs-toggle="tab"
                                    data-bs-target="#inventory"
                                >
                                    <i className="ti ti-table-plus" />
                                </Link>
                                <Link
                                    to="#"
                                    className="nav-link"
                                    title="Stock"
                                    data-bs-toggle="tab"
                                    data-bs-target="#stock"
                                >
                                    <i className="ti ti-stack-3" />
                                </Link>
                                <Link
                                    to="#"
                                    className="nav-link"
                                    title="Sales"
                                    data-bs-toggle="tab"
                                    data-bs-target="#sales"
                                >
                                    <i className="ti ti-device-laptop" />
                                </Link>
                                <Link
                                    to="#"
                                    className="nav-link"
                                    title="Finance"
                                    data-bs-toggle="tab"
                                    data-bs-target="#finance"
                                >
                                    <i className="ti ti-shopping-cart-dollar" />
                                </Link>
                                <Link
                                    to="#"
                                    className="nav-link"
                                    title="Hrm"
                                    data-bs-toggle="tab"
                                    data-bs-target="#hrm"
                                >
                                    <i className="ti ti-cash" />
                                </Link>
                                <Link
                                    to="#"
                                    className="nav-link"
                                    title="Reports"
                                    data-bs-toggle="tab"
                                    data-bs-target="#reports"
                                >
                                    <i className="ti ti-license" />
                                </Link>
                                <Link
                                    to="#"
                                    className="nav-link"
                                    title="User Management"
                                    data-bs-toggle="tab"
                                    data-bs-target="#pages"
                                >
                                    <i className="ti ti-shield-up" />
                                </Link>
                                <Link
                                    to="#"
                                    className="nav-link"
                                    title="Settings"
                                    data-bs-toggle="tab"
                                    data-bs-target="#settings"
                                >
                                    <i className="ti ti-lock-check" />
                                </Link>

                                <Link
                                    to="#"
                                    className="nav-link"
                                    title="Extras"
                                    data-bs-toggle="tab"
                                    data-bs-target="#extras"
                                >
                                    <i className="ti ti-vector-triangle" />
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="sidebar-right">
                        <>
                            {/* Logo */}
                            <div className="sidebar-logo">
                                <Link to={route.newdashboard} className="logo logo-normal">
                                    <ImageWithBasePath src="assets/img/logo.svg" alt="Img" />
                                </Link>
                                <Link to={route.newdashboard} className="logo logo-white">
                                    <ImageWithBasePath src="assets/img/logo-white.svg" alt="Img" />
                                </Link>
                                <Link to={route.newdashboard} className="logo-small">
                                    <ImageWithBasePath src="assets/img/logo-small.png" alt="Img" />
                                </Link>
                            </div>
                            {/* /Logo */}
                        </>

                        <div className="sidebar-scroll">
                            <div className="text-center rounded bg-light p-3 mb-3 user-profile">
                                <div className="avatar avatar-lg online mb-3">
                                    <ImageWithBasePath
                                        src="assets/img/customer/customer15.jpg"
                                        alt="Img"
                                        className="img-fluid rounded-circle"
                                    />
                                </div>
                                <h6 className="fs-12 fw-bold mb-1">Adrian Herman</h6>
                                <p className="fs-10 mb-0">System Admin</p>
                            </div>
                            <div className="tab-content" id="v-pills-tabContent">
                                <div className="tab-pane fade show active" id="dashboard">
                                    <ul>
                                        <li className="menu-title">
                                            <span>MAIN</span>
                                        </li>
                                        <li>
                                            <Link to={route.newdashboard} className="active">
                                                Dashboard
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="inventory">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Inventory</span>
                                        </li>
                                        <li>
                                            <Link to={route.productlist}>
                                                <span>Products</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.addproduct}>
                                                <span>Create Product</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.expiredproduct}>
                                                <span>Expired Products</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.lowstock}>
                                                <span>Low Stocks</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.categorylist}>
                                                <span>Category</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.subcategories}>
                                                <span>Sub Category</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.brandlist}>
                                                <span>Brands</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.units}>
                                                <span>Units</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.variantattributes}>
                                                <span>Variant Attributes</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.warranty}>
                                                <span>Warranties</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.barcode}>
                                                <span>Print Barcode</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.qrcode}>
                                                <span>Print QR Code</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="stock">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Stock</span>
                                        </li>
                                        <li>
                                            <Link to={route.managestock}>
                                                <span>Manage Stock</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.stockadjustment}>
                                                <span>Stock Adjustment</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.stocktransfer}>
                                                <span>Stock Transfer</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="sales">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Sales</span>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Sales</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.onlineorder}>Online Orders</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.posorder}>POS Orders</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link to={route.invoice}>
                                                <span>Invoices</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.salesreturn}>
                                                <span>Sales Return</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.quotationlist}>
                                                <span>Quotation</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.pos}>
                                                <span>POS</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="finance">
                                    <ul>
                                        <li className="menu-title">
                                            <span>FINANCE &amp; ACCOUNTS</span>
                                        </li>
                                        <li>
                                            <Link to={route.coupons}>
                                                <span>Coupons</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.GiftCard}>
                                                <span>Gift Cards</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Discount</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.discountPlan}>Discount Plan</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.discount}>Discount</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link to={route.purchaselist}>
                                                <span>Purchases</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.purchaseorderreport}>
                                                <span>Purchase Order</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.purchasereturn}>
                                                <span>Purchase Return</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Expenses</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.expenselist}>Expenses</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.expensecategory}>Expense Category</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Income</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.incomelist}>Income</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.incomecategory}>Income Category</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link to={route.accountlist}>
                                                <span>Bank Accounts</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.moneytransfer}>
                                                <span>Money Transfer</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.balancesheet}>
                                                <span>Balance Sheet</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.trailbalance}>
                                                <span>Trial Balance</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.cashflow}>
                                                <span>Cash Flow</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.accountstatement}>
                                                <span>Account Statement</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.customer}>
                                                <span>Customers</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.biller}>
                                                <span>Billers</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.suppliers}>
                                                <span>Suppliers</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.storelist}>
                                                <span>Stores</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.warehouses}>
                                                <span>Warehouses</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="hrm">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Hrm</span>
                                        </li>
                                        <li>
                                            <Link to={route.employeegrid}>
                                                <span>Employees</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.departmentgrid}>
                                                <span>Departments</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.designation}>
                                                <span>Designation</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.shift}>
                                                <span>Shifts</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Attendence</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.attendanceemployee}>Employee</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.attendanceadmin}>Admin</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Leaves</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.leavesadmin}>Admin Leaves</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.leavesemployee}>Employee Leaves</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.leavestype}>Leave Types</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link to={route.holidays}>
                                                <span>Holidays</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Payroll</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.payrollList}>Employee Salary</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.payslip}>Payslip</Link>
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="reports">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Reports</span>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Sales Report</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.salereport}>Sales Report</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.bestseller}>Best Seller</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link to={route.purchasereport}>
                                                <span>Purchase report</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Inventory Report</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.inventoryreport}>Inventory Report</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.stockhistory}>Stock History</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.soldstock}>Sold Stock</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link to={route.invoicereport}>
                                                <span>Invoice Report</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Supplier Report</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.supplierreport}>Supplier Report</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.supplierduereport}>Supplier Due Report</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Customer Report</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.customerreport}>Customer Report</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.customerduereport}>Customer Due Report</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Product Report</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.product}>Product Report</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.productexpiredreport}>
                                                        Product Expiry Report
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to={route.productquantityreport}>
                                                        Product Quantity Alert
                                                    </Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link to={route.expensereport}>
                                                <span>Expense Report</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.incomereport}>
                                                <span>Income Report</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.taxreport}>
                                                <span>Tax Report</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.profitloss}>
                                                <span>Profit &amp; Loss</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.annualreport}>
                                                <span>Annual Report</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="pages">
                                    <ul>
                                        <li className="menu-title">
                                            <span>User Management</span>
                                        </li>
                                        <li>
                                            <Link to={route.users}>
                                                <span>Users</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.rolespermission}>
                                                <span>Roles &amp; Permissions</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to={route.deleteaccount}>
                                                <span>Delete Account Request</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="settings">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Settings</span>
                                        </li>
                                        <li>
                                            <Link to={route.profile}>
                                                <span>Profile</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>General Settings</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.generalsettings}>Profile</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.securitysettings}>Security</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.notification}>Notifications</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.connectedapps}>Connected Apps</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Website Settings</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.systemsettings}>System Settings</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.companysettings}>Company Settings </Link>
                                                </li>
                                                <li>
                                                    <Link to={route.localizationsettings}>Localization</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.prefixes}>Prefixes</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.preference}>Preference</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.appearance}>Appearance</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.socialauthendication}>
                                                        Social Authentication
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to={route.languagesettings}>Language</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>App Settings</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li className="submenu submenu-two">
                                                    <Link to="#">
                                                        Invoice
                                                        <span className="menu-arrow inside-submenu" />
                                                    </Link>
                                                    <ul>
                                                        <li>
                                                            <Link to={route.invoicesettings}>Invoice Settings</Link>
                                                        </li>
                                                        <li>
                                                            <Link to={route.invoice}>Invoice Template</Link>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    <Link to={route.printersettings}>Printer</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.possettings}>POS</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.customfields}>Custom Fields</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>System Settings</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li className="submenu submenu-two">
                                                    <Link to="#">
                                                        Email
                                                        <span className="menu-arrow inside-submenu" />
                                                    </Link>
                                                    <ul>
                                                        <li>
                                                            <Link to={route.emailsettings}>Email Settings</Link>
                                                        </li>
                                                        <li>
                                                            <Link to={route.email}>Email Template</Link>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li className="submenu submenu-two">
                                                    <Link to="#">
                                                        SMS
                                                        <span className="menu-arrow inside-submenu" />
                                                    </Link>
                                                    <ul>
                                                        <li>
                                                            <Link to={route.smssettings}>SMS Settings</Link>
                                                        </li>
                                                        <li>
                                                            <Link to={route.smstemplate}>SMS Template</Link>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    <Link to={route.otpsettings}>OTP</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.gdbrsettings}>GDPR Cookies</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Financial Settings</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to="payment-gateway-settings.html">
                                                        Payment Gateway
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to={route.bankaccounts}>Bank Accounts</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.taxrates}>Tax Rates</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.currencysettings}>Currencies</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Other Settings</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to={route.storagesettings}>Storage</Link>
                                                </li>
                                                <li>
                                                    <Link to={route.banipaddress}>Ban IP Address</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link to={route.signin}>
                                                <span>Logout</span>{" "}
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="extras">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Help</span>
                                        </li>
                                        <li>
                                            <Link to="#">
                                                <span>Documentation</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="#">
                                                <span>Changelog v2.0.9</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link to="#">
                                                <span>Multi Level</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link to="#">Level 1.1</Link>
                                                </li>
                                                <li className="submenu submenu-two">
                                                    <Link to="#">
                                                        Level 1.2
                                                        <span className="menu-arrow inside-submenu" />
                                                    </Link>
                                                    <ul>
                                                        <li>
                                                            <Link to="#">Level 2.1</Link>
                                                        </li>
                                                        <li className="submenu submenu-two submenu-three">
                                                            <Link to="#">
                                                                Level 2.2
                                                                <span className="menu-arrow inside-submenu inside-submenu-two" />
                                                            </Link>
                                                            <ul>
                                                                <li>
                                                                    <Link to="#">Level 3.1</Link>
                                                                </li>
                                                                <li>
                                                                    <Link to="#">Level 3.2</Link>
                                                                </li>
                                                            </ul>
                                                        </li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Two Col Sidebar */}
        </>

    )
}

export default TwoColumnSidebar