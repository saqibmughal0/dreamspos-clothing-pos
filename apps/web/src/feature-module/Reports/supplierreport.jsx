import React from "react";
import ReportPage from "../../core/common/ReportPage";

const columns = [
  { title: "Reference", dataIndex: "reference" },
  { title: "Supplier", dataIndex: "supplier" },
  { title: "Amount", dataIndex: "amountFormatted" },
  { title: "Paid", dataIndex: "paidFormatted" },
  { title: "Due", dataIndex: "dueFormatted" },
  { title: "Status", dataIndex: "status" },
  { title: "Date", dataIndex: "dateFormatted" },
];

const mapRow = (item) => ({
  key: item.id,
  reference: item.reference,
  supplier: item.supplier,
  amount: item.amount,
  due: item.due,
  amountFormatted: `Rs ${Number(item.amount || 0).toFixed(2)}`,
  paidFormatted: `Rs ${Number(item.paid || 0).toFixed(2)}`,
  dueFormatted: `Rs ${Number(item.due || 0).toFixed(2)}`,
  status: item.status,
  dateFormatted: new Date(item.date).toLocaleDateString("en-PK"),
});

const SupplierReport = () => (
  <ReportPage
    title="Supplier Report"
    subtitle="Supplier purchase history and payment summary"
    endpoint="/reports/suppliers"
    columns={columns}
    mapRow={mapRow}
    summaryBuilder={(rows) => [
      { label: "Purchase Orders", value: rows.length },
      { label: "Total Purchased", value: `Rs ${rows.reduce((s, r) => s + Number(r.amount || 0), 0).toLocaleString()}` },
      { label: "Total Due", value: `Rs ${rows.reduce((s, r) => s + Number(r.due || 0), 0).toLocaleString()}` },
    ]}
  />
);

export default SupplierReport;
