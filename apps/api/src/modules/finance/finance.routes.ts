import { Router } from "express";
import { financeController } from "./finance.controller";
import { authenticate, requireRoles } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  ExpenseCategoryCreateSchema,
  ExpenseCreateSchema,
  JournalEntryCreateSchema,
  UserRole
} from "@dreamspos/shared";

export const financeRouter = Router();

financeRouter.use(authenticate);

financeRouter.get("/expense-categories", financeController.listExpenseCategories);
financeRouter.post("/expense-categories", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), validateBody(ExpenseCategoryCreateSchema), financeController.createExpenseCategory);

financeRouter.get("/expenses", financeController.listExpenses);
financeRouter.post("/expenses", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), validateBody(ExpenseCreateSchema), financeController.createExpense);

financeRouter.get("/accounts", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN]), financeController.listAccounts);

financeRouter.get("/journal-entries", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN]), financeController.listJournalEntries);
financeRouter.post("/journal-entries", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN]), validateBody(JournalEntryCreateSchema), financeController.createJournalEntry);

financeRouter.get("/profit-loss", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), financeController.getProfitAndLoss);
