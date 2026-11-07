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

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Mount Module Routes
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/products", productRouter);
app.use("/api/pos", posRouter);
app.use("/api/customers", customerRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/sales", saleRouter);

// Centralized Error Handler
app.use(errorHandler);
