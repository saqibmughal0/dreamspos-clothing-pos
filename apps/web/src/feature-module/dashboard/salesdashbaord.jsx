import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Chart from "react-apexcharts";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import { all_routes } from "../../Router/all_routes";
import RefreshIcon from "../../core/common/tooltip-content/refresh";
import CollapesIcon from "../../core/common/tooltip-content/collapes";
import CommonFooter from "../../core/common/footer/commonFooter";
import { apiClient } from "../../core/apiClient";
import { formatCurrency as formatMoney } from "../../core/utils/businessSettings";

const SalesDashbaord = () => {
  const route = all_routes;
  const userName = useSelector((state) => state.auth?.user?.name || "Store Owner");

  const [businessSettings, setBusinessSettings] = useState(null);
  const [summary, setSummary] = useState(null);
  const [bestSellers, setBestSellers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [chartCategories, setChartCategories] = useState([]);
  const [chartSeriesData, setChartSeriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (val) => formatMoney(val, businessSettings?.currency);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, txRes, bestRes, overviewRes, settingsRes] = await Promise.all([
        apiClient.get("/dashboard/summary"),
        apiClient.get("/dashboard/transactions"),
        apiClient.get("/reports/best-sellers"),
        apiClient.get("/dashboard/overview?period=1Y"),
        apiClient.get("/settings").catch(() => ({ data: null })),
      ]);

      if (settingsRes?.data?.success && settingsRes.data.data) {
        setBusinessSettings(settingsRes.data.data);
      }
      setSummary(sumRes.data?.data || {});
      setRecentTransactions(txRes.data?.data || []);
      setBestSellers((bestRes.data?.data?.items || []).slice(0, 5));

      const chartPoints = overviewRes.data?.data?.salesPurchaseChart || [];
      setChartCategories(chartPoints.map((c) => c.label || c.month || ""));
      setChartSeriesData(chartPoints.map((c) => Number(c.sales || 0)));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load sales dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartOptions = {
    series: [
      {
        name: "Sales (Rs)",
        data: chartSeriesData.length > 0 ? chartSeriesData : [0],
      },
    ],
    chart: {
      height: 273,
      type: "area",
      zoom: { enabled: false },
      toolbar: { show: false },
    },
    colors: ["#FF9F43"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: {
      categories: chartCategories.length > 0 ? chartCategories : ["No Data"],
    },
    yaxis: {
      min: 0,
      labels: {
        formatter: (val) => `Rs ${Math.round(val).toLocaleString()}`,
      },
    },
    legend: { position: "top", horizontalAlign: "left" },
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="welcome d-lg-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center welcome-text">
            <h3 className="d-flex align-items-center">
              <ImageWithBasePath src="assets/img/icons/hi.svg" alt="img" />
              &nbsp;Hi {userName},
            </h3>
            &nbsp;<h6>
              here&apos;s what&apos;s happening with{" "}
              {businessSettings?.shopName || businessSettings?.brandName || "your store"} today.
            </h6>
          </div>
          <div className="d-flex align-items-center">
            <ul className="table-top-head">
              <RefreshIcon onClick={loadData} />
              <CollapesIcon />
            </ul>
          </div>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Loading sales dashboard...</p>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-danger d-flex align-items-center justify-content-between">
            <span>{error}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={loadData}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="row sales-cards">
              <div className="col-xl-6 col-sm-12 col-12 d-flex">
                <div className="card d-flex align-items-center justify-content-between flex-fill mb-4">
                  <div>
                    <h6>Today&apos;s Sales</h6>
                    <h3>{formatCurrency(summary?.todaySales)}</h3>
                    <p className="sales-range mb-0">
                      {summary?.todayOrders || 0} completed order(s) today
                    </p>
                  </div>
                  <ImageWithBasePath src="assets/img/icons/weekly-earning.svg" alt="img" />
                </div>
              </div>
              <div className="col-xl-3 col-sm-6 col-12 d-flex">
                <div className="card color-info bg-primary flex-fill mb-4">
                  <div className="dash-widgetcontent">
                    <h5 className="text-white">{formatCurrency(summary?.totalSales)}</h5>
                    <h6 className="text-white">Total Sales</h6>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-sm-6 col-12 d-flex">
                <div className="card color-info bg-secondary flex-fill mb-4">
                  <div className="dash-widgetcontent">
                    <h5 className="text-white">{formatCurrency(summary?.netProfit)}</h5>
                    <h6 className="text-white">Estimated Net Profit</h6>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-sm-12 col-md-12 col-xl-4 d-flex">
                <div className="card flex-fill w-100 mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="card-title mb-0">Best Sellers</h4>
                    <Link to={route.bestseller} className="view-all d-flex align-items-center">
                      View All
                    </Link>
                  </div>
                  <div className="card-body">
                    {bestSellers.length === 0 ? (
                      <p className="text-muted text-center py-4 mb-0">No product sales recorded yet.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-borderless best-seller">
                          <tbody>
                            {bestSellers.map((item) => (
                              <tr key={item.id}>
                                <td>
                                  <div className="product-info">
                                    <div className="info">
                                      <Link to={route.productlist}>{item.productName}</Link>
                                      <p className="mb-0 text-muted fs-12">SKU: {item.sku}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-end">
                                  <p className="sell-product mb-0">
                                    <strong>{item.soldQty}</strong> Sold
                                  </p>
                                  <span className="text-muted fs-12">{formatCurrency(item.soldAmount)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-sm-12 col-md-12 col-xl-8 d-flex">
                <div className="card flex-fill w-100 mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="card-title mb-0">Recent Transactions</h4>
                    <Link to={route.saleslist} className="view-all d-flex align-items-center">
                      View All
                    </Link>
                  </div>
                  <div className="card-body">
                    {recentTransactions.length === 0 ? (
                      <p className="text-muted text-center py-4 mb-0">No sales transactions recorded yet.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-borderless recent-transactions">
                          <thead>
                            <tr>
                              <th>Invoice</th>
                              <th>Customer</th>
                              <th>Status</th>
                              <th className="text-end">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentTransactions.slice(0, 6).map((tx) => (
                              <tr key={tx.id}>
                                <td>{tx.invoiceNumber || tx.reference || tx.id}</td>
                                <td>{tx.customerName || "Walk-in Customer"}</td>
                                <td>
                                  <span className="badge bg-light text-dark">{tx.paymentStatus || tx.status || "COMPLETED"}</span>
                                </td>
                                <td className="text-end fw-semibold">{formatCurrency(tx.totalAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Sales Analysis</h5>
                    <span className="text-muted fs-13">
                      Month-to-Date: {formatCurrency(summary?.monthSales)}
                    </span>
                  </div>
                  <div className="card-body">
                    {chartSeriesData.length === 0 ? (
                      <p className="text-muted text-center py-4 mb-0">No sales history available for chart yet.</p>
                    ) : (
                      <Chart options={chartOptions} series={chartOptions.series} type="area" height={273} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <CommonFooter />
    </div>
  );
};

export default SalesDashbaord;
