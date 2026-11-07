# DreamsPOS Installation & Setup Guide

## Prerequisites

- **Node.js**: v20.x or v22.x LTS
- **npm** (v10+) or **pnpm** (v9+)
- **MySQL**: 8.0+ or **Docker Desktop**
- **Git**

---

## 1. Quick Start with Local Node & MySQL

### Step 1: Clone and Install Dependencies
```bash
cd "d:\Dreams POS"
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the root and in `apps/api/.env`:
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

Ensure your MySQL connection string in `apps/api/.env` is valid:
```env
DATABASE_URL="mysql://root:password@localhost:3306/dreamspos?schema=public"
JWT_SECRET="super-secret-jwt-key-change-in-production-min-32-chars"
JWT_REFRESH_SECRET="super-secret-jwt-refresh-key-change-in-production-min-32-chars"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

### Step 3: Run Database Migrations and Seed
```bash
# Generate Prisma Client & Run Migrations
npm run db:migrate

# Seed Demo Data (Stores, Warehouses, Products, Users, Categories, Settings)
npm run db:seed
```

### Step 4: Start Development Servers
Run both backend API and frontend React application concurrently:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:5000/api`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 2. Default Seed Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@dreamspos.com` | `Admin@12345` | Unrestricted full access to all modules, SaaS tenants, settings |
| **Store Manager** | `manager@dreamspos.com` | `Manager@12345` | Inventory, stock transfers, purchases, reports, staff |
| **POS Cashier** | `cashier@dreamspos.com` | `Cashier@12345` | Point of Sale, order holding, customer checkout, receipt reprint |

---

## 3. Alternative: Running with Docker Compose

If you prefer to run MySQL and the services inside Docker:
```bash
docker-compose up -d
```
This spins up:
- `mysql`: Port `3306`
- `dreamspos-api`: Port `5000`
- `dreamspos-web`: Port `3000`

---

## 4. Running Automated Tests

```bash
# Run backend API tests (Supertest + Vitest)
npm run test:api

# Run frontend tests (React Testing Library + Vitest)
npm run test:web

# Run full end-to-end POS flow tests
npm run test:e2e
```
