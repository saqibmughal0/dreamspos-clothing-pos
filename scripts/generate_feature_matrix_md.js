const fs = require('fs');
const path = require('path');

const featureMatrix = `# DreamsPOS Complete Feature Matrix

This matrix maps every functional retail POS and business management feature to its frontend UI component, backend REST API endpoints, Prisma database models, transactional business logic, and automated test requirements.

## 1. Core Retail Point of Sale (POS)

| Feature | UI Component / View | Backend REST API | Database Models | Business Logic & Rules | Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POS Layout 1 (Standard)** | \`apps/web/src/feature-module/pos/pos.tsx\` | \`POST /api/pos/checkout\`, \`GET /api/products/pos\` | \`Sale\`, \`SaleItem\`, \`StockBalance\`, \`Payment\` | Fast product lookup, barcode scanning, category tab filters, real-time tax/discount computation | E2E checkout test, stock deduction assertion |
| **POS Layout 2 (Split Panel)** | \`apps/web/src/feature-module/pos/pos2.tsx\` | \`GET /api/pos/products\`, \`POST /api/pos/checkout\` | \`Sale\`, \`SaleItem\`, \`CashRegisterSession\` | Dual-column cart & products layout with numeric keypad | Vitest component + cart state tests |
| **POS Layout 3 (Grid Focus)** | \`apps/web/src/feature-module/pos/pos3.tsx\` | \`GET /api/pos/products\` | \`Sale\`, \`Product\`, \`Customer\` | Large grid product view, one-touch addition | Cart addition & quantity multiplier tests |
| **POS Layout 4 (Compact)** | \`apps/web/src/feature-module/pos/pos4.tsx\` | \`POST /api/pos/checkout\` | \`Sale\`, \`PaymentMethod\` | High-density layout for grocery / supermarket checkout | Input latency & fast keyboard shortcut tests |
| **POS Layout 5 (Restaurant / Table)** | \`apps/web/src/feature-module/pos/pos5.tsx\` | \`POST /api/pos/hold-order\`, \`GET /api/pos/held-orders\` | \`HeldOrder\`, \`HeldOrderItem\`, \`Sale\` | Order holding, table selection, kitchen notes, park/recall | Order parking and recall flow test |
| **POS Layout 6-8 (Variations)** | \`apps/web/src/feature-module/pos/posVariants.tsx\` | \`POST /api/pos/checkout\` | \`Sale\`, \`Invoice\`, \`Payment\` | Layout presets (touchscreen, kiosk, multi-lane) | Viewport rendering & responsiveness tests |
| **Barcode Scanner Integration** | Barcode listener hook / modal | \`GET /api/products/barcode/:code\` | \`Product\`, \`ProductBarcode\` | Hardware scanner wedge input detection, auto-add to cart | Simulated keyboard scanner input test |
| **Cart Management** | Zustand POS store | Local + synchronized state | N/A (Client state) | Item qty increment/decrement, line discount, price override | Zustand unit tests for discount/tax calculation |
| **Multi-Payment & Split Tender** | Checkout Modal | \`POST /api/pos/checkout\` | \`Payment\`, \`PaymentMethod\` | Cash, Card, Bank Transfer, Split payment, Due balance | Split math validation ($100 = $40 Cash + $60 Card) |
| **Cash Register & Shifts** | Register Open/Close Modal | \`POST /api/pos/register/open\`, \`close\`, \`summary\` | \`CashRegister\`, \`CashRegisterSession\` | Opening float, cash in/out, shift end reconciliation, discrepancy log | Register lifecycle integration test |
| **Receipt & Invoice Printing** | Thermal Print Preview | \`GET /api/invoices/:id/receipt\` | \`Invoice\`, \`CompanySetting\` | 58mm & 80mm thermal receipt CSS, browser print API | Print CSS rendering & line item format verification |
| **Order Holding & Recall** | Held Orders Drawer | \`POST /api/pos/hold\`, \`GET /api/pos/held\` | \`HeldOrder\`, \`HeldOrderItem\` | Multiple active held carts with customer tags | Park order, recall to cart, complete checkout test |
| **Sales Return & Refund** | Return Modal | \`POST /api/sales/returns\` | \`SalesReturn\`, \`SalesReturnItem\`, \`StockMovement\` | Validates return qty <= purchased qty, restocks items, issues refund | Over-return rejection & restock integrity test |

---

## 2. Inventory & Stock Management

| Feature | UI Component / View | Backend REST API | Database Models | Business Logic & Rules | Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Product List & Filtering** | \`inventory/productlist.tsx\` | \`GET /api/products\` | \`Product\`, \`Category\`, \`Brand\`, \`Unit\` | Pagination, full-text search, category/brand filter, low stock badge | Supertest API test + table render test |
| **Create Product** | \`inventory/addproduct.tsx\` | \`POST /api/products\` | \`Product\`, \`ProductVariant\`, \`ProductImage\` | Multi-image upload, SKU generation, barcode assignment, tax rate | Zod validation & database persistence test |
| **Edit / Archive Product** | \`inventory/editproduct.tsx\` | \`PUT /api/products/:id\`, \`DELETE /api/products/:id\` | \`Product\` | Soft delete, prevents deletion if active sales/stock exists | Integrity constraint test |
| **Product Categories & Subcategories** | \`inventory/categorylist.tsx\`, \`subcategories.tsx\` | \`GET / POST / PUT / DELETE /api/categories\` | \`Category\`, \`SubCategory\` | Hierarchical parent-child relationship, slug generation | CRUD integration tests |
| **Brands & Units** | \`inventory/brandlist.tsx\`, \`units.tsx\` | \`GET / POST / PUT / DELETE /api/brands\`, \`/units\` | \`Brand\`, \`Unit\` | Normalized brand references, decimal precision units (kg, pcs) | CRUD API tests |
| **Variants & Attributes** | \`inventory/variantattributes.tsx\` | \`GET / POST /api/variants\` | \`VariantAttribute\`, \`ProductVariant\` | Size, Color, Flavor combinations with unique SKUs and pricing | Matrix generator test |
| **Stock Management** | \`stock/managestocks.tsx\` | \`GET /api/stock\`, \`POST /api/stock/adjust\` | \`StockBalance\`, \`StockMovement\` | Per-warehouse stock tracking, prevent unauthorized negative stock | Multi-store inventory level tests |
| **Stock Adjustment** | \`stock/stockadjustment.tsx\` | \`POST /api/stock/adjustments\` | \`StockAdjustment\`, \`StockMovement\` | Damage, theft, inventory count correction with reason code | Transactional adjustment & audit log test |
| **Stock Transfer** | \`stock/stocktransfer.tsx\` | \`POST /api/stock/transfers\`, \`PUT /:id/receive\` | \`StockTransfer\`, \`StockTransferItem\` | Source deduction upon dispatch, target increment upon receipt | Two-phase transfer test |
| **Barcode & QR Generator** | \`inventory/barcode.tsx\`, \`qrcode.tsx\` | \`GET /api/products/barcodes/generate\` | \`ProductBarcode\` | Code128, EAN13, QR Code rendering, bulk sheet print | Barcode SVG/canvas generator test |
| **Low Stock & Expiry Alerts** | \`inventory/lowstock.tsx\`, \`expiredproducts.tsx\` | \`GET /api/products/alerts/low-stock\`, \`expired\` | \`Product\`, \`StockBalance\` | Triggers when stock <= alert_quantity or expiry <= today | Query accuracy verification test |

---

## 3. Purchases & Supplier Operations

| Feature | UI Component / View | Backend REST API | Database Models | Business Logic & Rules | Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Purchase List** | \`purchases/purchaselist.tsx\` | \`GET /api/purchases\` | \`Purchase\`, \`Supplier\` | Purchase history, payment status (Paid, Partial, Due) | Search & pagination test |
| **Create Purchase Order** | \`purchases/addpurchase.tsx\` | \`POST /api/purchases\` | \`Purchase\`, \`PurchaseItem\`, \`StockBalance\` | Auto-updates warehouse stock, recalculates cost price, logs accounts payable | Stock increment & double-entry ledger test |
| **Purchase Returns** | \`purchases/purchasereturn.tsx\` | \`POST /api/purchases/returns\` | \`PurchaseReturn\`, \`PurchaseReturnItem\` | Deducts stock from warehouse, credits supplier balance | Stock decrement & balance recalculation test |
| **Suppliers Management** | \`people/suppliers.tsx\` | \`GET / POST / PUT / DELETE /api/suppliers\` | \`Supplier\`, \`Purchase\` | Track supplier contact info, total purchases, outstanding payable | Supplier balance tracking test |

---

## 4. Sales & Order Management

| Feature | UI Component / View | Backend REST API | Database Models | Business Logic & Rules | Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POS Orders** | \`sales/posorders.tsx\` | \`GET /api/sales?channel=POS\` | \`Sale\`, \`Customer\`, \`User\` | Historical POS orders, cashier ID, receipt reprint | Filter & lookup test |
| **Online Orders** | \`sales/onlineorders.tsx\` | \`GET /api/sales?channel=ONLINE\` | \`Sale\`, \`ShippingDetails\` | Order fulfillment statuses: Pending, Confirmed, Shipped, Delivered | Status transition state machine test |
| **Invoices** | \`sales/invoices.tsx\` | \`GET /api/invoices\`, \`GET /:id/pdf\` | \`Invoice\`, \`Sale\` | Sequential invoice numbering, tax breakdown, PDF generator | Invoice sequence & calculation tests |
| **Quotations** | \`sales/quotationlist.tsx\` | \`GET / POST /api/quotations\`, \`POST /:id/convert\` | \`Quotation\`, \`QuotationItem\` | Price estimates, expiry dates, one-click conversion to sale | Conversion to sale workflow test |
| **Customers Management** | \`people/customers.tsx\` | \`GET / POST / PUT / DELETE /api/customers\` | \`Customer\`, \`Sale\` | Customer credit limit, total orders, loyalty points, receivables | Credit validation on checkout test |

---

## 5. Promotions & Discounts

| Feature | UI Component / View | Backend REST API | Database Models | Business Logic & Rules | Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Coupons** | \`coupons/coupons.tsx\` | \`GET / POST / PUT / DELETE /api/coupons\` | \`Coupon\` | Fixed vs percentage, min spend, start/end dates, max uses | Coupon application & validation tests |
| **Gift Cards** | \`coupons/giftcards.tsx\` | \`GET / POST /api/giftcards\` | \`GiftCard\`, \`GiftCardTransaction\` | Unique 16-digit code, PIN, remaining balance deduction | Gift card checkout & balance test |
| **Discount Plans** | \`coupons/discountplan.tsx\` | \`GET / POST /api/discount-plans\` | \`DiscountPlan\`, \`Discount\` | Customer-tier pricing (Wholesale, VIP, Retail) | Tier-based price resolution test |

---

## 6. Finance & Double-Entry Accounting

| Feature | UI Component / View | Backend REST API | Database Models | Business Logic & Rules | Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Expenses & Categories** | \`FinanceAccounts/expenses.tsx\` | \`GET / POST /api/expenses\` | \`Expense\`, \`ExpenseCategory\` | Cash outflow recording, receipt attachment, store allocation | Expense posting test |
| **Income & Categories** | \`FinanceAccounts/income.tsx\` | \`GET / POST /api/income\` | \`Income\`, \`IncomeCategory\` | Non-sales revenue tracking, bank deposit tracking | Income recording test |
| **Bank Accounts & Transfer** | \`FinanceAccounts/bankaccounts.tsx\`, \`moneytransfer.tsx\` | \`GET / POST /api/accounts/transfer\` | \`Account\`, \`MoneyTransfer\` | Inter-account fund transfers, balances reconciliation | Transfer atomicity test |
| **Double-Entry Ledger** | Internal accounting service | Automatic trigger | \`JournalEntry\`, \`JournalLine\` | Debit = Credit balance for every sales, purchase, and expense transaction | Invariant test: sum(Debit) == sum(Credit) |
| **Balance Sheet & P&L** | \`FinanceAccounts/balancesheet.tsx\`, \`profitandloss.tsx\` | \`GET /api/reports/balance-sheet\`, \`pnl\` | Ledger queries | Assets = Liabilities + Equity; Revenue - COGS - Expenses | Financial equation integrity tests |

---

## 7. Human Resource Management (HRM)

| Feature | UI Component / View | Backend REST API | Database Models | Business Logic & Rules | Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Employees Directory** | \`hrm/employeeslist.tsx\`, \`employeesgrid.tsx\` | \`GET / POST / PUT /api/employees\` | \`Employee\`, \`Department\`, \`Designation\` | Profile, joining date, store assignment, emergency contact | Employee CRUD test |
| **Attendance Tracking** | \`hrm/attendanceemployee.tsx\`, \`attendanceadmin.tsx\` | \`POST /api/hrm/attendance/clock-in\`, \`clock-out\` | \`Attendance\`, \`Shift\` | Clock in/out with timestamps, late arrival / overtime calculation | Working hours calculation test |
| **Leaves Management** | \`hrm/leavesadmin.tsx\`, \`leavesemployee.tsx\` | \`GET / POST / PUT /api/hrm/leaves\` | \`LeaveRequest\`, \`LeaveType\` | Leave balance quota, manager approval workflow | Approval state transition test |
| **Payroll & Payslips** | \`hrm/payrolllist.tsx\`, \`employeesalary.tsx\` | \`GET / POST /api/hrm/payroll\` | \`Payroll\`, \`EmployeeSalary\` | Basic salary + allowances - deductions = net pay, payslip PDF | Payroll math & payslip generation test |

---

## 8. Reports & Business Analytics

| Feature | UI Component / View | Backend REST API | Database Models | Business Logic & Rules | Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sales & Best Seller Report** | \`Reports/salesreport.tsx\`, \`bestseller.tsx\` | \`GET /api/reports/sales\`, \`best-sellers\` | Aggregated \`Sale\`, \`SaleItem\` | Date range, store filter, cashier filter, top 10 items | Aggregation accuracy test |
| **Inventory & Stock History** | \`Reports/inventoryreport.tsx\`, \`stockhistory.tsx\` | \`GET /api/reports/inventory\`, \`stock-movements\` | \`StockBalance\`, \`StockMovement\` | Opening stock + received - sold +/- adjusted = closing stock | Stock audit conservation law test |
| **Customer & Supplier Due** | \`Reports/customerduereport.tsx\`, \`supplierduereport.tsx\`| \`GET /api/reports/receivables\`, \`payables\` | \`Customer\`, \`Supplier\`, \`Sale\`, \`Purchase\` | Aging report (0-30, 31-60, 61-90, 90+ days overdue) | Aging bucket calculation test |
| **Tax & Annual Reports** | \`Reports/taxreport.tsx\`, \`annualreport.tsx\` | \`GET /api/reports/tax\`, \`annual\` | \`Sale\`, \`Purchase\`, \`Tax\` | Output tax - input tax = net tax liability | Tax liability precision test |

---

## 9. Security, RBAC & Settings

| Feature | UI Component / View | Backend REST API | Database Models | Business Logic & Rules | Test Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & Refresh** | \`pages/login.tsx\`, \`register.tsx\` | \`POST /api/auth/login\`, \`refresh\`, \`logout\` | \`User\`, \`RefreshToken\` | JWT access token (15m), HttpOnly refresh token (7d), bcrypt hash | Auth lifecycle & token rotation test |
| **Role-Based Access Control**| \`usermanagement/rolesandpermissions.tsx\` | \`GET / POST / PUT /api/roles\` | \`Role\`, \`Permission\`, \`RolePermission\` | Strict route & endpoint middleware permissions | 403 Forbidden enforcement test |
| **Company & System Settings**| \`settings/companysettings.tsx\`, \`systemsettings.tsx\` | \`GET / PUT /api/settings\` | \`CompanySetting\`, \`SystemSetting\` | Currency code/symbol, tax ID, business name, logo, invoice prefix | Configuration persistence test |
| **Audit Logs** | \`usermanagement/activities.tsx\` | \`GET /api/audit-logs\` | \`AuditLog\` | Automatic logging of critical actions (price changes, refunds, voids) | Tamper-proof audit creation test |
`;

fs.writeFileSync(path.join(__dirname, '..', 'FEATURE_MATRIX.md'), featureMatrix);
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'FEATURE_MATRIX.md'), featureMatrix);
console.log('FEATURE_MATRIX.md generated successfully.');
