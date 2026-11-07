# DreamsPOS MySQL Database Schema Specification

This document specifies the normalized relational database architecture designed for DreamsPOS, built with MySQL 8+ and Prisma ORM.

## Architecture Highlights
- **Engine**: MySQL 8.0+ (InnoDB)
- **Monetary Storage**: Strict \`DECIMAL(14, 4)\` to prevent IEEE 754 floating point imprecision.
- **Transactions**: Multi-table ACID transactions for all inventory movements, checkout payments, and ledger entries.
- **Auditability**: Every mutation triggers an immutable audit log entry.
- **Multi-Tenancy**: Built-in support for tenant isolation (\`tenant_id\`, \`company_id\`, \`store_id\`).

---

## 1. Multi-Tenancy, Users & RBAC

### \`companies\`
| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | VARCHAR(36) | PRIMARY KEY, UUID | Unique company identifier |
| \`name\` | VARCHAR(191) | NOT NULL | Registered business name |
| \`code\` | VARCHAR(50) | UNIQUE, NOT NULL | Short unique company code |
| \`email\` | VARCHAR(191) | NOT NULL | Contact email |
| \`phone\` | VARCHAR(50) | NULL | Contact telephone |
| \`currency\` | VARCHAR(10) | NOT NULL DEFAULT 'USD'| Operating currency code |
| \`created_at\` | DATETIME(3) | NOT NULL DEFAULT NOW()| Record creation timestamp |
| \`updated_at\` | DATETIME(3) | NOT NULL DEFAULT NOW()| Record last update timestamp |

### \`stores\`
| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | VARCHAR(36) | PRIMARY KEY, UUID | Unique store location ID |
| \`company_id\` | VARCHAR(36) | FOREIGN KEY -> companies(id) | Associated company |
| \`name\` | VARCHAR(191) | NOT NULL | Store display name |
| \`code\` | VARCHAR(50) | NOT NULL | Store code (e.g., 'STORE-001') |
| \`address\` | TEXT | NULL | Physical address |
| \`phone\` | VARCHAR(50) | NULL | Store phone |
| \`is_active\` | BOOLEAN | NOT NULL DEFAULT TRUE | Active operational flag |

### \`warehouses\`
| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | VARCHAR(36) | PRIMARY KEY, UUID | Warehouse identifier |
| \`company_id\` | VARCHAR(36) | FOREIGN KEY -> companies(id) | Associated company |
| \`name\` | VARCHAR(191) | NOT NULL | Warehouse name |
| \`code\` | VARCHAR(50) | NOT NULL | Unique warehouse code |
| \`phone\` | VARCHAR(50) | NULL | Contact phone |
| \`email\` | VARCHAR(191) | NULL | Contact email |
| \`address\` | TEXT | NULL | Warehouse address |

### \`users\`
| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | VARCHAR(36) | PRIMARY KEY, UUID | User identifier |
| \`company_id\` | VARCHAR(36) | FOREIGN KEY -> companies(id) | Tenant company |
| \`store_id\` | VARCHAR(36) | NULL, FOREIGN KEY -> stores(id)| Assigned primary store |
| \`name\` | VARCHAR(191) | NOT NULL | Full user name |
| \`email\` | VARCHAR(191) | UNIQUE, NOT NULL | Authentication email |
| \`password_hash\`| VARCHAR(255) | NOT NULL | Argon2 / bcrypt hashed password |
| \`role_id\` | VARCHAR(36) | FOREIGN KEY -> roles(id) | User primary role |
| \`avatar\` | VARCHAR(255) | NULL | Profile image URL |
| \`is_active\` | BOOLEAN | NOT NULL DEFAULT TRUE | Account active flag |
| \`created_at\` | DATETIME(3) | NOT NULL DEFAULT NOW() | Creation timestamp |

### \`roles\` & \`permissions\`
- \`roles\`: (\`id\`, \`name\`, \`description\`, \`is_system\`)
- \`permissions\`: (\`id\`, \`slug\`, \`module\`, \`description\`)
- \`role_permissions\`: (\`role_id\`, \`permission_id\`)

---

## 2. Products & Inventory Architecture

### \`categories\` & \`subcategories\`
- \`categories\`: (\`id\`, \`name\`, \`code\`, \`slug\`, \`image\`, \`is_active\`)
- \`subcategories\`: (\`id\`, \`category_id\`, \`name\`, \`code\`, \`description\`)

### \`brands\` & \`units\`
- \`brands\`: (\`id\`, \`name\`, \`image\`, \`description\`)
- \`units\`: (\`id\`, \`name\`, \`short_name\`, \`allow_decimal\`)

### \`products\`
| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | VARCHAR(36) | PRIMARY KEY, UUID | Product ID |
| \`company_id\` | VARCHAR(36) | FOREIGN KEY -> companies(id) | Associated company |
| \`name\` | VARCHAR(191) | NOT NULL | Product title |
| \`sku\` | VARCHAR(100) | UNIQUE, NOT NULL | Stock Keeping Unit |
| \`barcode\` | VARCHAR(100) | INDEX, NULL | Primary barcode / UPC / EAN |
| \`category_id\` | VARCHAR(36) | FOREIGN KEY -> categories(id)| Product category |
| \`brand_id\` | VARCHAR(36) | NULL, FOREIGN KEY -> brands(id)| Product brand |
| \`unit_id\` | VARCHAR(36) | FOREIGN KEY -> units(id) | Measuring unit |
| \`cost_price\` | DECIMAL(14, 4)| NOT NULL DEFAULT 0.0000 | Purchase cost |
| \`selling_price\`| DECIMAL(14, 4)| NOT NULL DEFAULT 0.0000 | Standard retail price |
| \`tax_rate\` | DECIMAL(6, 2) | NOT NULL DEFAULT 0.00 | VAT / Sales tax percentage |
| \`tax_type\` | ENUM | 'EXCLUSIVE', 'INCLUSIVE' | Tax calculation method |
| \`alert_quantity\`| INT | NOT NULL DEFAULT 10 | Low stock threshold alert |
| \`is_active\` | BOOLEAN | NOT NULL DEFAULT TRUE | Active flag |
| \`image\` | VARCHAR(255) | NULL | Main product thumbnail |
| \`description\` | TEXT | NULL | Detailed product description |

### \`stock_balances\`
| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | VARCHAR(36) | PRIMARY KEY, UUID | Balance record ID |
| \`product_id\` | VARCHAR(36) | FOREIGN KEY -> products(id) | Linked product |
| \`warehouse_id\`| VARCHAR(36) | FOREIGN KEY -> warehouses(id)| Linked warehouse |
| \`quantity\` | DECIMAL(14, 4)| NOT NULL DEFAULT 0.0000 | Current stock on hand |
| UNIQUE(\`product_id\`, \`warehouse_id\`) | Unique compound index | One row per product/warehouse |

### \`stock_movements\`
Audit table for every addition, deduction, transfer, or return:
(\`id\`, \`product_id\`, \`warehouse_id\`, \`type\`, \`quantity\`, \`reference_type\`, \`reference_id\`, \`notes\`, \`created_at\`, \`created_by\`)
Where \`type\` IN ('PURCHASE', 'SALE', 'SALE_RETURN', 'PURCHASE_RETURN', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT_ADD', 'ADJUSTMENT_SUB').

---

## 3. Point of Sale & Sales Transactions

### \`cash_registers\` & \`cash_register_sessions\`
- \`cash_registers\`: (\`id\`, \`store_id\`, \`name\`, \`terminal_id\`, \`is_active\`)
- \`cash_register_sessions\`: (\`id\`, \`register_id\`, \`user_id\`, \`opened_at\`, \`closed_at\`, \`opening_float\`, \`closing_cash\`, \`expected_cash\`, \`difference\`, \`status\`)

### \`sales\`
| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | VARCHAR(36) | PRIMARY KEY, UUID | Sale transaction ID |
| \`company_id\` | VARCHAR(36) | FOREIGN KEY -> companies(id) | Tenant company |
| \`store_id\` | VARCHAR(36) | FOREIGN KEY -> stores(id) | Sale location |
| \`register_session_id\`| VARCHAR(36)| NULL, FOREIGN KEY | Linked shift session |
| \`invoice_number\`| VARCHAR(100) | UNIQUE, NOT NULL | Sequential invoice code |
| \`customer_id\` | VARCHAR(36) | NULL, FOREIGN KEY -> customers(id)| Customer (walk-in if null) |
| \`cashier_id\` | VARCHAR(36) | FOREIGN KEY -> users(id) | User who finalized sale |
| \`subtotal\` | DECIMAL(14, 4)| NOT NULL | Total before discount/tax |
| \`discount_amount\`| DECIMAL(14, 4)| NOT NULL DEFAULT 0.0000 | Order level discount |
| \`tax_amount\` | DECIMAL(14, 4)| NOT NULL DEFAULT 0.0000 | Total calculated tax |
| \`shipping_fee\`| DECIMAL(14, 4)| NOT NULL DEFAULT 0.0000 | Shipping charge |
| \`total_amount\`| DECIMAL(14, 4)| NOT NULL | Final invoice total payable |
| \`paid_amount\` | DECIMAL(14, 4)| NOT NULL DEFAULT 0.0000 | Total tender received |
| \`due_amount\` | DECIMAL(14, 4)| NOT NULL DEFAULT 0.0000 | Remaining unpaid balance |
| \`status\` | ENUM | 'COMPLETED', 'PENDING', 'CANCELLED'| Sale status |
| \`payment_status\`| ENUM | 'PAID', 'PARTIAL', 'DUE' | Payment status |
| \`channel\` | ENUM | 'POS', 'ONLINE', 'MANUAL' | Sales channel |
| \`notes\` | TEXT | NULL | Optional customer/staff notes |
| \`created_at\` | DATETIME(3) | NOT NULL DEFAULT NOW() | Transaction timestamp |

### \`sale_items\`
(\`id\`, \`sale_id\`, \`product_id\`, \`quantity\`, \`unit_price\`, \`discount_amount\`, \`tax_amount\`, \`total_price\`)

### \`payments\`
(\`id\`, \`sale_id\`, \`method\`, \`amount\`, \`reference_number\`, \`created_at\`, \`received_by\`)
Where \`method\` IN ('CASH', 'CARD', 'BANK_TRANSFER', 'GIFT_CARD', 'POINTS', 'SPLIT').

---

## 4. Purchases & Suppliers
- \`suppliers\`: (\`id\`, \`company_id\`, \`name\`, \`email\`, \`phone\`, \`address\`, \`opening_balance\`, \`current_balance\`)
- \`purchases\`: (\`id\`, \`company_id\`, \`warehouse_id\`, \`supplier_id\`, \`purchase_number\`, \`subtotal\`, \`tax_amount\`, \`total_amount\`, \`paid_amount\`, \`status\`, \`payment_status\`, \`created_at\`)
- \`purchase_items\`: (\`id\`, \`purchase_id\`, \`product_id\`, \`quantity\`, \`unit_cost\`, \`tax_amount\`, \`total_cost\`)

---

## 5. Double-Entry Accounting
- \`accounts\`: (\`id\`, \`company_id\`, \`account_number\`, \`name\`, \`type\`, \`balance\`)
  Where \`type\` IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE').
- \`journal_entries\`: (\`id\`, \`company_id\`, \`entry_number\`, \`date\`, \`reference_type\`, \`reference_id\`, \`memo\`, \`created_at\`)
- \`journal_lines\`: (\`id\`, \`journal_entry_id\`, \`account_id\`, \`debit\`, \`credit\`, \`description\`)
  Enforced database invariant: \`SUM(debit) == SUM(credit)\`.

---

## 6. Audit & System Configuration
- \`audit_logs\`: (\`id\`, \`user_id\`, \`action\`, \`entity_type\`, \`entity_id\`, \`old_values\`, \`new_values\`, \`ip_address\`, \`created_at\`)
- \`settings\`: (\`id\`, \`company_id\`, \`group\`, \`key\`, \`value\`)
`;

fs.writeFileSync(path.join(__dirname, '..', 'DATABASE_SCHEMA.md'), checklist);
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'DATABASE_SCHEMA.md'), checklist);
console.log('DATABASE_SCHEMA.md generated successfully.');
