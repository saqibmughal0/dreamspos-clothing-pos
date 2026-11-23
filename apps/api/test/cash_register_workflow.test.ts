import { describe, it, expect, vi, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { EventEmitter } from "events";
import { config } from "../src/config";
import { prisma } from "@dreamspos/database";
import { UserRole } from "@dreamspos/shared";
import { posRouter } from "../src/modules/pos/pos.routes";
import { dashboardRouter } from "../src/modules/dashboard/dashboard.routes";
import { posService } from "../src/modules/pos/pos.service";

function runRouter(
  router: any,
  method: string,
  path: string,
  opts: { headers?: Record<string, string>; body?: any; query?: Record<string, string> } = {}
) {
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const req: any = {
      method: method.toUpperCase(),
      url: path,
      originalUrl: path,
      path,
      headers: opts.headers || {},
      body: opts.body || {},
      query: opts.query || {},
      params: {},
    };

    const res: any = new EventEmitter();
    res.statusCode = 200;
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data: any) => {
      resolve({ status: res.statusCode, body: data });
      return res;
    };
    res.send = (data: any) => {
      resolve({ status: res.statusCode, body: data });
      return res;
    };

    router.handle(req, res, (err: any) => {
      if (err) {
        const status = err.statusCode || 500;
        resolve({ status, body: { success: false, message: err.message } });
      } else {
        resolve({ status: 404, body: { message: "Not Found" } });
      }
    });
  });
}

describe("Cash Register Opening, Closing, Security, Reconciliation & Dashboard", () => {
  const companyA = "aaaa1111-1111-4111-8111-111111111111";
  const companyB = "bbbb2222-2222-4222-8222-222222222222";
  const storeA = "11111111-1111-4111-8111-111111111111";

  const tokenA = jwt.sign(
    { id: "user-a", companyId: companyA, storeId: storeA, role: UserRole.ADMIN, email: "owner@a.local" },
    config.jwt.secret
  );
  const tokenB = jwt.sign(
    { id: "user-b", companyId: companyB, storeId: "store-b", role: UserRole.ADMIN, email: "owner@b.local" },
    config.jwt.secret
  );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Rejects missing or negative opening float, allows explicit 0", async () => {
    const missing = await runRouter(posRouter, "POST", "/register/open", {
      headers: { authorization: `Bearer ${tokenA}` },
      body: {},
    });
    expect(missing.status).toBe(400);

    const negative = await runRouter(posRouter, "POST", "/register/open", {
      headers: { authorization: `Bearer ${tokenA}` },
      body: { openingFloat: -50 },
    });
    expect(negative.status).toBe(400);

    vi.spyOn(prisma, "$transaction").mockImplementation(async (fn: any) => {
      const tx = {
        cashRegisterSession: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            id: "sess-zero",
            registerId: "reg-01",
            userId: "user-a",
            openingFloat: 0,
            cashIn: 0,
            cashOut: 0,
            status: "OPEN",
            openedAt: new Date(),
            register: { id: "reg-01", name: "Register 01", storeId: storeA, store: { name: "Main Store" } },
            user: { id: "user-a", name: "Owner", email: "owner@a.local" },
            sales: [],
          }),
        },
        cashRegister: {
          findFirst: vi.fn().mockResolvedValue({ id: "reg-01", storeId: storeA, name: "Register 01", isActive: true }),
        },
      };
      return fn(tx);
    });

    const zeroRes = await runRouter(posRouter, "POST", "/register/open", {
      headers: { authorization: `Bearer ${tokenA}` },
      body: { openingFloat: 0 },
    });
    expect(zeroRes.status).toBe(201);
    expect(zeroRes.body.data.openingFloat).toBe(0);
    expect(zeroRes.body.data.status).toBe("OPEN");
  });

  it("2. Prevents duplicate shift opening with 409 Conflict", async () => {
    vi.spyOn(prisma, "$transaction").mockImplementation(async (fn: any) => {
      const tx = {
        cashRegisterSession: {
          findFirst: vi.fn().mockResolvedValue({ id: "existing-open", status: "OPEN" }),
        },
      };
      return fn(tx);
    });

    const dup = await runRouter(posRouter, "POST", "/register/open", {
      headers: { authorization: `Bearer ${tokenA}` },
      body: { openingFloat: 5000 },
    });
    expect(dup.status).toBe(409);
  });

  it("3. Blocks POS checkout (403) when no active cash register shift is open", async () => {
    vi.spyOn(prisma, "$transaction").mockImplementation(async (fn: any) => {
      const tx = {
        cashRegisterSession: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      };
      return fn(tx);
    });

    await expect(
      posService.checkout(companyA, "user-a", {
        storeId: storeA,
        customerId: null,
        channel: "POS",
        items: [{ productId: "p-1", quantity: 1, unitPrice: 2000, discountAmount: 0, taxAmount: 0 }],
        orderDiscount: 0,
        shippingFee: 0,
        payments: [{ method: "CASH", amount: 2000 }],
      } as any)
    ).rejects.toThrow(/active cash register shift is required/i);
  });

  it("4. Reconciles expected cash accurately: excludes Card/Bank, includes split cash, subtracts refunds & cash out, prevents duplicate close", async () => {
    const mockOpenSession = {
      id: "sess-1",
      registerId: "reg-01",
      userId: "user-a",
      openingFloat: 5000,
      cashIn: 1000,
      cashOut: 500,
      status: "OPEN",
      openedAt: new Date(),
      register: { id: "reg-01", name: "Register 01", storeId: storeA, store: { name: "Main Store" } },
      user: { id: "user-a", name: "Owner", email: "owner@a.local" },
      sales: [
        // Cash sale: total 2000, customer tendered 5000 cash (3000 change) -> net drawer cash = +2000
        {
          id: "sale-1",
          status: "COMPLETED",
          totalAmount: 2000,
          payments: [{ method: "CASH", amount: 5000 }],
        },
        // Card sale: total 3000 -> 0 drawer cash
        {
          id: "sale-2",
          status: "COMPLETED",
          totalAmount: 3000,
          payments: [{ method: "CARD", amount: 3000 }],
        },
        // Bank transfer sale: total 4000 -> 0 drawer cash
        {
          id: "sale-3",
          status: "COMPLETED",
          totalAmount: 4000,
          payments: [{ method: "BANK_TRANSFER", amount: 4000 }],
        },
        // Split sale: total 2500 (1000 cash + 1500 card) -> +1000 drawer cash
        {
          id: "sale-4",
          status: "COMPLETED",
          totalAmount: 2500,
          payments: [
            { method: "CASH", amount: 1000 },
            { method: "CARD", amount: 1500 },
          ],
        },
      ],
    };

    // Cash refund of 400
    vi.spyOn(prisma.salesReturn, "aggregate").mockResolvedValue({
      _sum: { refundAmount: 400 as any },
    } as any);

    vi.spyOn(prisma.cashRegisterSession, "findFirst").mockResolvedValueOnce(mockOpenSession as any);

    // Expected Cash = 5000 (opening) + 3000 (2000 + 1000 cash receipts) + 1000 (cashIn) - 400 (cashRefunds) - 500 (cashOut) = 8100
    // Actual Closing Cash = 8050 -> Difference = -50 (Shortage)
    vi.spyOn(prisma.cashRegisterSession, "update").mockResolvedValueOnce({
      ...mockOpenSession,
      closingCash: 8050,
      expectedCash: 8100,
      difference: -50,
      closingNotes: "Short by Rs 50",
      status: "CLOSED",
      closedAt: new Date(),
    } as any);

    const closeRes = await runRouter(posRouter, "POST", "/register/close", {
      headers: { authorization: `Bearer ${tokenA}` },
      body: { sessionId: "sess-1", closingCash: 8050, closingNotes: "Short by Rs 50" },
    });

    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.cashSalesTotal).toBe(3000);
    expect(closeRes.body.data.splitCashTotal).toBe(1000);
    expect(closeRes.body.data.cardSalesTotal).toBe(4500);
    expect(closeRes.body.data.bankSalesTotal).toBe(4000);
    expect(closeRes.body.data.cashRefundsTotal).toBe(400);
    expect(closeRes.body.data.expectedCash).toBe(8100);
    expect(closeRes.body.data.closingCash).toBe(8050);
    expect(closeRes.body.data.difference).toBe(-50);

    // Duplicate close attempt must return 409
    vi.spyOn(prisma.cashRegisterSession, "findFirst").mockResolvedValueOnce({
      ...mockOpenSession,
      status: "CLOSED",
    } as any);

    const dupClose = await runRouter(posRouter, "POST", "/register/close", {
      headers: { authorization: `Bearer ${tokenA}` },
      body: { sessionId: "sess-1", closingCash: 8050 },
    });
    expect(dupClose.status).toBe(409);
  });

  it("5. Cross-company close is blocked (404) and Dashboard cash-register returns Pending closing cash while shift is open", async () => {
    vi.spyOn(prisma.cashRegisterSession, "findFirst").mockResolvedValueOnce(null);

    const crossClose = await runRouter(posRouter, "POST", "/register/close", {
      headers: { authorization: `Bearer ${tokenB}` },
      body: { sessionId: "sess-company-a", closingCash: 1000 },
    });
    expect(crossClose.status).toBe(404);

    // Dashboard cash register overview with an OPEN shift
    vi.spyOn(prisma.setting, "findFirst").mockResolvedValueOnce(null);
    const openSession = {
      id: "sess-open-dash",
      registerId: "reg-01",
      userId: "user-a",
      openingFloat: 3000,
      cashIn: 0,
      cashOut: 0,
      status: "OPEN",
      openedAt: new Date(),
      closedAt: null,
      register: { id: "reg-01", name: "Register 01", storeId: storeA, store: { name: "Main Store" } },
      user: { id: "user-a", name: "Owner", email: "owner@a.local" },
      sales: [{ id: "s1", status: "COMPLETED", totalAmount: 2000, payments: [{ method: "CASH", amount: 2000 }] }],
    };
    vi.spyOn(prisma.cashRegisterSession, "findMany")
      .mockResolvedValueOnce([openSession] as any)
      .mockResolvedValueOnce([openSession] as any);
    vi.spyOn(prisma.store, "findMany").mockResolvedValueOnce([{ id: storeA, name: "Main Store" }] as any);
    vi.spyOn(prisma.cashRegister, "findMany").mockResolvedValueOnce([{ id: "reg-01", name: "Register 01", storeId: storeA }] as any);
    vi.spyOn(prisma.user, "findMany").mockResolvedValueOnce([{ id: "user-a", name: "Owner", email: "owner@a.local" }] as any);
    vi.spyOn(prisma.salesReturn, "aggregate").mockResolvedValueOnce({ _sum: { refundAmount: 0 as any } } as any);

    const dashRes = await runRouter(dashboardRouter, "GET", "/cash-register", {
      headers: { authorization: `Bearer ${tokenA}` },
    });

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.data.summary.status).toBe("OPEN");
    expect(dashRes.body.data.summary.openingCash).toBe(3000);
    expect(dashRes.body.data.summary.totalCashSales).toBe(2000);
    expect(dashRes.body.data.summary.expectedClosingCash).toBe(5000);
    expect(dashRes.body.data.summary.actualClosingCash).toBeNull(); // Pending, NOT fabricated 0
    expect(dashRes.body.data.sessions.length).toBe(1);
  });
});
