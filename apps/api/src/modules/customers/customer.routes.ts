import { Router } from "express";
import { customerController } from "./customer.controller";
import { authenticate } from "../../middleware/auth";

export const customerRouter = Router();

customerRouter.use(authenticate);

customerRouter.get("/", customerController.list);
customerRouter.post("/", customerController.create);
