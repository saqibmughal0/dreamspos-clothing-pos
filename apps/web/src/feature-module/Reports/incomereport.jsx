import React from "react";
import ReportPage from "../../core/common/ReportPage";

const columns = [
  { title: "Reference", dataIndex: "reference" },
  { title: "Date", dataIndex: "dateFormatted" },
  { title: "Category", dataIndex: "category" },
  { title: "Payment Method", dataIndex: "paymentMethod" },
  { title: "Amount", dataIndex: "amountFormatted" },
  { title: "Notes", dataIndex: "notes" },
];

const mapRow = (item) => ({
  key: item.id,
  reference: item.reference,
  category: item.category,
  paymentMethod: item.paymentMethod,
  amount: item.amount,
  notes: item.notes || "—",
  dateFormatted: new Date(item.date).toLocaleDateString("en-PK"),
  amountFormatted: `Rs ${Number(item.amount || 0).toFixed(2)}`,
});

const IncomeReport = () => (
  <ReportPage
    title="Income Report"
    subtitle="Recorded business income by category and date"
    endpoint="/reports/income"
    columns={columns}
    mapRow={mapRow}
    summaryBuilder={(rows) => [
      { label: "Records", value: rows.length },
      { label: "Total Income", value: `Rs ${rows.reduce((s, r) => s + Number(r.amount || 0), 0).toLocaleString()}` },
    ]}
  />
);

export default IncomeReport;
