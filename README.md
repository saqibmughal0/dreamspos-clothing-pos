# DreamsPOS — Single-Brand Clothing Retail POS & Business Management System

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-brightgreen.svg)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

DreamsPOS is an enterprise-grade full-stack single-brand clothing retail Point of Sale (POS) and inventory management platform. Built with React 19, Vite, TypeScript, Express, Prisma ORM, and MySQL, it preserves the authentic licensed DreamsPOS UI/UX, responsive color schemes, layouts, and components while running real-world transactional apparel retail workflows.

---

## Key Clothing Retail Capabilities

- **Garment Matrix & Variant Architecture**: Individual SKU, barcode, size, color, fabric composition, season, and real-time inventory tracking for every variant item.
- **Point of Sale (POS)**: Multiple layout modes (POS 1 through POS 8), barcode scanner support, split-tender checkout (Cash, Card, Bank, Gift Card), register shift balancing, and 58mm/80mm thermal receipt generation.
- **Garment Exchange & Returns**: Line-item returns and cross-variant garment exchanges with automatic price difference balancing and inventory restock.
- **Inventory & Warehouse Operations**: Multi-warehouse stock tracking, stock in/out adjustments, transfer orders with dispatch and receive stages, low-stock threshold alerts.
- **Apparel Analytics & Reporting**: Real-time sales velocity, sell-through rate, inventory aging, top-performing articles, size/color breakdown, supplier performance, and Profit & Loss reports with CSV/PDF export.
- **Role-Based Access Control (RBAC)**: 4 distinct role levels enforced at both backend API and frontend route levels: Super Admin, Store Manager, Cashier, and Inventory Clerk.
- **Single-Brand Customization**: Company identity, logo, receipt headers/footers, tax schemes, currency, and barcode label printing.

---

## Monorepo Project Structure

```text
Dreams POS/
├── apps/
│   ├── api/             # Node.js + Express + TypeScript REST API
│   │   ├── src/
│   │   │   ├── modules/ # Feature modules (auth, pos, sales, products, inventory, reports, etc.)
│   │   │   ├── middleware/ # Auth, validation, error handling
│   │   │   └── utils/   # Errors, decimals, logging
│   │   └── test/        # Vitest automated test suites
│   └── web/             # React 19 + TypeScript + Vite frontend
│       ├── src/
│       │   ├── feature-module/ # POS, inventory, reports, pages, auth
│       │   ├── core/           # API client, store, hooks, modals
│       │   └── style/          # Licensed DreamsPOS SCSS, icons, themes
│       └── test/        # Frontend unit and component tests
├── database/            # Prisma schema, migrations, seed scripts
│   ├── prisma/          # schema.prisma, migrations/
│   └── seed/            # Idempotent database seed script
├── packages/
│   └── shared/          # Shared types, Zod DTO validation schemas, enums
├── docker/              # Dockerfiles for containerized deployment
├── docker-compose.yml   # Multi-service Compose orchestrator (MySQL, API, Web)
├── docs/                # Architecture specifications and implementation records
└── package.json         # Workspace root with orchestrated concurrently scripts
```

---

## Seeded Default Accounts

The database seed populates 4 test accounts for all RBAC tiers:

| Role | Email | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@dreamspos.com` | `Admin@12345` | Unrestricted system-wide access |
| **Store Manager** | `manager@dreamspos.com` | `Manager@12345` | Store operations, inventory, and analytics |
| **Cashier** | `cashier@dreamspos.com` | `Cashier@12345` | POS checkout, order hold, receipt printing |
| **Inventory Clerk** | `clerk@dreamspos.com` | `Clerk@12345` | Stock in/out, adjustments, barcode generation |

---

## Getting Started

### Prerequisites

- **Node.js**: v20+ or v22 LTS
- **npm**: v10+
- **MySQL**: v8.0 local instance OR Docker installed

---

### Step 1 — Clone and Install Dependencies

```bash
git clone <repository-url>
cd dreamspos-clothing-pos
npm install
```

---

### Step 2 — Configure Environment Variables

Copy the safe example environment template:

```bash
cp .env.example .env
```

Edit `.env` with your MySQL database credentials and secure random JWT secret strings:

```dotenv
PORT=5000
FRONTEND_URL=http://localhost:3000
DATABASE_URL="mysql://root:your_db_password@localhost:3306/dreamspos"
JWT_SECRET="replace-with-a-secure-random-32-char-string"
JWT_REFRESH_SECRET="replace-with-another-secure-random-string"
```

---

### Step 3 — Database Setup & Seeding

Option A: Using Local MySQL Server
Ensure your MySQL server is running on port `3306` with the `dreamspos` database created:

```bash
# Generate Prisma Client
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed clothing catalog, RBAC users, and warehouses
npm run db:seed
```

Option B: Using Docker Compose for MySQL
```bash
docker compose up -d mysql
npm run db:generate
npm run db:migrate
npm run db:seed
```

---

### Step 4 — Run the Development Servers

Run both the Express API and Vite React frontend concurrently in one terminal:

```bash
npm run dev
```

Or run each service individually in separate terminals:

```bash
# Terminal 1 — Express Backend API (Port 5000)
npm run dev:api

# Terminal 2 — React + Vite Frontend (Port 3000)
npm run dev:web
```

---

## Local Service URLs

- **Web Frontend**: [http://localhost:3000](http://localhost:3000)
- **Sign In Page**: [http://localhost:3000/signin](http://localhost:3000/signin)
- **POS Screen**: [http://localhost:3000/pos](http://localhost:3000/pos)
- **Backend API Health**: [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

---

## Testing & Production Builds

```bash
# Run all tests across the monorepo
npm run test

# Run backend API test suite
npm run test:api

# Run web frontend test suite
npm run test:web

# Production build
npm run build:api
npm run build:web
```

---

## Security Guidance

- **Never Commit Secrets**: Real credentials, `.env` files, `.sql` dumps, and private certificates are strictly excluded via `.gitignore`.
- **Environment Interpolation**: Production Docker configurations use variable interpolation (`${DATABASE_URL}`, `${JWT_SECRET}`) rather than hardcoded credentials.
- **JWT Refresh Cookie**: Authentication tokens use short-lived access tokens and secure HTTP-only refresh cookies.

---

## License & Attribution

The DreamsPOS interface, styles, fonts, and assets are licensed materials. Source distribution is intended solely for private repository use and deployment of the single authorized retail POS application.
>>>>>>> master
