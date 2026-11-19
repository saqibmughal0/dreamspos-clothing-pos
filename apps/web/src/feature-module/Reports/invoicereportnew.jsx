import React from "react";
import ReportPage from "../../core/common/ReportPage";

const columns = [
  { title: "Invoice No", dataIndex: "invoiceNo" },
  { title: "Customer", dataIndex: "customer" },
  { title: "Date", dataIndex: "dateFormatted" },
  { title: "Amount", dataIndex: "amountFormatted" },
  { title: "Paid", dataIndex: "paidFormatted" },
  { title: "Amount Due", dataIndex: "dueFormatted" },
  { title: "Status", dataIndex: "status" },
];

const mapRow = (item) => ({
  key: item.id,
  invoiceNo: item.invoiceNo,
  customer: item.customer,
  amount: item.amount,
  paid: item.paid,
  amountDue: item.amountDue,
  status: item.status,
  dateFormatted: new Date(item.dueDate).toLocaleDateString("en-PK"),
  amountFormatted: `Rs ${Number(item.amount || 0).toFixed(2)}`,
  paidFormatted: `Rs ${Number(item.paid || 0).toFixed(2)}`,
  dueFormatted: `Rs ${Number(item.amountDue || 0).toFixed(2)}`,
});

const Invoicereportnew = () => (
  <ReportPage
    title="Invoice Report"
    subtitle="Invoice totals, payments, and due balances"
    endpoint="/reports/invoices"
    columns={columns}
    mapRow={mapRow}
    showStoreFilter
    summaryBuilder={(rows) => [
      { label: "Invoices", value: rows.length },
      { label: "Total Amount", value: `Rs ${rows.reduce((s, r) => s + Number(r.amount || 0), 0).toLocaleString()}` },
      { label: "Total Paid", value: `Rs ${rows.reduce((s, r) => s + Number(r.paid || 0), 0).toLocaleString()}` },
      { label: "Total Due", value: `Rs ${rows.reduce((s, r) => s + Number(r.amountDue || 0), 0).toLocaleString()}` },
    ]}
  />
);

export default Invoicereportnew;
