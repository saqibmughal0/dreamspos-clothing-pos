import React from "react";
import ReportPage from "../../core/common/ReportPage";

const columns = [
  { title: "SKU", dataIndex: "sku" },
  { title: "Product Name", dataIndex: "productName" },
  { title: "Category", dataIndex: "category" },
  { title: "Brand", dataIndex: "brand" },
  { title: "Sold Qty", dataIndex: "soldQty" },
  { title: "Sold Amount", dataIndex: "soldAmountFormatted" },
  { title: "In Stock", dataIndex: "instockQty" },
];

const mapRow = (item) => ({
  key: item.id,
  sku: item.sku,
  productName: item.productName,
  category: item.category,
  brand: item.brand,
  soldQty: item.soldQty,
  soldAmount: item.soldAmount,
  soldAmountFormatted: `Rs ${Number(item.soldAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  instockQty: item.instockQty,
});

const BestSeller = () => (
  <ReportPage
    title="Best Seller Report"
    subtitle="Top-performing clothing products by units sold and revenue"
    endpoint="/reports/best-sellers"
    columns={columns}
    mapRow={mapRow}
    showStoreFilter
    summaryBuilder={(rows) => [
      { label: "Total Products Sold", value: rows.length },
      { label: "Total Units", value: rows.reduce((s, r) => s + Number(r.soldQty || 0), 0) },
      { label: "Total Revenue", value: `Rs ${rows.reduce((s, r) => s + Number(r.soldAmount || 0), 0).toLocaleString()}` },
    ]}
  />
);

export default BestSeller;
