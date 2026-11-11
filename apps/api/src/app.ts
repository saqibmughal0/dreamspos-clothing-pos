import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { productRouter } from "./modules/products/product.routes";
import { posRouter } from "./modules/pos/pos.routes";
import { customerRouter } from "./modules/customers/customer.routes";
import { supplierRouter } from "./modules/suppliers/supplier.routes";
import { saleRouter } from "./modules/sales/sale.routes";
import { inventoryRouter } from "./modules/inventory/inventory.routes";
import { purchaseRouter } from "./modules/purchases/purchase.routes";
import { financeRouter } from "./modules/finance/finance.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { settingsRouter } from "./modules/settings/settings.routes";

export const app = express();

const allowedOrigins = [
  config.frontendUrl,
  config.frontendUrl?.replace(/\/$/, ""),
  "https://dreamspos-clothing-pos.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173"
].filter(Boolean) as string[];

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes(cleanOrigin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Root Welcome Endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "DreamsPOS API",
    version: "1.0.0",
    health: "/api/health"
  });
});

// Health Check
app.get(["/api/health", "/health"], (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: config.env
  });
});

// Mount Module Routes
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/products", productRouter);
app.use("/api/pos", posRouter);
app.use("/api/customers", customerRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/sales", saleRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/purchases", purchaseRouter);
app.use("/api/finance", financeRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/settings", settingsRouter);

// Centralized Error Handler
app.use(errorHandler);

export default app;
