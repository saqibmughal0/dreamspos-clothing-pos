import { prisma } from "@dreamspos/database";
import {
  ExpenseCategoryCreateInput,
  ExpenseCreateInput,
  JournalEntryCreateInput
} from "@dreamspos/shared";

export class FinanceService {
  /**
   * Seed standard Chart of Accounts for clothing retail if not exists
   */
  async ensureChartOfAccounts(companyId: string) {
    const defaultAccounts = [
      { accountNumber: "1010", name: "Cash on Hand", type: "ASSET" },
      { accountNumber: "1020", name: "Main Bank Account", type: "ASSET" },
      { accountNumber: "1030", name: "Accounts Receivable", type: "ASSET" },
      { accountNumber: "1040", name: "Inventory Asset", type: "ASSET" },
      { accountNumber: "2010", name: "Accounts Payable", type: "LIABILITY" },
      { accountNumber: "3010", name: "Owner Equity", type: "EQUITY" },
      { accountNumber: "4010", name: "Garment Sales Revenue", type: "REVENUE" },
      { accountNumber: "4020", name: "Sales Returns & Allowances", type: "REVENUE" },
      { accountNumber: "5010", name: "Cost of Goods Sold (COGS)", type: "EXPENSE" },
      { accountNumber: "6010", name: "Store Rent", type: "EXPENSE" },
      { accountNumber: "6020", name: "Utilities & Electricity", type: "EXPENSE" },
      { accountNumber: "6030", name: "Packaging & Shopping Bags", type: "EXPENSE" },
      { accountNumber: "6040", name: "Alteration & Tailoring Costs", type: "EXPENSE" },
      { accountNumber: "6050", name: "Marketing & Social Media", type: "EXPENSE" }
    ];

    for (const acc of defaultAccounts) {
      const existing = await prisma.account.findFirst({
        where: { companyId, accountNumber: acc.accountNumber }
      });
      if (!existing) {
        await prisma.account.create({
          data: {
            companyId,
            accountNumber: acc.accountNumber,
            name: acc.name,
            type: acc.type,
            balance: 0
          }
        });
      }
    }
  }

  // --- Expense Categories ---
  async listExpenseCategories(companyId: string) {
    return await prisma.expenseCategory.findMany({
      where: { companyId },
      include: {
        _count: { select: { expenses: true } }
      },
      orderBy: { name: "asc" }
    });
  }

  async createExpenseCategory(companyId: string, input: ExpenseCategoryCreateInput) {
    return await prisma.expenseCategory.create({
      data: {
        companyId,
        name: input.name,
        code: input.code,
        description: input.description
      }
    });
  }

  // --- Expenses ---
  async listExpenses(companyId: string, options: { categoryId?: string; page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (options.categoryId) where.categoryId = options.categoryId;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { date: "desc" }
      }),
      prisma.expense.count({ where })
    ]);

    return {
      items: expenses.map(e => ({
        id: e.id,
        expenseNumber: e.expenseNumber,
        categoryName: e.category.name,
        amount: Number(e.amount),
        taxAmount: Number(e.taxAmount),
        totalAmount: Number(e.amount) + Number(e.taxAmount),
        paymentMethod: e.paymentMethod,
        referenceNumber: e.referenceNumber,
        date: e.date.toISOString(),
        notes: e.notes,
        createdAt: e.createdAt.toISOString()
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createExpense(companyId: string, input: ExpenseCreateInput) {
    const expenseNumber = `EXP-${Date.now().toString().slice(-6)}`;

    return await prisma.expense.create({
      data: {
        companyId,
        categoryId: input.categoryId,
        expenseNumber,
        amount: input.amount,
        taxAmount: input.taxAmount || 0,
        paymentMethod: input.paymentMethod || "CASH",
        referenceNumber: input.referenceNumber,
        date: input.date ? new Date(input.date) : new Date(),
        notes: input.notes
      },
      include: { category: true }
    });
  }

  // --- Accounts & General Ledger ---
  async listAccounts(companyId: string) {
    await this.ensureChartOfAccounts(companyId);

    const accounts = await prisma.account.findMany({
      where: { companyId },
      orderBy: { accountNumber: "asc" }
    });

    return accounts.map(a => ({
      id: a.id,
      accountNumber: a.accountNumber,
      name: a.name,
      type: a.type,
      balance: Number(a.balance),
      createdAt: a.createdAt.toISOString()
    }));
  }

  /**
   * Double-Entry Journal Entry
   * Strictly enforces sum(Debits) == sum(Credits)
   */
  async createJournalEntry(companyId: string, input: JournalEntryCreateInput) {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of input.lines) {
      if (line.type === "DEBIT") totalDebit += line.amount;
      else if (line.type === "CREDIT") totalCredit += line.amount;
    }

    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.001) {
      throw new Error(`Double-entry unbalanced: Total Debits ($${totalDebit.toFixed(2)}) must equal Total Credits ($${totalCredit.toFixed(2)}). Variance: $${diff.toFixed(2)}`);
    }

    return await prisma.$transaction(async tx => {
      const entryNumber = `JE-${Date.now().toString().slice(-6)}`;

      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          entryNumber,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          date: input.date ? new Date(input.date) : new Date(),
          description: input.description
        }
      });

      for (const line of input.lines) {
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: line.accountId,
            type: line.type,
            amount: line.amount,
            description: line.description
          }
        });

        // Update account balance
        // For Assets & Expenses: Debit increases balance, Credit decreases balance.
        // For Liabilities, Equity & Revenues: Credit increases balance, Debit decreases balance.
        const acc = await tx.account.findUnique({ where: { id: line.accountId } });
        if (acc) {
          const isAssetOrExpense = acc.type === "ASSET" || acc.type === "EXPENSE";
          const delta = line.type === "DEBIT"
            ? (isAssetOrExpense ? line.amount : -line.amount)
            : (isAssetOrExpense ? -line.amount : line.amount);

          await tx.account.update({
            where: { id: line.accountId },
            data: { balance: { increment: delta } }
          });
        }
      }

      return entry;
    });
  }

  async listJournalEntries(companyId: string, options: { page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: { companyId },
        skip,
        take: limit,
        include: {
          lines: {
            include: { account: true }
          }
        },
        orderBy: { date: "desc" }
      }),
      prisma.journalEntry.count({ where: { companyId } })
    ]);

    return {
      items: entries.map(e => ({
        id: e.id,
        entryNumber: e.entryNumber,
        referenceType: e.referenceType,
        date: e.date.toISOString(),
        description: e.description,
        totalAmount: e.lines.filter(l => l.type === "DEBIT").reduce((acc, l) => acc + Number(l.amount), 0),
        lines: e.lines.map(l => ({
          id: l.id,
          accountNumber: l.account.accountNumber,
          accountName: l.account.name,
          type: l.type,
          amount: Number(l.amount),
          description: l.description
        }))
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Profit & Loss Statement (Income Statement)
   */
  async getProfitAndLoss(companyId: string) {
    // 1. Gross Revenue & Sales Returns
    const [sales, returns] = await Promise.all([
      prisma.sale.findMany({
        where: { companyId, status: "COMPLETED" },
        include: {
          items: {
            include: { product: true }
          }
        }
      }),
      prisma.salesReturn.findMany({
        where: { companyId, status: "COMPLETED" }
      })
    ]);

    const grossSales = sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
    const totalRefunds = returns.reduce((acc, r) => acc + Number(r.refundAmount), 0);
    const netRevenue = grossSales - totalRefunds;

    // 2. Cost of Goods Sold (COGS)
    let cogs = 0;
    for (const sale of sales) {
      for (const item of sale.items) {
        const unitCost = Number(item.product.costPrice || 0);
        cogs += Number(item.quantity) * unitCost;
      }
    }

    const grossProfit = netRevenue - cogs;
    const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    // 3. Operating Expenses
    const expenses = await prisma.expense.findMany({
      where: { companyId },
      include: { category: true }
    });

    const expenseCategoryMap: Record<string, number> = {};
    let totalExpenses = 0;

    for (const exp of expenses) {
      const cat = exp.category.name;
      const amt = Number(exp.amount) + Number(exp.taxAmount);
      expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + amt;
      totalExpenses += amt;
    }

    const netProfit = grossProfit - totalExpenses;
    const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    return {
      revenue: {
        grossSales,
        salesReturns: totalRefunds,
        netRevenue
      },
      costOfGoodsSold: {
        totalCOGS: cogs,
        grossProfit,
        grossMarginPercentage: Number(grossMargin.toFixed(2))
      },
      operatingExpenses: {
        totalExpenses,
        breakdown: Object.entries(expenseCategoryMap).map(([category, amount]) => ({
          category,
          amount
        }))
      },
      netProfit: {
        netProfit,
        netMarginPercentage: Number(netMargin.toFixed(2))
      }
    };
  }
}

export const financeService = new FinanceService();
