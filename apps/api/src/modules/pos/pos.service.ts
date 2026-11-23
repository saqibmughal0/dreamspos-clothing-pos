import { prisma } from "@dreamspos/database";
import { PosCheckoutInput } from "@dreamspos/shared";
import { addMoney, subMoney, mulMoney, roundMoney } from "../../utils/decimal";
import { AppError, BadRequestError, ForbiddenError, NotFoundError } from "../../utils/errors";

export interface RegisterHistoryFilters {
  startDate?: string;
  endDate?: string;
  storeId?: string;
  cashierId?: string;
  registerId?: string;
}

/**
 * Computes exact drawer reconciliation totals for a cash register session.
 * - Expected Cash = Opening Cash + Cash Receipts + Cash In - Cash Refunds - Cash Out
 * - Cash Difference = Actual Closing Cash - Expected Cash
 * - Card and Bank Transfer payments are tracked separately and NEVER added to drawer cash.
 * - Change given back to customer is subtracted from cash tender so drawer cash is not inflated.
 */
function computeSessionReconciliation(session: any, cashRefundsTotal = 0) {
  let cashSalesTotal = 0;
  let cardSalesTotal = 0;
  let bankSalesTotal = 0;
  let splitCashTotal = 0;
  let totalSales = 0;

  const sales = Array.isArray(session.sales) ? session.sales : [];
  for (const sale of sales) {
    if (sale.status && sale.status !== "COMPLETED") continue;
    const saleTotal = roundMoney(Number(sale.totalAmount || 0));
    totalSales = addMoney(totalSales, saleTotal);

    const payments = Array.isArray(sale.payments) ? sale.payments : [];
    const isSplit = payments.length > 1;
    let saleCashTendered = 0;
    let saleTotalTendered = 0;

    for (const p of payments) {
      const amt = roundMoney(Number(p.amount || 0));
      saleTotalTendered = addMoney(saleTotalTendered, amt);
      if (p.method === "CASH") {
        saleCashTendered = addMoney(saleCashTendered, amt);
      } else if (p.method === "CARD") {
        cardSalesTotal = addMoney(cardSalesTotal, amt);
      } else if (p.method === "BANK_TRANSFER") {
        bankSalesTotal = addMoney(bankSalesTotal, amt);
      }
    }

    // Deduct cash change given back to customer so expected drawer cash reflects net cash retained
    const changeGiven = Math.max(0, roundMoney(subMoney(saleTotalTendered, saleTotal)));
    const netCashForSale = Math.max(0, roundMoney(subMoney(saleCashTendered, changeGiven)));

    cashSalesTotal = addMoney(cashSalesTotal, netCashForSale);
    if (isSplit && netCashForSale > 0) {
      splitCashTotal = addMoney(splitCashTotal, netCashForSale);
    }
  }

  const openingFloat = roundMoney(Number(session.openingFloat || 0));
  const cashIn = roundMoney(Number(session.cashIn || 0));
  const cashOut = roundMoney(Number(session.cashOut || 0));
  const cashRefunds = roundMoney(Number(cashRefundsTotal || 0));

  const inflows = addMoney(addMoney(openingFloat, cashSalesTotal), cashIn);
  const outflows = addMoney(cashRefunds, cashOut);
  const expectedCash = roundMoney(subMoney(inflows, outflows));

  const isClosed = session.status === "CLOSED";
  const actualClosingCash =
    isClosed && session.closingCash !== null && session.closingCash !== undefined
      ? roundMoney(Number(session.closingCash))
      : null;

  const storedExpected =
    isClosed && session.expectedCash !== null && session.expectedCash !== undefined
      ? roundMoney(Number(session.expectedCash))
      : expectedCash;

  const difference =
    isClosed && actualClosingCash !== null
      ? roundMoney(subMoney(actualClosingCash, storedExpected))
      : null;

  return {
    id: session.id,
    registerId: session.registerId,
    registerName: session.register?.name || "Checkout Register",
    storeId: session.register?.storeId || null,
    storeName: session.register?.store?.name || "",
    cashierId: session.userId,
    cashierName: session.user?.name || session.user?.email || "Cashier",
    openedAt: session.openedAt instanceof Date ? session.openedAt.toISOString() : session.openedAt,
    closedAt: session.closedAt instanceof Date ? session.closedAt.toISOString() : session.closedAt || null,
    openingFloat,
    cashSalesTotal: roundMoney(cashSalesTotal),
    cashRefundsTotal: cashRefunds,
    cashIn,
    cashOut,
    cardSalesTotal: roundMoney(cardSalesTotal),
    bankSalesTotal: roundMoney(bankSalesTotal),
    splitCashTotal: roundMoney(splitCashTotal),
    totalSales: roundMoney(totalSales),
    salesCount: sales.length,
    expectedCash: storedExpected,
    closingCash: actualClosingCash,
    difference,
    closingNotes: session.closingNotes || "",
    status: session.status,
  };
}

/**
 * Returns start/end UTC timestamps for "today" in the configured business timezone (default Asia/Karachi).
 */
function getTodayBoundsForTimezone(timezone = "Asia/Karachi"): { start: Date; end: Date } {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);

    const year = Number(parts.find((p) => p.type === "year")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);

    // Compute timezone offset at noon UTC on that date
    const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const tzDate = new Date(utcNoon.toLocaleString("en-US", { timeZone: timezone }));
    const offsetMs = tzDate.getTime() - utcNoon.getTime();

    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMs);
    const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - offsetMs);
    return { start, end };
  } catch {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  }
}

export class PosService {
  private async getCashRefundsForSession(companyId: string, session: any): Promise<number> {
    const saleIds = (session.sales || []).map((s: any) => s.id);
    if (saleIds.length === 0) return 0;

    const agg = await prisma.salesReturn.aggregate({
      where: {
        companyId,
        saleId: { in: saleIds },
        refundMethod: "CASH",
        status: "COMPLETED",
      },
      _sum: { refundAmount: true },
    });
    return roundMoney(Number(agg._sum.refundAmount || 0));
  }

  async checkout(companyId: string, cashierId: string, input: PosCheckoutInput) {
    return await prisma.$transaction(async (tx) => {
      // MANDATORY ACTIVE CASH REGISTER SESSION CHECK (Company & Cashier Scoped)
      const activeSession = await tx.cashRegisterSession.findFirst({
        where: {
          userId: cashierId,
          status: "OPEN",
          register: { store: { companyId } },
        },
        include: { register: true },
        orderBy: { openedAt: "desc" },
      });

      if (!activeSession) {
        throw new ForbiddenError(
          "An active cash register shift is required before completing POS sales. Please open the cash register first."
        );
      }

      // Resolve storeId safely (prefer active register's store when fallback UUID is sent)
      const resolvedStoreId =
        !input.storeId || input.storeId === "00000000-0000-0000-0000-000000000001"
          ? activeSession.register.storeId
          : input.storeId;

      // 1. Calculate line totals, subtotal and tax with consistent decimal rounding
      let subtotal = 0;
      let totalTax = 0;

      for (const item of input.items as any[]) {
        const itemLineTotal = mulMoney(item.quantity, item.unitPrice);
        const itemNet = subMoney(itemLineTotal, item.discountAmount || 0);
        subtotal = addMoney(subtotal, itemNet);

        const rawTax = Number(item.taxAmount || 0);
        const cleanTax = rawTax > 0 ? roundMoney(rawTax) : 0;
        totalTax = addMoney(totalTax, cleanTax);

        // Check stock availability in store warehouse
        const warehouse = await tx.warehouse.findFirst({ where: { companyId } });

        // If variant specified (clothing size/color), deduct variant stock
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variant || Number(variant.stockQty) < item.quantity) {
            throw new BadRequestError(
              `Insufficient stock for variant "${item.color || ""} - ${item.size || ""}". Available: ${variant ? Number(variant.stockQty) : 0}, Requested: ${item.quantity}`
            );
          }

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQty: { decrement: item.quantity } },
          });
        }

        if (warehouse) {
          const balance = await tx.stockBalance.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: warehouse.id,
              },
            },
          });

          const currentQty = balance ? Number(balance.quantity) : 0;
          if (currentQty < item.quantity) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            throw new BadRequestError(
              `Insufficient stock for product "${product?.name || item.productId}". Available: ${currentQty}, Requested: ${item.quantity}`
            );
          }

          // Deduct main warehouse stock
          await tx.stockBalance.update({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: warehouse.id,
              },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          });

          // Record stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: warehouse.id,
              type: "SALE",
              quantity: item.quantity,
              referenceType: "POS_SALE",
            },
          });
        }
      }

      // Calculate final total: subtotal - orderDiscount + totalTax + shippingFee
      const afterDiscount = subMoney(subtotal, input.orderDiscount || 0);
      const afterTax = addMoney(afterDiscount, roundMoney(totalTax));
      const finalTotal = roundMoney(addMoney(afterTax, input.shippingFee || 0));

      // Calculate total paid across split or single tenders
      const totalPaid = input.payments.reduce((sum, p) => addMoney(sum, p.amount), 0);
      const dueAmount = roundMoney(Math.max(0, subMoney(finalTotal, totalPaid)));

      // Generate invoice number using company configured prefix (defaults to "INV-")
      let invoicePrefix = "INV-";
      const prefixRecords = await tx.setting.findMany({
        where: { companyId, group: "BUSINESS", key: { in: ["invoice", "prefixes"] } },
      });
      for (const rec of prefixRecords) {
        try {
          const parsed = JSON.parse(rec.value);
          if (rec.key === "invoice" && typeof parsed?.prefix === "string" && parsed.prefix.trim()) {
            invoicePrefix = parsed.prefix.trim();
            break;
          }
          if (rec.key === "prefixes" && typeof parsed?.posInvoice === "string" && parsed.posInvoice.trim()) {
            invoicePrefix = parsed.posInvoice.trim();
          }
        } catch {
          // ignore malformed JSON and fall back to default
        }
      }
      const cleanPrefix = invoicePrefix.endsWith("-") ? invoicePrefix : `${invoicePrefix}-`;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const countToday = await tx.sale.count({ where: { companyId } });
      const invoiceNumber = `${cleanPrefix}${dateStr}-${String(countToday + 1).padStart(4, "0")}`;

      // Create Sale record linked to the active cash register session
      const sale = await tx.sale.create({
        data: {
          companyId,
          storeId: resolvedStoreId,
          registerSessionId: activeSession.id,
          customerId: input.customerId,
          cashierId,
          invoiceNumber,
          channel: input.channel,
          subtotal: roundMoney(subtotal),
          discountAmount: roundMoney(input.orderDiscount || 0),
          taxAmount: roundMoney(totalTax),
          shippingFee: roundMoney(input.shippingFee || 0),
          totalAmount: finalTotal,
          paidAmount: roundMoney(totalPaid),
          dueAmount,
          status: "COMPLETED",
          paymentStatus: dueAmount === 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "DUE",
          notes: input.notes,
          items: {
            create: (input.items as any[]).map((i) => ({
              productId: i.productId,
              variantId: i.variantId || null,
              size: i.size || null,
              color: i.color || null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discountAmount: i.discountAmount || 0,
              taxAmount: Number(i.taxAmount || 0) > 0 ? roundMoney(Number(i.taxAmount)) : 0,
              totalPrice: roundMoney(subMoney(mulMoney(i.quantity, i.unitPrice), i.discountAmount || 0)),
            })),
          },
          payments: {
            create: input.payments.map((p) => ({
              method: p.method,
              amount: roundMoney(p.amount),
              referenceNumber: p.referenceNumber,
            })),
          },
        },
        include: {
          items: { include: { product: true, variant: true } },
          payments: true,
          customer: true,
        },
      });

      return {
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        registerSessionId: activeSession.id,
        subtotal: Number(sale.subtotal),
        discountAmount: Number(sale.discountAmount),
        taxAmount: Number(sale.taxAmount),
        totalAmount: Number(sale.totalAmount),
        paidAmount: Number(sale.paidAmount),
        dueAmount: Number(sale.dueAmount),
        changeDue: Math.max(0, roundMoney(subMoney(totalPaid, finalTotal))),
        status: sale.status,
        paymentStatus: sale.paymentStatus,
        createdAt: sale.createdAt.toISOString(),
        items: sale.items.map((it) => ({
          name: it.product.name,
          size: it.size,
          color: it.color,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          totalPrice: Number(it.totalPrice),
        })),
        payments: sale.payments.map((pm) => ({
          method: pm.method,
          amount: Number(pm.amount),
        })),
      };
    });
  }

  // Cash Register Sessions
  async openRegister(companyId: string, storeId: string | null, userId: string, openingFloat: number) {
    if (!Number.isFinite(openingFloat) || openingFloat < 0) {
      throw new BadRequestError("Opening cash amount must be a valid non-negative number.");
    }

    const cleanOpening = roundMoney(openingFloat);

    return await prisma.$transaction(async (tx) => {
      // Prevent duplicate active register sessions for this cashier in this company
      const existing = await tx.cashRegisterSession.findFirst({
        where: {
          userId,
          status: "OPEN",
          register: { store: { companyId } },
        },
      });

      if (existing) {
        throw new AppError(409, "An active cash register shift is already open for your account.");
      }

      // Find an active cash register scoped to the company (preferring user's storeId if provided)
      let register = storeId
        ? await tx.cashRegister.findFirst({
            where: { storeId, isActive: true, store: { companyId } },
            include: { store: true },
          })
        : null;

      if (!register) {
        register = await tx.cashRegister.findFirst({
          where: { isActive: true, store: { companyId } },
          include: { store: true },
          orderBy: { createdAt: "asc" },
        });
      }

      if (!register) {
        // Ensure the company's active store has a default operational cash register when opening its first shift
        const targetStore = storeId
          ? await tx.store.findFirst({ where: { id: storeId, companyId } })
          : await tx.store.findFirst({ where: { companyId }, orderBy: { createdAt: "asc" } });

        if (!targetStore) {
          throw new NotFoundError("No active store found for your company. Please create a store first.");
        }

        register = await tx.cashRegister.create({
          data: {
            storeId: targetStore.id,
            name: "Checkout Register 01",
            terminalId: `TERM-${targetStore.code || "01"}`,
            isActive: true,
          },
          include: { store: true },
        });
      }

      const session = await tx.cashRegisterSession.create({
        data: {
          registerId: register.id,
          userId,
          openingFloat: cleanOpening,
          cashIn: 0,
          cashOut: 0,
          status: "OPEN",
        },
        include: {
          register: { include: { store: true } },
          user: { select: { id: true, name: true, email: true } },
          sales: { include: { payments: true } },
        },
      });

      return computeSessionReconciliation(session, 0);
    });
  }

  async recordCashMovement(
    companyId: string,
    userId: string,
    sessionId: string,
    type: "IN" | "OUT",
    amount: number
  ) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestError("Cash movement amount must be greater than zero.");
    }

    const cleanAmount = roundMoney(amount);

    const session = await prisma.cashRegisterSession.findFirst({
      where: {
        id: sessionId,
        status: "OPEN",
        register: { store: { companyId } },
      },
      include: {
        register: { include: { store: true } },
        user: { select: { id: true, name: true, email: true } },
        sales: { include: { payments: true } },
      },
    });

    if (!session) {
      throw new NotFoundError("Active cash register session not found.");
    }

    if (session.userId !== userId) {
      throw new ForbiddenError("You can only record cash movements on your own active register session.");
    }

    const updated = await prisma.cashRegisterSession.update({
      where: { id: session.id },
      data:
        type === "IN"
          ? { cashIn: roundMoney(addMoney(Number((session as any).cashIn || 0), cleanAmount)) }
          : { cashOut: roundMoney(addMoney(Number((session as any).cashOut || 0), cleanAmount)) },
      include: {
        register: { include: { store: true } },
        user: { select: { id: true, name: true, email: true } },
        sales: { include: { payments: true } },
      },
    });

    const cashRefunds = await this.getCashRefundsForSession(companyId, updated);
    return computeSessionReconciliation(updated, cashRefunds);
  }

  async closeRegister(
    companyId: string,
    userId: string,
    sessionId: string,
    closingCash: number,
    closingNotes?: string
  ) {
    if (!Number.isFinite(closingCash) || closingCash < 0) {
      throw new BadRequestError("Actual closing cash must be a valid non-negative number.");
    }

    const cleanClosing = roundMoney(closingCash);

    const session = await prisma.cashRegisterSession.findFirst({
      where: {
        id: sessionId,
        register: { store: { companyId } },
      },
      include: {
        register: { include: { store: true } },
        user: { select: { id: true, name: true, email: true } },
        sales: { include: { payments: true } },
      },
    });

    if (!session) {
      throw new NotFoundError("Cash register session not found.");
    }

    if (session.status === "CLOSED") {
      throw new AppError(409, "This cash register session is already closed.");
    }

    const cashRefunds = await this.getCashRefundsForSession(companyId, session);
    const preview = computeSessionReconciliation(session, cashRefunds);
    const expectedCash = preview.expectedCash;
    const difference = roundMoney(subMoney(cleanClosing, expectedCash));

    const updated = await prisma.cashRegisterSession.update({
      where: { id: session.id },
      data: {
        closingCash: cleanClosing,
        expectedCash,
        difference,
        closingNotes: closingNotes || null,
        closedById: userId,
        closedAt: new Date(),
        status: "CLOSED",
      },
      include: {
        register: { include: { store: true } },
        user: { select: { id: true, name: true, email: true } },
        sales: { include: { payments: true } },
      },
    });

    const summary = computeSessionReconciliation(updated, cashRefunds);
    return {
      session: updated,
      ...summary,
    };
  }

  async getActiveRegister(companyId: string, userId: string) {
    const session = await prisma.cashRegisterSession.findFirst({
      where: {
        userId,
        status: "OPEN",
        register: { store: { companyId } },
      },
      include: {
        register: { include: { store: true } },
        user: { select: { id: true, name: true, email: true } },
        sales: { include: { payments: true } },
      },
      orderBy: { openedAt: "desc" },
    });

    if (!session) return null;

    const cashRefunds = await this.getCashRefundsForSession(companyId, session);
    return computeSessionReconciliation(session, cashRefunds);
  }

  /**
   * Company-scoped Cash Register Overview & Shift History for Dashboard & POS.
   * Defaults to today's sessions in the configured business timezone.
   */
  async getRegisterOverview(companyId: string, filters: RegisterHistoryFilters = {}) {
    // Load configured business timezone (default Asia/Karachi)
    let timezone = "Asia/Karachi";
    const locSetting = await prisma.setting.findFirst({
      where: { companyId, group: "BUSINESS", key: "localization" },
    });
    if (locSetting?.value) {
      try {
        const parsed = JSON.parse(locSetting.value);
        if (parsed?.timezone) timezone = String(parsed.timezone);
      } catch {
        // use default
      }
    }

    let rangeStart: Date;
    let rangeEnd: Date;
    if (filters.startDate && filters.endDate) {
      rangeStart = new Date(filters.startDate);
      rangeEnd = new Date(filters.endDate);
    } else {
      const today = getTodayBoundsForTimezone(timezone);
      rangeStart = today.start;
      rangeEnd = today.end;
    }

    const sessionWhere: any = {
      register: {
        store: {
          companyId,
          ...(filters.storeId ? { id: filters.storeId } : {}),
        },
        ...(filters.registerId ? { id: filters.registerId } : {}),
      },
      ...(filters.cashierId ? { userId: filters.cashierId } : {}),
      openedAt: { gte: rangeStart, lte: rangeEnd },
    };

    const [sessions, openSessions, stores, registers, cashiers] = await Promise.all([
      prisma.cashRegisterSession.findMany({
        where: sessionWhere,
        include: {
          register: { include: { store: true } },
          user: { select: { id: true, name: true, email: true } },
          sales: { include: { payments: true } },
        },
        orderBy: { openedAt: "desc" },
      }),
      prisma.cashRegisterSession.findMany({
        where: {
          status: "OPEN",
          register: {
            store: {
              companyId,
              ...(filters.storeId ? { id: filters.storeId } : {}),
            },
            ...(filters.registerId ? { id: filters.registerId } : {}),
          },
          ...(filters.cashierId ? { userId: filters.cashierId } : {}),
        },
        include: {
          register: { include: { store: true } },
          user: { select: { id: true, name: true, email: true } },
          sales: { include: { payments: true } },
        },
        orderBy: { openedAt: "desc" },
      }),
      prisma.store.findMany({
        where: { companyId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.cashRegister.findMany({
        where: { store: { companyId } },
        select: { id: true, name: true, storeId: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // Merge any currently open session that started before today's midnight so active shift is always visible
    const sessionMap = new Map<string, any>();
    for (const s of openSessions) sessionMap.set(s.id, s);
    for (const s of sessions) sessionMap.set(s.id, s);
    const mergedSessions = Array.from(sessionMap.values()).sort(
      (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
    );

    const reconciledSessions = await Promise.all(
      mergedSessions.map(async (s) => {
        const cashRefunds = await this.getCashRefundsForSession(companyId, s);
        return computeSessionReconciliation(s, cashRefunds);
      })
    );

    // Current active shift (most recent OPEN session) vs latest closed shift
    const activeShift = reconciledSessions.find((s) => s.status === "OPEN") || null;
    const latestClosedShift = reconciledSessions.find((s) => s.status === "CLOSED") || null;

    // Clearly distinguish active shift values from closed-shift history — never blindly combine opening cash across shifts
    let summary: {
      scope: "ACTIVE_SHIFT" | "CLOSED_SHIFT" | "NONE";
      status: "OPEN" | "CLOSED" | "NOT_STARTED";
      openingCash: number;
      totalCashSales: number;
      expectedClosingCash: number;
      actualClosingCash: number | null;
      cashDifference: number | null;
      cashRefundsTotal: number;
      cardSalesTotal: number;
      bankSalesTotal: number;
      activeRegisterName: string | null;
      activeCashierName: string | null;
      shiftCount: number;
    };

    if (activeShift) {
      summary = {
        scope: "ACTIVE_SHIFT",
        status: "OPEN",
        openingCash: activeShift.openingFloat,
        totalCashSales: activeShift.cashSalesTotal,
        expectedClosingCash: activeShift.expectedCash,
        actualClosingCash: null, // Pending while open — never fabricate 0
        cashDifference: null,
        cashRefundsTotal: activeShift.cashRefundsTotal,
        cardSalesTotal: activeShift.cardSalesTotal,
        bankSalesTotal: activeShift.bankSalesTotal,
        activeRegisterName: activeShift.registerName,
        activeCashierName: activeShift.cashierName,
        shiftCount: reconciledSessions.length,
      };
    } else if (latestClosedShift) {
      summary = {
        scope: "CLOSED_SHIFT",
        status: "CLOSED",
        openingCash: latestClosedShift.openingFloat,
        totalCashSales: latestClosedShift.cashSalesTotal,
        expectedClosingCash: latestClosedShift.expectedCash,
        actualClosingCash: latestClosedShift.closingCash,
        cashDifference: latestClosedShift.difference,
        cashRefundsTotal: latestClosedShift.cashRefundsTotal,
        cardSalesTotal: latestClosedShift.cardSalesTotal,
        bankSalesTotal: latestClosedShift.bankSalesTotal,
        activeRegisterName: latestClosedShift.registerName,
        activeCashierName: latestClosedShift.cashierName,
        shiftCount: reconciledSessions.length,
      };
    } else {
      summary = {
        scope: "NONE",
        status: "NOT_STARTED",
        openingCash: 0,
        totalCashSales: 0,
        expectedClosingCash: 0,
        actualClosingCash: null,
        cashDifference: null,
        cashRefundsTotal: 0,
        cardSalesTotal: 0,
        bankSalesTotal: 0,
        activeRegisterName: null,
        activeCashierName: null,
        shiftCount: 0,
      };
    }

    return {
      timezone,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      summary,
      activeShift,
      sessions: reconciledSessions,
      filterOptions: { stores, registers, cashiers },
    };
  }

  // Thermal Receipt Data Formatter (58mm and 80mm format)
  async getReceiptData(saleId: string, companyId?: string) {
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        company: true,
        store: true,
        cashier: true,
        customer: true,
        items: { include: { product: true, variant: true } },
        payments: true,
      },
    });

    if (!sale) return null;

    return {
      companyName: sale.company.name,
      storeName: sale.store.name,
      storeAddress: sale.store.address || "",
      storePhone: sale.store.phone || "",
      invoiceNumber: sale.invoiceNumber,
      date: sale.createdAt.toLocaleDateString(),
      time: sale.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      cashier: sale.cashier.name,
      customer: sale.customer?.name || "Walk-in Customer",
      items: sale.items.map((i) => ({
        name: i.variant ? `${i.product.name} (${i.color} / ${i.size})` : i.product.name,
        sku: i.variant ? i.variant.sku : i.product.sku,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
      subtotal: Number(sale.subtotal),
      discountAmount: Number(sale.discountAmount),
      taxAmount: Number(sale.taxAmount),
      totalAmount: Number(sale.totalAmount),
      paidAmount: Number(sale.paidAmount),
      dueAmount: Number(sale.dueAmount),
      payments: sale.payments.map((p) => ({
        method: p.method,
        amount: Number(p.amount),
      })),
    };
  }
}

export const posService = new PosService();
