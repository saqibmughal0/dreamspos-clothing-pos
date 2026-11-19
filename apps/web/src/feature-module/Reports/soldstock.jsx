import React from "react";
import ReportPage from "../../core/common/ReportPage";

const columns = [
  { title: "SKU", dataIndex: "sku" },
  { title: "Product Name", dataIndex: "productName" },
  { title: "Unit Cost", dataIndex: "unitCostFormatted" },
  { title: "Sold Qty", dataIndex: "quantity" },
  { title: "Tax", dataIndex: "taxFormatted" },
  { title: "Total", dataIndex: "totalFormatted" },
  { title: "In Stock", dataIndex: "instock" },
];

const mapRow = (item) => ({
  key: item.id,
  sku: item.sku,
  productName: item.productName,
  quantity: item.quantity,
  total: item.total,
  instock: item.instock,
  unitCostFormatted: `Rs ${Number(item.unitCost || 0).toFixed(2)}`,
  taxFormatted: `Rs ${Number(item.taxValue || 0).toFixed(2)}`,
  totalFormatted: `Rs ${Number(item.total || 0).toFixed(2)}`,
});

const SoldStock = () => (
  <ReportPage
    title="Sold Stock Report"
    subtitle="Units sold, revenue, and remaining inventory"
    endpoint="/reports/sold-stock"
    columns={columns}
    mapRow={mapRow}
    showStoreFilter
    summaryBuilder={(rows) => [
      { label: "Products Sold", value: rows.length },
      { label: "Total Units Sold", value: rows.reduce((s, r) => s + Number(r.quantity || 0), 0) },
      { label: "Total Sales", value: `Rs ${rows.reduce((s, r) => s + Number(r.total || 0), 0).toLocaleString()}` },
    ]}
  />
);

export default SoldStock;
