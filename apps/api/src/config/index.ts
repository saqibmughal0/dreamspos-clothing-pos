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
  databaseUrl: process.env.DATABASE_URL
};
