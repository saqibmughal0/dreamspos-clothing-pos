import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import {
  File,
  User,
  UserCheck,
} from "feather-icons-react/build/IconComponents";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import { ArrowRight } from "react-feather";
import { all_routes } from "../../Router/all_routes";
import { apiClient } from "../../core/apiClient";

const Dashboard = () => {
  const route = all_routes;
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    netProfit: 0,
    customersCount: 0,
    productsCount: 0,
    lowStockCount: 0,
    todayOrders: 0
  });

  const [error, setError] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [chartData, setChartData] = useState({
    categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    sales: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    purchase: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  });

  useEffect(() => {
    setError(null);
    Promise.all([
      apiClient.get("/dashboard/summary"),
      apiClient.get("/dashboard/overview", { params: { period: "1Y" } }),
      apiClient.get("/products", { params: { limit: 5 } })
    ])
      .then(([summaryRes, overviewRes, productsRes]) => {
        if (summaryRes.data?.success && summaryRes.data.data) {
          setMetrics({
            totalSales: Number(summaryRes.data.data.totalSales ?? 0),
            totalPurchases: Number(summaryRes.data.data.totalPurchases ?? 0),
            totalExpenses: Number(summaryRes.data.data.totalExpenses ?? 0),
            netProfit: Number(summaryRes.data.data.netProfit ?? 0),
            customersCount: Number(summaryRes.data.data.customersCount ?? 0),
            productsCount: Number(summaryRes.data.data.productsCount ?? 0),
            lowStockCount: Number(summaryRes.data.data.lowStockCount ?? 0),
            todayOrders: Number(summaryRes.data.data.todayOrders ?? 0)
          });
        }
        if (overviewRes.data?.success && overviewRes.data.data?.salesAndPurchaseChart) {
          const c = overviewRes.data.data.salesAndPurchaseChart;
          setChartData({
            categories: c.categories || [],
            sales: c.sales || [],
            purchase: (c.purchase || []).map((v) => -Math.abs(Number(v || 0)))
          });
        }
        if (productsRes.data?.success && productsRes.data.data?.items) {
          setRecentProducts(productsRes.data.data.items.slice(0, 5));
        }
      })
      .catch((err) => {
        setError(err?.message || "Failed to load dashboard data.");
      });
  }, []);
  const chartOptions = {
    series: [
      {
        name: "Sales",
        data: chartData.sales,
      },
      {
        name: "Purchase",
        data: chartData.purchase,
      },
    ],
    colors: ["#28C76F", "#EA5455"],
    chart: {
      type: "bar",
      height: 320,
      stacked: true,
      zoom: {
        enabled: true,
      },
    },
    responsive: [
      {
        breakpoint: 280,
        options: {
          legend: {
            position: "bottom",
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        borderRadiusApplication: "end", // "around" / "end"
        borderRadiusWhenStacked: "all", // "all"/"last"
        columnWidth: "20%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: chartData.categories,
    },
    legend: { show: false },
    fill: {
      opacity: 1,
    },
  };

  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const firstName = currentUser?.name ? currentUser.name.split(" ")[0] : "Bilal";

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex justify-content-between align-items-center mb-4">
            <div className="page-title">
              <h4 className="fs-22 fw-bold text-gray-9 mb-1">
                Welcome, <span className="text-primary">{firstName}</span>!
              </h4>
              <h6 className="text-muted fs-14 mb-0">
                Here is your store summary and performance overview for today.
              </h6>
            </div>
          </div>
          <div className="row">
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card dash-widget w-100">
              <div className="card-body d-flex align-items-center">
                <div className="dash-widgetimg">
                  <span>
                    <ImageWithBasePath src="assets/img/icons/dash1.svg" alt="img" />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                  
                    <CountUp className="counters" start={0} end={Number(metrics.totalPurchases)} duration={1.5} prefix="Rs " />
                  </h5>
                  <p className="mb-0">Total Purchase Due</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card dash-widget dash1 w-100">
              <div className="card-body d-flex align-items-center">
                <div className="dash-widgetimg">
                  <span>
                    <ImageWithBasePath src="assets/img/icons/dash2.svg" alt="img" />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                    <span className="counters" >
                    <CountUp start={0} end={Number(metrics.netProfit)} duration={1.5} prefix="Rs " />
                    </span>
                  </h5>
                  <p className="mb-0">Estimated Net Profit</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card dash-widget dash2 w-100">
              <div className="card-body d-flex align-items-center">
                <div className="dash-widgetimg">
                  <span>
                    <ImageWithBasePath src="assets/img/icons/dash3.svg" alt="img" />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                    <span className="counters" >
                      <CountUp start={0} end={Number(metrics.totalSales)} duration={1.5} prefix="Rs " />
                    </span>
                  </h5>
                  <p className="mb-0">Total Sale Amount</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card dash-widget dash3 w-100">
              <div className="card-body d-flex align-items-center">
                <div className="dash-widgetimg">
                  <span>
                    <ImageWithBasePath src="assets/img/icons/dash4.svg" alt="img" />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                    <span className="counters" >
                      <CountUp start={0} end={Number(metrics.totalExpenses)} duration={1.5} prefix="Rs " />
                    </span>
                  </h5>
                  <p className="mb-0">Total Expense Amount</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count">
                <div className="dash-counts">
                  <h4>{metrics.customersCount}</h4>
                  <h5>Customers</h5>
                </div>
                <div className="dash-imgs">
                  <User />
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das1">
                <div className="dash-counts">
                  <h4>{metrics.productsCount}</h4>
                  <h5>Products</h5>
                </div>
                <div className="dash-imgs">
                  <UserCheck />
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das2 bg-dark">
                <div className="dash-counts">
                  <h4>{metrics.lowStockCount}</h4>
                  <h5>Low Stock Items</h5>
                </div>
                <div className="dash-imgs">
                  <ImageWithBasePath
                    src="assets/img/icons/file-text-icon-01.svg"
                    className="img-fluid"
                    alt="icon"
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das3">
                <div className="dash-counts">
                  <h4>{metrics.todayOrders}</h4>
                  <h5>Orders Today</h5>
                </div>
                <div className="dash-imgs">
                  <File />
                </div>
              </div>
            </div>
          </div>
          {/* Button trigger modal */}

          <div className="row">
            <div className="col-xl-7 col-sm-12 col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Purchase &amp; Sales</h5>
                  <div className="graph-sets">
                    <ul className="mb-0">
                      <li>
                        <span>Sales</span>
                      </li>
                      <li>
                        <span>Purchase</span>
                      </li>
                    </ul>
                    <div className="dropdown dropdown-wraper">
                      <button
                        className="btn btn-light btn-sm dropdown-toggle"
                        type="button"
                        id="dropdownMenuButton"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        2025
                      </button>
                      <ul
                        className="dropdown-menu"
                        aria-labelledby="dropdownMenuButton"
                      >
                        <li>
                          <Link to="#" className="dropdown-item">
                            2023
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item">
                            2022
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item">
                            2021
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div id="sales_charts" />
                  <Chart
                    options={chartOptions}
                    series={chartOptions.series}
                    type="bar"
                    height={320}
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-5 col-sm-12 col-12 d-flex">
              <div className="card flex-fill default-cover mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">Recent Products</h4>
                  <div className="view-all-link">
                    <Link to="#" className="view-all d-flex align-items-center">
                      View All
                      <span className="ps-2 d-flex align-items-center">
                        <ArrowRight className="feather-16" />
                      </span>
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive dataview">
                    <table className="table dashboard-recent-products">
                      <thead className="thead-light">
                        <tr>
                          <th>#</th>
                          <th>Products</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentProducts.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center py-4 text-muted">
                              {error ? error : "No products added yet."}
                            </td>
                          </tr>
                        ) : (
                          recentProducts.map((p, idx) => (
                            <tr key={p.id || idx}>
                              <td>{idx + 1}</td>
                              <td className="d-flex align-items-center">
                                <Link to={route.productlist} className="fw-bold">
                                  {p.name}
                                </Link>
                              </td>
                              <td>Rs {Number(p.sellingPrice || 0).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Expired Products</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive dataview">
                <table className="table dashboard-expired-products">
                  <thead className="thead-light">
                    <tr>
                      <th className="no-sort">
                        <label className="checkboxs">
                          <input type="checkbox" id="select-all" />
                          <span className="checkmarks" />
                        </label>
                      </th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Manufactured Date</th>
                      <th>Expired Date</th>
                      <th className="no-sort">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No expired products.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
