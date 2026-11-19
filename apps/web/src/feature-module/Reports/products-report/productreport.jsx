import React from "react";
import ReportPage from "../../../core/common/ReportPage";

const columns = [
  { title: "SKU", dataIndex: "sku" },
  { title: "Product Name", dataIndex: "productName" },
  { title: "Category", dataIndex: "category" },
  { title: "Brand", dataIndex: "brand" },
  { title: "In Stock", dataIndex: "qty" },
  { title: "Price", dataIndex: "priceFormatted" },
  { title: "Sold Qty", dataIndex: "soldQty" },
  { title: "Revenue", dataIndex: "revenueFormatted" },
];

const mapRow = (item) => ({
  key: item.id,
  sku: item.sku,
  productName: item.productName,
  category: item.category,
  brand: item.brand,
  qty: item.qty,
  soldQty: item.soldQty,
  revenue: item.revenue,
  priceFormatted: `Rs ${Number(item.price || 0).toFixed(2)}`,
  revenueFormatted: `Rs ${Number(item.revenue || 0).toFixed(2)}`,
});

const Productreport = () => (
  <ReportPage
    title="Product Report"
    subtitle="Catalog inventory, pricing, and sales performance"
    endpoint="/reports/products"
    columns={columns}
    mapRow={mapRow}
    summaryBuilder={(rows) => [
      { label: "Active Products", value: rows.length },
      { label: "Total Stock Units", value: rows.reduce((s, r) => s + Number(r.qty || 0), 0) },
      { label: "Total Revenue", value: `Rs ${rows.reduce((s, r) => s + Number(r.revenue || 0), 0).toLocaleString()}` },
    ]}
  />
);

export default Productreport;
