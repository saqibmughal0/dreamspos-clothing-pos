import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";
import { requireRoles } from "../../middleware/auth";
import { UserRole } from "@dreamspos/shared";

export const financeExtendedRouter = Router();
const financeRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER];

// --- INCOME CATEGORIES ---
financeExtendedRouter.get("/income-categories", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.incomeCategory.findMany({
      where: { companyId },
      include: { _count: { select: { incomes: true } } },
      orderBy: { name: "asc" }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

financeExtendedRouter.post("/income-categories", requireRoles(financeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, code, description } = req.body;
    if (!name || !String(name).trim()) {
      res.status(400).json({ success: false, message: "Income category name is required" });
      return;
    }
    const created = await prisma.incomeCategory.create({
      data: {
        companyId,
        name: String(name).trim(),
        code: code ? String(code).trim().toUpperCase() : "INC-" + Date.now().toString().slice(-4),
        description: description || null
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

financeExtendedRouter.delete("/income-categories/:id", requireRoles(financeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.incomeCategory.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Income category not found" });
      return;
    }
    await prisma.incomeCategory.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Income category deleted" });
  } catch (err) { next(err); }
});

// --- INCOMES ---
financeExtendedRouter.get("/incomes", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.income.findMany({
      where: { companyId },
      include: { category: true },
      orderBy: { date: "desc" }
    });
    res.json({
      success: true,
      data: {
        items: items.map(i => ({
          id: i.id,
          incomeNumber: i.incomeNumber,
          categoryId: i.categoryId,
          categoryName: i.category?.name || "",
          amount: Number(i.amount),
          paymentMethod: i.paymentMethod,
          referenceNumber: i.referenceNumber,
          date: i.date.toISOString(),
          notes: i.notes
        }))
      }
    });
  } catch (err) { next(err); }
});

financeExtendedRouter.post("/incomes", requireRoles(financeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { categoryId, amount, paymentMethod, referenceNumber, date, notes } = req.body;
    if (!categoryId || !amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, message: "Category and positive amount are required" });
      return;
    }
    const created = await prisma.income.create({
      data: {
        companyId,
        categoryId,
        incomeNumber: "INC-" + Date.now().toString().slice(-6),
        amount: Number(amount),
        paymentMethod: paymentMethod || "CASH",
        referenceNumber: referenceNumber || null,
        date: date ? new Date(date) : new Date(),
        notes: notes || null
      },
      include: { category: true }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

financeExtendedRouter.delete("/incomes/:id", requireRoles(financeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.income.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Income record not found" });
      return;
    }
    await prisma.income.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Income deleted" });
  } catch (err) { next(err); }
});

// --- MONEY TRANSFERS ---
financeExtendedRouter.get("/money-transfers", requireRoles(financeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const [transfers, accounts] = await Promise.all([
      prisma.moneyTransfer.findMany({ where: { companyId }, orderBy: { date: "desc" } }),
      prisma.account.findMany({ where: { companyId } })
    ]);
    const accMap = new Map(accounts.map(a => [a.id, `${a.name} (${a.accountNumber})`]));
    res.json({
      success: true,
      data: {
        items: transfers.map(t => ({
          id: t.id,
          referenceNumber: t.referenceNumber,
          fromAccountId: t.fromAccountId,
          fromAccountName: accMap.get(t.fromAccountId) || t.fromAccountId,
          toAccountId: t.toAccountId,
          toAccountName: accMap.get(t.toAccountId) || t.toAccountId,
          amount: Number(t.amount),
          date: t.date.toISOString(),
          notes: t.notes
        }))
      }
    });
  } catch (err) { next(err); }
});

financeExtendedRouter.post("/money-transfers", requireRoles(financeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { fromAccountId, toAccountId, amount, date, notes } = req.body;
    const amt = Number(amount || 0);
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId || amt <= 0) {
      res.status(400).json({ success: false, message: "Distinct source/destination accounts and positive amount are required" });
      return;
    }
    const result = await prisma.$transaction(async (tx) => {
      const fromAcc = await tx.account.findFirst({ where: { id: fromAccountId, companyId } });
      const toAcc = await tx.account.findFirst({ where: { id: toAccountId, companyId } });
      if (!fromAcc || !toAcc) throw new Error("Source or destination account not found");

      await tx.account.update({ where: { id: fromAcc.id }, data: { balance: { decrement: amt } } });
      await tx.account.update({ where: { id: toAcc.id }, data: { balance: { increment: amt } } });

      return await tx.moneyTransfer.create({
        data: {
          companyId,
          fromAccountId,
          toAccountId,
          referenceNumber: "TRF-" + Date.now().toString().slice(-6),
          amount: amt,
          date: date ? new Date(date) : new Date(),
          notes: notes || null
        }
      });
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// --- BALANCE SHEET ---
financeExtendedRouter.get("/balance-sheet", requireRoles(financeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const accounts = await prisma.account.findMany({ where: { companyId }, orderBy: { accountNumber: "asc" } });
    const items = accounts.map(a => ({
      id: a.id,
      name: a.name,
      accountNumber: a.accountNumber,
      type: a.type,
      balance: Number(a.balance || 0),
      credit: a.type === "LIABILITY" || a.type === "EQUITY" || a.type === "REVENUE" ? Number(a.balance || 0) : 0,
      debit: a.type === "ASSET" || a.type === "EXPENSE" ? Number(a.balance || 0) : 0
    }));
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

// --- TRIAL BALANCE ---
financeExtendedRouter.get("/trial-balance", requireRoles(financeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const accounts = await prisma.account.findMany({ where: { companyId }, orderBy: { accountNumber: "asc" } });
    const items = accounts.map(a => {
      const bal = Number(a.balance || 0);
      const isDebitNormal = a.type === "ASSET" || a.type === "EXPENSE";
      return {
        id: a.id,
        accountNumber: a.accountNumber,
        name: a.name,
        type: a.type,
        debit: isDebitNormal ? Math.max(0, bal) : Math.max(0, -bal),
        credit: !isDebitNormal ? Math.max(0, bal) : Math.max(0, -bal)
      };
    });
    const totalDebit = items.reduce((s, x) => s + x.debit, 0);
    const totalCredit = items.reduce((s, x) => s + x.credit, 0);
    res.json({ success: true, data: { items, totalDebit, totalCredit } });
  } catch (err) { next(err); }
});

// --- CASH FLOW ---
financeExtendedRouter.get("/cash-flow", requireRoles(financeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const [sales, incomes, purchases, expenses] = await Promise.all([
      prisma.sale.findMany({ where: { companyId, status: "COMPLETED" }, take: 25, orderBy: { createdAt: "desc" } }),
      prisma.income.findMany({ where: { companyId }, take: 25, orderBy: { date: "desc" }, include: { category: true } }),
      prisma.purchase.findMany({ where: { companyId, status: "RECEIVED" }, take: 25, orderBy: { createdAt: "desc" } }),
      prisma.expense.findMany({ where: { companyId }, take: 25, orderBy: { date: "desc" }, include: { category: true } })
    ]);
    const rows = [
      ...sales.map(s => ({ id: `s-${s.id}`, date: s.createdAt.toISOString(), account: s.invoiceNumber, description: "Sale Revenue", credit: Number(s.paidAmount || s.totalAmount), debit: 0, paymentMethod: "POS" })),
      ...incomes.map(i => ({ id: `i-${i.id}`, date: i.date.toISOString(), account: i.incomeNumber, description: i.category?.name || "Other Income", credit: Number(i.amount), debit: 0, paymentMethod: i.paymentMethod })),
      ...purchases.map(p => ({ id: `p-${p.id}`, date: p.createdAt.toISOString(), account: p.purchaseNumber, description: "Stock Purchase", credit: 0, debit: Number(p.paidAmount || p.totalAmount), paymentMethod: "SUPPLIER" })),
      ...expenses.map(e => ({ id: `e-${e.id}`, date: e.date.toISOString(), account: e.expenseNumber, description: e.category?.name || "Expense", credit: 0, debit: Number(e.amount) + Number(e.taxAmount || 0), paymentMethod: e.paymentMethod }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ success: true, data: { items: rows } });
  } catch (err) { next(err); }
});

// --- ACCOUNT STATEMENT ---
financeExtendedRouter.get("/account-statement", requireRoles(financeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const [sales, expenses, transfers] = await Promise.all([
      prisma.sale.findMany({ where: { companyId }, take: 20, orderBy: { createdAt: "desc" } }),
      prisma.expense.findMany({ where: { companyId }, take: 20, orderBy: { date: "desc" }, include: { category: true } }),
      prisma.moneyTransfer.findMany({ where: { companyId }, take: 20, orderBy: { date: "desc" } })
    ]);
    const items = [
      ...sales.map(s => ({ id: `s-${s.id}`, reference: s.invoiceNumber, date: s.createdAt.toISOString(), category: "Sales", description: `Invoice ${s.invoiceNumber}`, amount: Number(s.totalAmount), type: "CREDIT" })),
      ...expenses.map(e => ({ id: `e-${e.id}`, reference: e.expenseNumber, date: e.date.toISOString(), category: e.category?.name || "Expense", description: e.notes || "Expense", amount: Number(e.amount), type: "DEBIT" })),
      ...transfers.map(t => ({ id: `t-${t.id}`, reference: t.referenceNumber, date: t.date.toISOString(), category: "Transfer", description: t.notes || "Account Transfer", amount: Number(t.amount), type: "TRANSFER" }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});
