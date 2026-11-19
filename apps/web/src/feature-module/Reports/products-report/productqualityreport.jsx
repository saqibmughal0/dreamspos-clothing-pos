import React from "react";
import ReportPage from "../../../core/common/ReportPage";

const columns = [
  { title: "SKU", dataIndex: "sku" },
  { title: "Product Name", dataIndex: "productName" },
  { title: "Category", dataIndex: "category" },
  { title: "Current Stock", dataIndex: "qty" },
  { title: "Alert Quantity", dataIndex: "alertQuantity" },
  { title: "Status", dataIndex: "status" },
];

const mapRow = (item) => ({
  key: item.id,
  sku: item.sku,
  productName: item.productName,
  category: item.category,
  qty: item.qty,
  alertQuantity: item.alertQuantity,
  status: item.status,
});

const ProductQualityreport = () => (
  <ReportPage
    title="Product Quantity Alert"
    subtitle="Stock health vs configured alert thresholds"
    endpoint="/reports/product-quality"
    columns={columns}
    mapRow={mapRow}
    summaryBuilder={(rows) => [
      { label: "Total Products", value: rows.length },
      { label: "Low / Out of Stock", value: rows.filter((r) => r.status !== "Healthy").length },
    ]}
  />
);

export default ProductQualityreport;
