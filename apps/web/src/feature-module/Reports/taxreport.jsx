import React from "react";
import ReportPage from "../../core/common/ReportPage";

const columns = [
  { title: "Reference", dataIndex: "reference" },
  { title: "Party", dataIndex: "party" },
  { title: "Type", dataIndex: "type" },
  { title: "Date", dataIndex: "dateFormatted" },
  { title: "Amount", dataIndex: "amountFormatted" },
  { title: "Tax Amount", dataIndex: "taxFormatted" },
];

const mapRow = (item) => ({
  key: item.id,
  reference: item.reference,
  party: item.party,
  type: item.type,
  taxAmount: item.taxAmount,
  dateFormatted: new Date(item.date).toLocaleDateString("en-PK"),
  amountFormatted: `Rs ${Number(item.amount || 0).toFixed(2)}`,
  taxFormatted: `Rs ${Number(item.taxAmount || 0).toFixed(2)}`,
});

const TaxReport = () => (
  <ReportPage
    title="Tax Report"
    subtitle="Sales and purchase tax breakdown"
    endpoint="/reports/tax"
    columns={columns}
    mapRow={mapRow}
    showStoreFilter
    summaryBuilder={(rows) => [
      { label: "Transactions", value: rows.length },
      { label: "Total Tax", value: `Rs ${rows.reduce((s, r) => s + Number(r.taxAmount || 0), 0).toLocaleString()}` },
    ]}
  />
);

export default TaxReport;
