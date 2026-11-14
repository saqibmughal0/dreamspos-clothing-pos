import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  jwt: {
    secret: process.env.JWT_SECRET || "default_jwt_secret_dreamspos_must_be_changed",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "default_jwt_refresh_secret_dreamspos",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || ""
  },
  email: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM || "MR Bilal POS <noreply@mrbilal.com>"
  },
  uploadsDir: path.resolve(__dirname, "../../uploads"),
  databaseUrl: process.env.DATABASE_URL
};
