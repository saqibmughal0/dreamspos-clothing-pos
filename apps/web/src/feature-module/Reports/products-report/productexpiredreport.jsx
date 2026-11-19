import React from "react";
import ReportPage from "../../../core/common/ReportPage";

const columns = [
  { title: "SKU", dataIndex: "sku" },
  { title: "Product Name", dataIndex: "productName" },
  { title: "Manufactured Date", dataIndex: "mfgFormatted" },
  { title: "Expiry Date", dataIndex: "expFormatted" },
  { title: "Status", dataIndex: "status" },
];

const mapRow = (item) => ({
  key: item.id,
  sku: item.sku,
  productName: item.productName,
  mfgFormatted: item.manufacturedDate ? new Date(item.manufacturedDate).toLocaleDateString("en-PK") : "—",
  expFormatted: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("en-PK") : "—",
  status: item.isExpired ? "Expired" : "Upcoming",
});

const ProductExpiredreport = () => (
  <ReportPage
    title="Product Expiry Report"
    subtitle="Products with configured expiry dates"
    endpoint="/reports/product-expired"
    columns={columns}
    mapRow={mapRow}
  />
);

export default ProductExpiredreport;
