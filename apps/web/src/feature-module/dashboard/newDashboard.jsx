import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import "bootstrap-daterangepicker/daterangepicker.css";
import Chart from "react-apexcharts";
import ReactApexChart from 'react-apexcharts';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { all_routes } from '../../Router/all_routes';
import PredefinedDateRanges from '../../core/common/range-picker/datePicker';
import { apiClient } from '../../core/apiClient';
import ErrorBoundary from '../../core/common/errorBoundary/ErrorBoundary';
import { formatCurrency } from '../../core/utils/businessSettings';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const EMPTY_OVERVIEW = {
    period: '1Y',
    kpis: {
        totalSales: 0,
        totalSalesReturns: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        profit: 0,
        invoiceDue: 0,
        paymentReturns: 0,
        changes: {
            salesPct: 0,
            salesReturnPct: 0,
            purchasePct: 0,
            expensePct: 0,
            profitPct: 0,
            invoiceDuePct: 0,
            paymentReturnPct: 0,
        },
    },
    salesAndPurchaseChart: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        sales: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        purchase: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        totalSales: 0,
        totalPurchase: 0,
    },
    overallInfo: { suppliersCount: 0, customersCount: 0, ordersCount: 0 },
    customersOverview: { firstTimeCount: 0, returnCount: 0, firstTimePct: 0, returnPct: 0 },
    topSellingProducts: [],
    lowStockProducts: [],
    lowStockTotalCount: 0,
    recentSales: [],
    salesStatistics: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        revenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        expenses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        totalRevenue: 0,
        totalExpenses: 0,
        revenueChangePct: 0,
        expensesChangePct: 0,
    },
    recentTransactions: { all: [], sales: [], purchase: [], expenses: [] },
    topCustomers: [],
    topCategories: [],
    catalogSummary: { totalCategoriesCount: 0, totalProductsCount: 0 },
    orderHeatmap: [
        { name: '8 Am', data: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => ({ x, y: 0 })) },
        { name: '10 Am', data: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => ({ x, y: 0 })) },
        { name: '12 Pm', data: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => ({ x, y: 0 })) },
        { name: '2 Pm', data: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => ({ x, y: 0 })) },
        { name: '4 Pm', data: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => ({ x, y: 0 })) },
        { name: '6 Pm', data: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => ({ x, y: 0 })) },
        { name: '8 Pm', data: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => ({ x, y: 0 })) },
    ],
};

const formatRs = (val) =>
    `Rs ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const formatPctBadge = (pct) => {
    const val = Number(pct || 0);
    const isUp = val >= 0;
    return (
        <span className={`badge ${isUp ? 'bg-white text-success' : 'bg-white text-danger'} fw-medium fs-10`}>
            {isUp ? '+' : ''}{val}%
        </span>
    );
};

const formatSoftPct = (pct) => {
    const val = Number(pct || 0);
    const isUp = val >= 0;
    return (
        <span className={isUp ? 'text-success' : 'text-danger'}>
            {isUp ? '+' : ''}{val}%
        </span>
    );
};

const PERIOD_LABELS = {
    '1D': 'Today',
    '1W': 'Weekly',
    '1M': 'Monthly',
    '3M': '3 Months',
    '6M': '6 Months',
    '1Y': 'Yearly',
};

const NewDashboard = () => {
    const route = all_routes;
    const [overview, setOverview] = useState(EMPTY_OVERVIEW);
    const [businessSettings, setBusinessSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('1Y');
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [alertDismissed, setAlertDismissed] = useState(false);

    useEffect(() => {
        apiClient.get('/settings')
            .then((res) => {
                if (res.data?.success && res.data.data) {
                    setBusinessSettings(res.data.data);
                }
            })
            .catch(() => {
                // Fallback gracefully
            });
    }, []);

    const fmtMoney = (val) =>
        formatCurrency(val, businessSettings?.currency, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const fetchDashboardData = useCallback(async (activePeriod, start, end) => {
        setLoading(true);
        setError(null);
        try {
            const params = { period: activePeriod };
            if (start && end) {
                params.startDate = start;
                params.endDate = end;
            }
            const res = await apiClient.get('/dashboard/overview', { params });
            if (res.data?.success && res.data.data) {
                setOverview(res.data.data);
            } else {
                setOverview(EMPTY_OVERVIEW);
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard data from server.');
            setOverview(EMPTY_OVERVIEW);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData(period, dateRange.startDate, dateRange.endDate);
    }, [period, dateRange, fetchDashboardData]);

    const handleDateRangeChange = (start, end) => {
        setDateRange({
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        });
    };

    const handlePeriodSelect = (p) => {
        setDateRange({ startDate: null, endDate: null });
        setPeriod(p);
    };

    const { kpis, salesAndPurchaseChart, overallInfo, customersOverview, topSellingProducts, lowStockProducts, lowStockTotalCount, recentSales, salesStatistics, recentTransactions, topCustomers, topCategories, catalogSummary, orderHeatmap } = overview;

    // 1. Sales & Purchase Chart Options
    const salesDayChart = {
        chart: { height: 245, type: "bar", stacked: true, toolbar: { show: false } },
        colors: ["#FE9F43", "#FFE3CB"],
        plotOptions: { bar: { borderRadius: 8, borderRadiusWhenStacked: "all", horizontal: false } },
        series: [
            { name: "Sales", data: salesAndPurchaseChart.sales },
            { name: "Purchase", data: salesAndPurchaseChart.purchase },
        ],
        xaxis: {
            categories: salesAndPurchaseChart.categories,
            labels: { style: { colors: "#6B7280", fontSize: "12px" } },
        },
        yaxis: {
            labels: {
                formatter: (val) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : `${val}`,
                offsetX: -10,
                style: { colors: "#6B7280", fontSize: "12px" },
            },
        },
        grid: { borderColor: "#E5E7EB", strokeDashArray: 5 },
        legend: { show: false },
        dataLabels: { enabled: false },
        fill: { opacity: 1 },
    };

    // 2. Customers Overview Radial Chart
    const customerChartOptions = {
        chart: { type: "radialBar", height: 130, width: "100%", parentHeightOffset: 0, toolbar: { show: false } },
        plotOptions: {
            radialBar: {
                hollow: { margin: 10, size: "30%" },
                track: { background: "#E6EAED", strokeWidth: "100%", margin: 5 },
                dataLabels: { name: { offsetY: -5 }, value: { offsetY: 5 } },
            },
        },
        stroke: { lineCap: "round" },
        colors: ["#E04F16", "#0E9384"],
        labels: ["First Time", "Return"],
    };
    const customerSeries = [customersOverview.firstTimePct, customersOverview.returnPct];

    // 3. Sales Statistics Chart
    const salesStatOptions = {
        series: [
            { name: 'Revenue', data: salesStatistics.revenue },
            { name: 'Expenses', data: salesStatistics.expenses },
        ],
        colors: ['#0E9384', '#E04F16'],
        chart: { type: 'bar', height: 290, stacked: true, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: false, columnWidth: '45%', borderRadius: 4 } },
        dataLabels: { enabled: false },
        yaxis: {
            labels: {
                formatter: (val) => Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(1)}K` : `${val}`,
            },
        },
        xaxis: { categories: salesStatistics.categories },
        legend: { show: false },
    };

    // 4. Top Categories Doughnut Chart
    const catColors = ['#092C4C', '#FE9F43', '#E04F16', '#0E9384', '#3550DC'];
    const categoryDoughnutData = {
        labels: topCategories.length > 0 ? topCategories.map(c => c.name) : ['No Sales'],
        datasets: [
            {
                data: topCategories.length > 0 ? topCategories.map(c => c.revenue) : [1],
                backgroundColor: topCategories.length > 0 ? topCategories.map((_, i) => catColors[i % catColors.length]) : ['#E5E7EB'],
                borderWidth: 0,
            },
        ],
    };
    const categoryDoughnutOptions = {
        cutout: '65%',
        plugins: { legend: { display: false } },
        maintainAspectRatio: false,
    };

    // 5. Order Statistics Heatmap
    const heatmapOptions = {
        chart: { height: 320, type: 'heatmap', toolbar: { show: false } },
        dataLabels: { enabled: false },
        colors: ['#FE9F43'],
        plotOptions: {
            heatmap: {
                shadeIntensity: 0.5,
                colorScale: {
                    ranges: [
                        { from: 0, to: 0, color: '#F3F4F6', name: '0' },
                        { from: 1, to: 5, color: '#FFE3CB', name: '1-5' },
                        { from: 6, to: 20, color: '#FE9F43', name: '6-20' },
                        { from: 21, to: 1000, color: '#E04F16', name: '20+' },
                    ],
                },
            },
        },
        series: orderHeatmap,
    };

    return (
        <div>
            <div className="page-wrapper">
                <div className="content">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
                        <div className="mb-3">
                            <h1 className="mb-1">Welcome to MR. BILAL</h1>
                            <p className="fw-medium">
                                Live Store Overview &bull; {overallInfo.ordersCount} Orders ({PERIOD_LABELS[period] || 'Selected Range'})
                            </p>
                        </div>
                        <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                            <div className="btn-group" role="group" aria-label="Period filter">
                                {['1D', '1W', '1M', '1Y'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        className={`btn btn-sm ${period === p && !dateRange.startDate ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => handlePeriodSelect(p)}
                                    >
                                        {PERIOD_LABELS[p]}
                                    </button>
                                ))}
                            </div>
                            <div className="input-icon-start position-relative">
                                <span className="input-icon-addon fs-16 text-gray-9">
                                    <i className="ti ti-calendar" />
                                </span>
                                <PredefinedDateRanges onDateRangeChange={handleDateRangeChange} />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4" role="alert">
                            <div>
                                <i className="ti ti-alert-triangle me-2" />
                                <strong>Dashboard Error:</strong> {error}
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => fetchDashboardData(period, dateRange.startDate, dateRange.endDate)}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!alertDismissed && lowStockTotalCount > 0 && (
                        <div className="alert bg-orange-transparent alert-dismissible fade show mb-4">
                            <div>
                                <span><i className="ti ti-info-circle fs-14 text-orange me-2" />Your Inventory </span>
                                <span className="text-orange fw-semibold">{lowStockTotalCount} product(s) are running low,</span> check stock levels,
                                <Link to={route.lowstock} className="link-orange text-decoration-underline fw-semibold ms-1">
                                    View Low Stock
                                </Link>
                            </div>
                            <button
                                type="button"
                                className="btn-close text-gray-9 fs-14"
                                onClick={() => setAlertDismissed(true)}
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                    )}

                    {/* Top 4 KPI Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-sm-6 col-12 d-flex">
                            <div className="card bg-primary sale-widget flex-fill">
                                <div className="card-body d-flex align-items-center">
                                    <span className="sale-icon bg-white text-primary">
                                        <i className="ti ti-file-text fs-24" />
                                    </span>
                                    <div className="ms-2">
                                        <p className="text-white mb-1">Total Sales</p>
                                        <div className="d-inline-flex align-items-center flex-wrap gap-2">
                                            <h4 className="text-white">{loading ? '...' : fmtMoney(kpis.totalSales)}</h4>
                                            {formatPctBadge(kpis.changes.salesPct)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-sm-6 col-12 d-flex">
                            <div className="card bg-secondary sale-widget flex-fill">
                                <div className="card-body d-flex align-items-center">
                                    <span className="sale-icon bg-white text-secondary">
                                        <i className="ti ti-repeat fs-24" />
                                    </span>
                                    <div className="ms-2">
                                        <p className="text-white mb-1">Total Sales Return</p>
                                        <div className="d-inline-flex align-items-center flex-wrap gap-2">
                                            <h4 className="text-white">{loading ? '...' : fmtMoney(kpis.totalSalesReturns)}</h4>
                                            {formatPctBadge(kpis.changes.salesReturnPct)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-sm-6 col-12 d-flex">
                            <div className="card bg-teal sale-widget flex-fill">
                                <div className="card-body d-flex align-items-center">
                                    <span className="sale-icon bg-white text-teal">
                                        <i className="ti ti-gift fs-24" />
                                    </span>
                                    <div className="ms-2">
                                        <p className="text-white mb-1">Total Purchase</p>
                                        <div className="d-inline-flex align-items-center flex-wrap gap-2">
                                            <h4 className="text-white">{loading ? '...' : fmtMoney(kpis.totalPurchases)}</h4>
                                            {formatPctBadge(kpis.changes.purchasePct)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-sm-6 col-12 d-flex">
                            <div className="card bg-info sale-widget flex-fill">
                                <div className="card-body d-flex align-items-center">
                                    <span className="sale-icon bg-white text-info">
                                        <i className="ti ti-brand-pocket fs-24" />
                                    </span>
                                    <div className="ms-2">
                                        <p className="text-white mb-1">Total Expenses</p>
                                        <div className="d-inline-flex align-items-center flex-wrap gap-2">
                                            <h4 className="text-white">{loading ? '...' : fmtMoney(kpis.totalExpenses)}</h4>
                                            {formatPctBadge(kpis.changes.expensePct)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Second Row: Profit, Invoice Due, Total Expenses, Total Payment Returns */}
                    <div className="row">
                        <div className="col-xl-3 col-sm-6 col-12 d-flex">
                            <div className="card revenue-widget flex-fill">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                                        <div>
                                            <h4 className="mb-1">{fmtMoney(kpis.profit)}</h4>
                                            <p>Profit</p>
                                        </div>
                                        <span className="revenue-icon bg-cyan-transparent text-cyan">
                                            <i className="ti ti-layers-intersect fs-16" />
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <p className="mb-0">{formatSoftPct(kpis.changes.profitPct)} vs prev period</p>
                                        <Link to={route.profitandloss} className="text-decoration-underline fs-13 fw-medium">View All</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-sm-6 col-12 d-flex">
                            <div className="card revenue-widget flex-fill">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                                        <div>
                                            <h4 className="mb-1">{fmtMoney(kpis.invoiceDue)}</h4>
                                            <p>Invoice Due</p>
                                        </div>
                                        <span className="revenue-icon bg-teal-transparent text-teal">
                                            <i className="ti ti-chart-pie fs-16" />
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <p className="mb-0">{formatSoftPct(kpis.changes.invoiceDuePct)} vs prev period</p>
                                        <Link to={route.invoicereportnew} className="text-decoration-underline fs-13 fw-medium">View All</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-sm-6 col-12 d-flex">
                            <div className="card revenue-widget flex-fill">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                                        <div>
                                            <h4 className="mb-1">{fmtMoney(kpis.totalExpenses)}</h4>
                                            <p>Total Expenses</p>
                                        </div>
                                        <span className="revenue-icon bg-orange-transparent text-orange">
                                            <i className="ti ti-lifebuoy fs-16" />
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <p className="mb-0">{formatSoftPct(kpis.changes.expensePct)} vs prev period</p>
                                        <Link to={route.expenselist} className="text-decoration-underline fs-13 fw-medium">View All</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-sm-6 col-12 d-flex">
                            <div className="card revenue-widget flex-fill">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                                        <div>
                                            <h4 className="mb-1">{fmtMoney(kpis.paymentReturns)}</h4>
                                            <p>Total Payment Returns</p>
                                        </div>
                                        <span className="revenue-icon bg-indigo-transparent text-indigo">
                                            <i className="ti ti-hash fs-16" />
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <p className="mb-0">{formatSoftPct(kpis.changes.paymentReturnPct)} vs prev period</p>
                                        <Link to={route.purchasereturn} className="text-decoration-underline fs-13 fw-medium">View All</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales & Purchase Chart + Overall Information */}
                    <div className="row">
                        <div className="col-xxl-8 col-xl-7 col-sm-12 col-12 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <div className="d-inline-flex align-items-center">
                                        <span className="title-icon bg-soft-primary fs-16 me-2">
                                            <i className="ti ti-shopping-cart" />
                                        </span>
                                        <h5 className="card-title mb-0">Sales &amp; Purchase</h5>
                                    </div>
                                    <ul className="nav btn-group custom-btn-group">
                                        {['1D', '1W', '1M', '3M', '6M', '1Y'].map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                className={`btn btn-outline-light ${period === p ? 'active' : ''}`}
                                                onClick={() => handlePeriodSelect(p)}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </ul>
                                </div>
                                <div className="card-body pb-0">
                                    <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                                        <div className="border p-2 br-8">
                                            <span className="d-inline-flex align-items-center fs-13">
                                                <i className="ti ti-point-filled text-primary-light fs-16 me-1" />
                                                Total Purchase
                                            </span>
                                            <h4>{fmtMoney(salesAndPurchaseChart.totalPurchase)}</h4>
                                        </div>
                                        <div className="border p-2 br-8">
                                            <span className="d-inline-flex align-items-center fs-13">
                                                <i className="ti ti-point-filled text-primary fs-16 me-1" />
                                                Total Sales
                                            </span>
                                            <h4>{fmtMoney(salesAndPurchaseChart.totalSales)}</h4>
                                        </div>
                                    </div>
                                    <ErrorBoundary compact widgetName="Sales & Purchase Chart">
                                        <div id="sales-daychart">
                                            <Chart options={salesDayChart} series={salesDayChart.series} type="bar" height={245} />
                                        </div>
                                    </ErrorBoundary>
                                </div>
                            </div>
                        </div>

                        <div className="col-xxl-4 col-xl-5 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header">
                                    <div className="d-inline-flex align-items-center">
                                        <span className="title-icon bg-soft-info fs-16 me-2">
                                            <i className="ti ti-info-circle" />
                                        </span>
                                        <h5 className="card-title mb-0">Overall Information</h5>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <div className="info-item border bg-light p-3 text-center">
                                                <div className="mb-3 text-info fs-24"><i className="ti ti-user-check" /></div>
                                                <p className="mb-1">Suppliers</p>
                                                <h5>{overallInfo.suppliersCount}</h5>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="info-item border bg-light p-3 text-center">
                                                <div className="mb-3 text-orange fs-24"><i className="ti ti-users" /></div>
                                                <p className="mb-1">Customers</p>
                                                <h5>{overallInfo.customersCount}</h5>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="info-item border bg-light p-3 text-center">
                                                <div className="mb-3 text-teal fs-24"><i className="ti ti-shopping-cart" /></div>
                                                <p className="mb-1">Orders</p>
                                                <h5>{overallInfo.ordersCount}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-footer pb-sm-0">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                        <h6>Customers Overview</h6>
                                    </div>
                                    <div className="row align-items-center">
                                        <div className="col-sm-5">
                                            <ErrorBoundary compact widgetName="Customer Chart">
                                                <Chart options={customerChartOptions} series={customerSeries} type="radialBar" height={150} />
                                            </ErrorBoundary>
                                        </div>
                                        <div className="col-sm-7">
                                            <div className="row gx-0">
                                                <div className="col-6">
                                                    <div className="text-center border-end">
                                                        <h2 className="mb-1">{customersOverview.firstTimeCount}</h2>
                                                        <p className="text-orange mb-2">First Time</p>
                                                        <span className="badge badge-soft-secondary badge-xs">{customersOverview.firstTimePct}%</span>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="text-center">
                                                        <h2 className="mb-1">{customersOverview.returnCount}</h2>
                                                        <p className="text-teal mb-2">Return</p>
                                                        <span className="badge badge-soft-success badge-xs">{customersOverview.returnPct}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Selling Products | Low Stock Products | Recent Sales */}
                    <div className="row">
                        <div className="col-xxl-4 col-md-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div className="d-inline-flex align-items-center">
                                        <span className="title-icon bg-soft-pink fs-16 me-2"><i className="ti ti-box" /></span>
                                        <h5 className="card-title mb-0">Top Selling Products</h5>
                                    </div>
                                    <Link to={route.bestseller} className="fs-13 fw-medium text-decoration-underline">View All</Link>
                                </div>
                                <div className="card-body">
                                    {topSellingProducts.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            <i className="ti ti-package-off fs-32 d-block mb-2" />
                                            No sales recorded in this period.
                                        </div>
                                    ) : (
                                        topSellingProducts.map((p, idx) => (
                                            <div key={p.id} className={`d-flex align-items-center justify-content-between ${idx < topSellingProducts.length - 1 ? 'border-bottom pb-3 mb-3' : ''}`}>
                                                <div className="d-flex align-items-center">
                                                    <span className="avatar avatar-md bg-light text-primary fw-bold me-2">
                                                        {p.name?.charAt(0) || 'P'}
                                                    </span>
                                                    <div>
                                                        <h6 className="fw-bold mb-1">
                                                            <Link to={route.productlist}>{p.name}</Link>
                                                        </h6>
                                                        <div className="d-flex align-items-center gap-2 fs-13 text-muted">
                                                            <span>{fmtMoney(p.price)}</span>
                                                            <span>&bull;</span>
                                                            <span>{p.unitsSold} Sold</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="badge bg-outline-success badge-xs">{fmtMoney(p.revenue)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-xxl-4 col-md-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div className="d-inline-flex align-items-center">
                                        <span className="title-icon bg-soft-danger fs-16 me-2"><i className="ti ti-alert-triangle" /></span>
                                        <h5 className="card-title mb-0">Low Stock Products</h5>
                                    </div>
                                    <Link to={route.lowstock} className="fs-13 fw-medium text-decoration-underline">View All</Link>
                                </div>
                                <div className="card-body">
                                    {lowStockProducts.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            <i className="ti ti-circle-check fs-32 text-success d-block mb-2" />
                                            All active products have healthy stock.
                                        </div>
                                    ) : (
                                        lowStockProducts.map((p, idx) => (
                                            <div key={p.id} className={`d-flex align-items-center justify-content-between ${idx < lowStockProducts.length - 1 ? 'mb-3 pb-3 border-bottom' : ''}`}>
                                                <div className="d-flex align-items-center">
                                                    <span className="avatar avatar-md bg-light text-warning fw-bold me-2">
                                                        {p.name?.charAt(0) || 'L'}
                                                    </span>
                                                    <div>
                                                        <h6 className="fw-bold mb-1">
                                                            <Link to={route.lowstock}>{p.name}</Link>
                                                        </h6>
                                                        <p className="fs-12 text-muted mb-0">SKU: {p.sku}</p>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <p className="fs-12 mb-0 text-muted">In Stock</p>
                                                    <p className={`fs-14 fw-bold mb-0 ${p.stockQty <= 0 ? 'text-danger' : 'text-orange'}`}>
                                                        {p.stockQty}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-xxl-4 col-md-12 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div className="d-inline-flex align-items-center">
                                        <span className="title-icon bg-soft-teal fs-16 me-2"><i className="ti ti-receipt" /></span>
                                        <h5 className="card-title mb-0">Recent Sales</h5>
                                    </div>
                                    <Link to={route.saleslist} className="fs-13 fw-medium text-decoration-underline">View All</Link>
                                </div>
                                <div className="card-body">
                                    {recentSales.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            <i className="ti ti-receipt-off fs-32 d-block mb-2" />
                                            No sales recorded yet.
                                        </div>
                                    ) : (
                                        recentSales.map((s, idx) => (
                                            <div key={s.id} className={`d-flex align-items-center justify-content-between ${idx < recentSales.length - 1 ? 'mb-3 pb-3 border-bottom' : ''}`}>
                                                <div>
                                                    <h6 className="fw-bold mb-1">{s.itemName}</h6>
                                                    <div className="d-flex align-items-center gap-2 fs-12 text-muted">
                                                        <span>{s.categoryName}</span>
                                                        <span>&bull;</span>
                                                        <span>{fmtMoney(s.totalAmount)}</span>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <p className="fs-12 text-muted mb-1">{new Date(s.date).toLocaleDateString('en-PK')}</p>
                                                    <span className={`badge badge-xs ${s.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'}`}>
                                                        {s.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Statistics + Recent Transactions */}
                    <div className="row">
                        <div className="col-xl-6 col-sm-12 col-12 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div className="d-inline-flex align-items-center">
                                        <span className="title-icon bg-soft-danger fs-16 me-2"><i className="ti ti-alert-triangle" /></span>
                                        <h5 className="card-title mb-0">Sales Statistics</h5>
                                    </div>
                                    <span className="badge bg-light text-dark">{PERIOD_LABELS[period] || 'Range'}</span>
                                </div>
                                <div className="card-body pb-0">
                                    <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                                        <div className="border p-2 br-8">
                                            <h5 className="d-inline-flex align-items-center text-teal">
                                                {fmtMoney(salesStatistics.totalRevenue)}
                                                <span className="badge badge-success badge-xs d-inline-flex align-items-center ms-2">
                                                    {salesStatistics.revenueChangePct >= 0 ? '+' : ''}{salesStatistics.revenueChangePct}%
                                                </span>
                                            </h5>
                                            <p className="mb-0">Revenue</p>
                                        </div>
                                        <div className="border p-2 br-8">
                                            <h5 className="d-inline-flex align-items-center text-orange">
                                                {fmtMoney(salesStatistics.totalExpenses)}
                                                <span className="badge badge-danger badge-xs d-inline-flex align-items-center ms-2">
                                                    {salesStatistics.expensesChangePct >= 0 ? '+' : ''}{salesStatistics.expensesChangePct}%
                                                </span>
                                            </h5>
                                            <p className="mb-0">Expense</p>
                                        </div>
                                    </div>
                                    <ErrorBoundary compact widgetName="Sales Statistics Chart">
                                        <div id="sales-statistics">
                                            <ReactApexChart options={salesStatOptions} series={salesStatOptions.series} type="bar" height={290} />
                                        </div>
                                    </ErrorBoundary>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-6 col-sm-12 col-12 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-3">
                                    <div className="d-inline-flex align-items-center">
                                        <span className="title-icon bg-soft-orange fs-16 me-2"><i className="ti ti-flag" /></span>
                                        <h5 className="card-title mb-0">Recent Transactions</h5>
                                    </div>
                                    <Link to={route.saleslist} className="fs-13 fw-medium text-decoration-underline">View All</Link>
                                </div>
                                <div className="card-body p-0">
                                    <ul className="nav nav-tabs nav-justified transaction-tab">
                                        <li className="nav-item"><a className="nav-link active" href="#tx-all" data-bs-toggle="tab">All</a></li>
                                        <li className="nav-item"><a className="nav-link" href="#tx-sales" data-bs-toggle="tab">Sale</a></li>
                                        <li className="nav-item"><a className="nav-link" href="#tx-purchase" data-bs-toggle="tab">Purchase</a></li>
                                        <li className="nav-item"><a className="nav-link" href="#tx-expenses" data-bs-toggle="tab">Expenses</a></li>
                                    </ul>
                                    <div className="tab-content transaction-content">
                                        {[
                                            { id: 'tx-all', rows: recentTransactions.all, active: true },
                                            { id: 'tx-sales', rows: recentTransactions.sales, active: false },
                                            { id: 'tx-purchase', rows: recentTransactions.purchase, active: false },
                                            { id: 'tx-expenses', rows: recentTransactions.expenses, active: false },
                                        ].map((tab) => (
                                            <div key={tab.id} className={`tab-pane ${tab.active ? 'show active' : ''}`} id={tab.id}>
                                                <div className="table-responsive">
                                                    <table className="table table-borderless custom-table mb-0">
                                                        <thead className="thead-light">
                                                            <tr>
                                                                <th>Date</th>
                                                                <th>Party / Category</th>
                                                                <th>Status</th>
                                                                <th>Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tab.rows.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={4} className="text-center py-4 text-muted">
                                                                        No transactions recorded yet.
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                tab.rows.map((tx) => (
                                                                    <tr key={`${tab.id}-${tx.id}`}>
                                                                        <td>{new Date(tx.date).toLocaleDateString('en-PK')}</td>
                                                                        <td>
                                                                            <div className="fw-medium">{tx.party}</div>
                                                                            <span className="fs-12 text-primary">{tx.reference}</span>
                                                                        </td>
                                                                        <td>
                                                                            <span className="badge bg-success badge-xs">{tx.status}</span>
                                                                        </td>
                                                                        <td className="fw-medium text-gray-9">{fmtMoney(tx.total)}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Customers | Top Categories | Order Statistics Heatmap */}
                    <div className="row">
                        <div className="col-xxl-4 col-md-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div className="d-inline-flex align-items-center">
                                        <span className="title-icon bg-soft-info fs-16 me-2"><i className="ti ti-users" /></span>
                                        <h5 className="card-title mb-0">Top Customers</h5>
                                    </div>
                                    <Link to={route.customers} className="fs-13 fw-medium text-decoration-underline">View All</Link>
                                </div>
                                <div className="card-body">
                                    {topCustomers.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            <i className="ti ti-users-minus fs-32 d-block mb-2" />
                                            No customer sales recorded in this period.
                                        </div>
                                    ) : (
                                        topCustomers.map((c, idx) => (
                                            <div key={c.id} className={`d-flex align-items-center justify-content-between ${idx < topCustomers.length - 1 ? 'border-bottom pb-3 mb-3' : ''}`}>
                                                <div className="d-flex align-items-center">
                                                    <span className="avatar avatar-md bg-soft-primary text-primary fw-bold me-2">
                                                        {c.name?.charAt(0) || 'C'}
                                                    </span>
                                                    <div>
                                                        <h6 className="fw-bold mb-1">
                                                            <Link to={route.customers}>{c.name}</Link>
                                                        </h6>
                                                        <div className="d-flex align-items-center gap-2 fs-12 text-muted">
                                                            <span>{c.country}</span>
                                                            <span>&bull;</span>
                                                            <span>{c.ordersCount} Orders</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <h6 className="fw-bold">{fmtMoney(c.totalSpent)}</h6>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-xxl-4 col-md-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div className="d-inline-flex align-items-center">
                                        <span className="title-icon bg-soft-orange fs-16 me-2"><i className="ti ti-category" /></span>
                                        <h5 className="card-title mb-0">Top Categories</h5>
                                    </div>
                                    <Link to={route.categorylist} className="fs-13 fw-medium text-decoration-underline">View All</Link>
                                </div>
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-sm-6">
                                            <div style={{ height: '180px' }}>
                                                <ErrorBoundary compact widgetName="Top Categories Chart">
                                                    <Doughnut data={categoryDoughnutData} options={categoryDoughnutOptions} />
                                                </ErrorBoundary>
                                            </div>
                                        </div>
                                        <div className="col-sm-6">
                                            {topCategories.length === 0 ? (
                                                <p className="text-muted fs-13">No category sales yet.</p>
                                            ) : (
                                                topCategories.map((c, idx) => (
                                                    <div key={c.name} className="mb-2">
                                                        <p className="mb-0 fs-13 fw-medium">
                                                            <i className="ti ti-point-filled me-1" style={{ color: catColors[idx % catColors.length] }} />
                                                            {c.name}
                                                        </p>
                                                        <h6 className="ms-3">{fmtMoney(c.revenue)} <span className="fs-12 text-muted">({c.unitsSold} pcs)</span></h6>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <h6 className="mb-2 mt-3">Category Statistics</h6>
                                    <div className="border br-8">
                                        <div className="d-flex align-items-center justify-content-between border-bottom p-2">
                                            <p className="d-inline-flex align-items-center mb-0">
                                                <i className="ti ti-square-rounded-filled text-indigo fs-8 me-2" />
                                                Total Number Of Categories
                                            </p>
                                            <h5>{catalogSummary.totalCategoriesCount}</h5>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between p-2">
                                            <p className="d-inline-flex align-items-center mb-0">
                                                <i className="ti ti-square-rounded-filled text-orange fs-8 me-2" />
                                                Total Number Of Products
                                            </p>
                                            <h5>{catalogSummary.totalProductsCount}</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xxl-4 col-md-12 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div className="d-inline-flex align-items-center">
                                        <span className="title-icon bg-soft-indigo fs-16 me-2"><i className="ti ti-calendar-stats" /></span>
                                        <h5 className="card-title mb-0">Order Statistics</h5>
                                    </div>
                                    <span className="badge bg-light text-dark">{PERIOD_LABELS[period] || 'Range'}</span>
                                </div>
                                <div className="card-body pb-0">
                                    <ErrorBoundary compact widgetName="Order Heatmap">
                                        <div id="heat_chart">
                                            <Chart options={heatmapOptions} series={heatmapOptions.series} type="heatmap" height={320} />
                                        </div>
                                    </ErrorBoundary>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewDashboard;
