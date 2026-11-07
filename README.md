# DreamsPOS — Production Retail POS & Business Management System

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-brightgreen.svg)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)

DreamsPOS is an enterprise-grade full-stack Retail Point of Sale and Comprehensive Business Management System built using React, Vite, TypeScript, Bootstrap 5, Node.js, Express, Prisma ORM, and MySQL.

This implementation faithfully reproduces the licensed DreamsPOS UI/UX design, color palette (`#FE9F43`, `#092C4C`), responsive typography, charts, and all layout variants, combined with real transactional backend workflows and double-entry accounting.

---

## Key Modules & Features

- **Point of Sale (POS)**: 8 distinct POS layouts (POS 1 through POS 8), barcode scanner support, split-tender payments (Cash, Card, Bank, Gift Card), order holding/parking, register shift management, and 58mm/80mm thermal receipt printing.
- **Inventory & Stock**: Multi-warehouse inventory, SKU & Barcode generation, variant attributes, stock adjustments, two-phase stock transfers, low-stock & expiry alerts.
- **Sales & Orders**: POS orders, online orders, quotations with one-click sale conversion, sales returns with automatic restock, PDF invoice generation.
- **Purchases**: Supplier management, purchase orders, purchase returns, receiving inventory updates.
- **Finance & Accounting**: Double-entry journal ledger, trial balance, balance sheet, profit & loss, expenses, income, bank accounts.
- **HRM**: Employee directory, shifts, clock-in/out attendance, leave management, payroll & payslips.
- **Reports**: 19 real-time database-driven reports with date filters, export to CSV/Excel/PDF.
- **User Management & RBAC**: Granular permissions, role assignment, audit trail logging.
- **System Settings**: Localization, currency, tax rates, custom fields, SMS/Email integrations.

---

## Monorepo Architecture

- `apps/web`: React 19 + TypeScript frontend with Vite and licensed DreamsPOS assets
- `apps/api`: Node.js + Express + TypeScript REST API
- `packages/shared`: Shared types, DTOs, and Zod schemas
- `database`: Prisma schema, migrations, and seed scripts
- `docker`: Dockerfiles and multi-container Compose setup
- `docs`: Full specifications and checklists:
  - [`PAGE_INVENTORY.md`](docs/PAGE_INVENTORY.md)
  - [`FEATURE_MATRIX.md`](docs/FEATURE_MATRIX.md)
  - [`VISUAL_PARITY_CHECKLIST.md`](docs/VISUAL_PARITY_CHECKLIST.md)
  - [`DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md)
  - [`ARCHITECTURE.md`](docs/ARCHITECTURE.md)
  - [`API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)
  - [`INSTALLATION.md`](INSTALLATION.md)
  - [`IMPLEMENTATION_PROGRESS.md`](docs/IMPLEMENTATION_PROGRESS.md)
  - [`KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Setup Database
npm run db:migrate
npm run db:seed

# 4. Start Application
npm run dev
```

Visit `http://localhost:3000` for the Web Application and `http://localhost:5000/api` for the Backend REST API.
Default Admin: `admin@dreamspos.com` / `Admin@12345`

For detailed setup, see [INSTALLATION.md](INSTALLATION.md).
