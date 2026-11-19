import React from "react";
import ReportPage from "../../core/common/ReportPage";

const columns = [
  { title: "SKU", dataIndex: "sku" },
  { title: "Product Name", dataIndex: "productName" },
  { title: "Warehouse", dataIndex: "warehouse" },
  { title: "Movement Type", dataIndex: "type" },
  { title: "Quantity", dataIndex: "quantity" },
  { title: "Reference / Reason", dataIndex: "reference" },
  { title: "Date", dataIndex: "dateFormatted" },
];

const mapRow = (item) => ({
  key: item.id,
  sku: item.sku,
  productName: item.productName,
  warehouse: item.warehouse,
  type: item.type,
  quantity: item.quantity,
  reference: item.reference,
  dateFormatted: new Date(item.date).toLocaleDateString("en-PK"),
});

const Stockhistory = () => (
  <ReportPage
    title="Stock History"
    subtitle="Audit log of stock movements across purchases, sales, adjustments, and transfers"
    endpoint="/reports/stock-history"
    columns={columns}
    mapRow={mapRow}
    summaryBuilder={(rows) => [
      { label: "Movements", value: rows.length },
    ]}
  />
);

export default Stockhistory;
