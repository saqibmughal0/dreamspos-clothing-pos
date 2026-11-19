import React from "react";
import ReportPage from "../../core/common/ReportPage";

const columns = [
  { title: "Code", dataIndex: "code" },
  { title: "Customer", dataIndex: "customer" },
  { title: "Total Orders", dataIndex: "totalOrders" },
  { title: "Amount", dataIndex: "amountFormatted" },
  { title: "Paid", dataIndex: "paidFormatted" },
  { title: "Due", dataIndex: "dueFormatted" },
];

const mapRow = (item) => ({
  key: item.id,
  code: item.code,
  customer: item.customer,
  totalOrders: item.totalOrders,
  amount: item.amount,
  paid: item.paid,
  due: item.due,
  amountFormatted: `Rs ${Number(item.amount || 0).toFixed(2)}`,
  paidFormatted: `Rs ${Number(item.paid || 0).toFixed(2)}`,
  dueFormatted: `Rs ${Number(item.due || 0).toFixed(2)}`,
});

const CustomerReport = () => (
  <ReportPage
    title="Customer Report"
    subtitle="Customer sales totals, payments, and balances"
    endpoint="/reports/customers"
    columns={columns}
    mapRow={mapRow}
    showStoreFilter
    summaryBuilder={(rows) => [
      { label: "Customers", value: rows.length },
      { label: "Total Sales", value: `Rs ${rows.reduce((s, r) => s + Number(r.amount || 0), 0).toLocaleString()}` },
      { label: "Total Due", value: `Rs ${rows.reduce((s, r) => s + Number(r.due || 0), 0).toLocaleString()}` },
    ]}
  />
);

export default CustomerReport;
