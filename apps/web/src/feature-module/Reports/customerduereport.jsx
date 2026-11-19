import React from "react";
import ReportPage from "../../core/common/ReportPage";

const columns = [
  { title: "Reference", dataIndex: "reference" },
  { title: "Code", dataIndex: "code" },
  { title: "Customer", dataIndex: "customer" },
  { title: "Total Amount", dataIndex: "totalFormatted" },
  { title: "Paid", dataIndex: "paidFormatted" },
  { title: "Due", dataIndex: "dueFormatted" },
  { title: "Status", dataIndex: "status" },
];

const mapRow = (item) => ({
  key: item.id,
  reference: item.reference,
  code: item.code,
  customer: item.customer,
  totalAmount: item.totalAmount,
  paid: item.paid,
  due: item.due,
  totalFormatted: `Rs ${Number(item.totalAmount || 0).toFixed(2)}`,
  paidFormatted: `Rs ${Number(item.paid || 0).toFixed(2)}`,
  dueFormatted: `Rs ${Number(item.due || 0).toFixed(2)}`,
  status: item.status,
});

const CustomerDueReport = () => (
  <ReportPage
    title="Customer Due Report"
    subtitle="Outstanding customer invoice balances"
    endpoint="/reports/customer-due"
    columns={columns}
    mapRow={mapRow}
    showStoreFilter
    summaryBuilder={(rows) => [
      { label: "Due Invoices", value: rows.length },
      { label: "Total Due", value: `Rs ${rows.reduce((s, r) => s + Number(r.due || 0), 0).toLocaleString()}` },
    ]}
  />
);

export default CustomerDueReport;
