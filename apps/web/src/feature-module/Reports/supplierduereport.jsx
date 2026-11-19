import React from "react";
import ReportPage from "../../core/common/ReportPage";

const columns = [
  { title: "Reference", dataIndex: "reference" },
  { title: "Supplier", dataIndex: "supplier" },
  { title: "Total Amount", dataIndex: "totalFormatted" },
  { title: "Paid", dataIndex: "paidFormatted" },
  { title: "Due", dataIndex: "dueFormatted" },
  { title: "Status", dataIndex: "status" },
];

const mapRow = (item) => ({
  key: item.id,
  reference: item.reference,
  supplier: item.supplier,
  due: item.due,
  totalFormatted: `Rs ${Number(item.totalAmount || 0).toFixed(2)}`,
  paidFormatted: `Rs ${Number(item.paid || 0).toFixed(2)}`,
  dueFormatted: `Rs ${Number(item.due || 0).toFixed(2)}`,
  status: item.status,
});

const SupplierDueReport = () => (
  <ReportPage
    title="Supplier Due Report"
    subtitle="Unpaid balances owed to suppliers"
    endpoint="/reports/supplier-due"
    columns={columns}
    mapRow={mapRow}
    summaryBuilder={(rows) => [
      { label: "Due Purchases", value: rows.length },
      { label: "Total Due", value: `Rs ${rows.reduce((s, r) => s + Number(r.due || 0), 0).toLocaleString()}` },
    ]}
  />
);

export default SupplierDueReport;
