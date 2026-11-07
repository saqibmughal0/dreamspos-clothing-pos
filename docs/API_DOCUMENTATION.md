# DreamsPOS REST API Documentation

Base URL: `http://localhost:5000/api`

## Authentication & Authorization
All secured endpoints require the `Authorization: Bearer <access_token>` header. Refresh tokens are stored in secure HttpOnly cookies (`refreshToken`).

---

## 1. Authentication (`/api/auth`)

### POST `/api/auth/login`
- **Body**: `{ "email": "admin@example.com", "password": "Password123!" }`
- **Response 200**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_uuid",
      "name": "Super Admin",
      "email": "admin@example.com",
      "role": "SUPER_ADMIN"
    },
    "accessToken": "eyJhbGciOi..."
  }
}
```

### POST `/api/auth/refresh`
- **Cookie**: `refreshToken=...`
- **Response 200**: `{ "success": true, "data": { "accessToken": "new_token" } }`

### POST `/api/auth/logout`
- Clears refresh token cookie and invalidates session in DB.

---

## 2. Dashboard Analytics (`/api/dashboard`)

### GET `/api/dashboard/summary`
- **Query**: `?storeId=store_uuid&startDate=2026-01-01&endDate=2026-11-06`
- **Response 200**:
```json
{
  "success": true,
  "data": {
    "totalSales": 145890.50,
    "totalPurchases": 84210.00,
    "totalExpenses": 12400.00,
    "netProfit": 49280.50,
    "salesCount": 1240,
    "customerCount": 890,
    "lowStockCount": 14
  }
}
```

### GET `/api/dashboard/sales-trend`
- Returns monthly / daily sales aggregates for ApexCharts.

---

## 3. Products & Inventory (`/api/products`)

### GET `/api/products`
- **Query**: `?page=1&limit=10&search=keyword&categoryId=...&brandId=...`
- **Response 200**: Returns paginated products list.

### POST `/api/products`
- **Body**:
```json
{
  "name": "Lenovo 3rd Generation",
  "sku": "PT001",
  "barcode": "123456789012",
  "categoryId": "cat_uuid",
  "brandId": "brd_uuid",
  "unitId": "unt_uuid",
  "costPrice": 450.00,
  "sellingPrice": 600.00,
  "taxRate": 10.0,
  "taxType": "EXCLUSIVE",
  "alertQuantity": 5
}
```

### GET `/api/products/barcode/:code`
- Quick lookup for POS barcode scanner wedge.

---

## 4. Point of Sale Checkout (`/api/pos`)

### POST `/api/pos/checkout`
- **Idempotency Header**: `Idempotency-Key: uuid`
- **Body**:
```json
{
  "storeId": "store_uuid",
  "customerId": "cust_uuid",
  "channel": "POS",
  "items": [
    {
      "productId": "prod_uuid",
      "quantity": 2,
      "unitPrice": 600.00,
      "discountAmount": 0.00
    }
  ],
  "orderDiscount": 50.00,
  "shippingFee": 0.00,
  "payments": [
    { "method": "CASH", "amount": 1000.00 },
    { "method": "CARD", "amount": 150.00 }
  ],
  "notes": "Fast customer checkout"
}
```
- **Response 201**:
```json
{
  "success": true,
  "data": {
    "saleId": "sale_uuid",
    "invoiceNumber": "INV-20261106-0001",
    "totalAmount": 1150.00,
    "paidAmount": 1150.00,
    "changeDue": 0.00,
    "status": "COMPLETED"
  }
}
```

### POST `/api/pos/register/open`
- Opens cashier shift with opening float.

### POST `/api/pos/register/close`
- Closes shift, records physical cash count, computes expected vs actual discrepancy.

---

## 5. Sales & Invoices (`/api/sales`)

- `GET /api/sales` - Filterable sales list
- `GET /api/sales/:id` - Complete sale details with line items and payments
- `POST /api/sales/returns` - Process partial or full sales return with auto inventory restock
- `GET /api/invoices/:id/pdf` - Generates PDF invoice

---

## 6. Purchases (`/api/purchases`)

- `GET /api/purchases` - Paginated purchases
- `POST /api/purchases` - Create purchase order, increment warehouse inventory, log payable
- `POST /api/purchases/returns` - Return purchased stock to supplier

---

## 7. Reports (`/api/reports`)

- `GET /api/reports/sales`
- `GET /api/reports/best-sellers`
- `GET /api/reports/inventory`
- `GET /api/reports/profit-and-loss`
- `GET /api/reports/tax`
- `GET /api/reports/customer-due`
- `GET /api/reports/supplier-due`

---

## 8. HRM & People (`/api/hrm`, `/api/people`)

- `GET/POST /api/customers`
- `GET/POST /api/suppliers`
- `GET/POST /api/employees`
- `POST /api/hrm/attendance/clock-in`
- `POST /api/hrm/attendance/clock-out`
- `GET/POST /api/hrm/leaves`
- `GET/POST /api/hrm/payroll`
