import { describe, it, expect, vi, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { EventEmitter } from "events";
import { config } from "../src/config";
import { prisma } from "@dreamspos/database";
import { UserRole } from "@dreamspos/shared";
import { authenticate } from "../src/middleware/auth";
import { catalogRouter } from "../src/modules/catalog/catalog.routes";
import { financeExtendedRouter } from "../src/modules/finance/finance.extended.routes";
import { quotationRouter } from "../src/modules/sales/quotation.routes";
import { promotionsRouter } from "../src/modules/promotions/promotions.routes";
import { hrmRouter } from "../src/modules/hrm/hrm.routes";
import { billerRouter } from "../src/modules/people/billers.routes";
import { reportsExtendedRouter } from "../src/modules/reports/reports.extended.routes";
import { authService } from "../src/modules/auth/auth.service";
import { BadRequestError } from "../src/utils/errors";

function runRouter(router: any, method: string, path: string, opts: { headers?: Record<string, string>; body?: any; user?: any } = {}) {
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const req: any = {
      method: method.toUpperCase(),
      url: path,
      originalUrl: path,
      path,
      headers: opts.headers || {},
      body: opts.body || {},
      query: {},
      params: {},
      user: opts.user,
    };

    const res: any = new EventEmitter();
    res.statusCode = 200;
    res.status = (code: number) => { res.statusCode = code; return res; };
    res.json = (data: any) => { resolve({ status: res.statusCode, body: data }); return res; };
    res.send = (data: any) => { resolve({ status: res.statusCode, body: data }); return res; };

    router.handle(req, res, (err: any) => {
      if (err) reject(err);
      else resolve({ status: 404, body: { message: "Not Found" } });
    });
  });
}

describe("Remaining POS Modules — Auth, Validation & Company Isolation", () => {
  const companyA = "11111111-1111-4111-8111-111111111111";
  const adminUser = { id: "u-admin", companyId: companyA, storeId: "s-1", role: UserRole.ADMIN, email: "admin@mrbilal.com" };
  const cashierUser = { id: "u-cashier", companyId: companyA, storeId: "s-1", role: UserRole.CASHIER, email: "cashier@mrbilal.com" };
  const adminToken = jwt.sign(adminUser, config.jwt.secret);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Rejects unauthenticated requests via authenticate middleware (401)", async () => {
    for (const router of [catalogRouter, promotionsRouter, hrmRouter]) {
      const res = await runRouter(router, "GET", "/");
      expect(res.status).toBe(401);
    }
    const authRes = await new Promise<{ status: number }>((resolve) => {
      const req: any = { headers: {} };
      const res: any = { statusCode: 200, status(c: number) { this.statusCode = c; return this; }, json() { resolve({ status: this.statusCode }); } };
      authenticate(req, res, () => resolve({ status: 200 }));
    });
    expect(authRes.status).toBe(401);
  });

  it("2. Enforces role permissions on protected write routes (403 for CASHIER)", async () => {
    const cashierToken = jwt.sign(cashierUser, config.jwt.secret);
    const r1 = await runRouter(promotionsRouter, "POST", "/coupons", {
      headers: { authorization: `Bearer ${cashierToken}` },
      body: { name: "Eid", code: "EID10", value: 10 },
    });
    expect(r1.status).toBe(403);

    const r2 = await runRouter(hrmRouter, "POST", "/employees", {
      headers: { authorization: `Bearer ${cashierToken}` },
      body: { firstName: "Ali", lastName: "Khan" },
    });
    expect(r2.status).toBe(403);
  });

  it("3. Validates required fields and rejects invalid payloads (400)", async () => {
    const r1 = await runRouter(catalogRouter, "POST", "/warranties", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {},
    });
    expect(r1.status).toBe(400);

    const r2 = await runRouter(financeExtendedRouter, "POST", "/money-transfers", {
      user: adminUser,
      body: { fromAccountId: "a1", toAccountId: "a1", amount: 100 },
    });
    expect(r2.status).toBe(400);

    const r3 = await runRouter(quotationRouter, "POST", "/", {
      user: adminUser,
      body: { items: [] },
    });
    expect(r3.status).toBe(400);

    const r4 = await runRouter(hrmRouter, "POST", "/employees", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: { firstName: "OnlyFirst" },
    });
    expect(r4.status).toBe(400);
  });

  it("4. Scopes queries to authenticated companyId and returns empty lists when no DB records exist", async () => {
    const vaSpy = vi.spyOn(prisma.variantAttribute, "findMany").mockResolvedValue([]);
    const accSpy = vi.spyOn(prisma.account, "findMany").mockResolvedValue([]);
    const qtSpy = vi.spyOn(prisma.quotation, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.customer, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.product, "findMany").mockResolvedValue([]);
    const cpSpy = vi.spyOn(prisma.coupon, "findMany").mockResolvedValue([]);
    const empSpy = vi.spyOn(prisma.employee, "findMany").mockResolvedValue([]);

    const [vaRes, tbRes, qtRes, cpRes, empRes] = await Promise.all([
      runRouter(catalogRouter, "GET", "/variant-attributes", { headers: { authorization: `Bearer ${adminToken}` } }),
      runRouter(financeExtendedRouter, "GET", "/trial-balance", { user: adminUser }),
      runRouter(quotationRouter, "GET", "/", { user: adminUser }),
      runRouter(promotionsRouter, "GET", "/coupons", { headers: { authorization: `Bearer ${adminToken}` } }),
      runRouter(hrmRouter, "GET", "/employees", { headers: { authorization: `Bearer ${adminToken}` } }),
    ]);

    expect(vaRes.status).toBe(200);
    expect(vaRes.body.data.items).toEqual([]);
    expect(vaSpy).toHaveBeenCalledWith(expect.objectContaining({ where: { companyId: companyA } }));

    expect(tbRes.status).toBe(200);
    expect(tbRes.body.data.totalDebit).toBe(0);
    expect(tbRes.body.data.totalCredit).toBe(0);
    expect(accSpy).toHaveBeenCalledWith(expect.objectContaining({ where: { companyId: companyA } }));

    expect(qtRes.status).toBe(200);
    expect(qtRes.body.data.items).toEqual([]);
    expect(qtSpy).toHaveBeenCalledWith(expect.objectContaining({ where: { companyId: companyA } }));

    expect(cpRes.status).toBe(200);
    expect(cpRes.body.data.items).toEqual([]);
    expect(cpSpy).toHaveBeenCalledWith(expect.objectContaining({ where: { companyId: companyA } }));

    expect(empRes.status).toBe(200);
    expect(empRes.body.data.items).toEqual([]);
    expect(empSpy).toHaveBeenCalledWith(expect.objectContaining({ where: { companyId: companyA } }));
  });

  it("5. Auth register rejects missing or malformed name/email/password with BadRequestError (400)", async () => {
    await expect(authService.register({} as any)).rejects.toThrow(BadRequestError);
    await expect(authService.register({ email: "invalid" } as any)).rejects.toThrow(BadRequestError);
    await expect(authService.register({ name: "Ali", email: "not-an-email", password: "123" } as any)).rejects.toThrow(BadRequestError);
    await expect(authService.register({ name: 123, email: "a@b.com", password: "password123" } as any)).rejects.toThrow(BadRequestError);
  });

  it("6. Billers & Secondary Reports enforce auth, RBAC, validation, and companyId isolation", async () => {
    const unauthBiller = await runRouter(billerRouter, "GET", "/");
    expect(unauthBiller.status).toBe(401);

    const cashierToken = jwt.sign(cashierUser, config.jwt.secret);
    const cashierPost = await runRouter(billerRouter, "POST", "/", {
      headers: { authorization: `Bearer ${cashierToken}` },
      body: { name: "Cashier Biller" },
    });
    expect(cashierPost.status).toBe(403);

    const badBiller = await runRouter(billerRouter, "POST", "/", {
      headers: { authorization: `Bearer ${adminToken}` },
      body: {},
    });
    expect(badBiller.status).toBe(400);

    const billerSpy = vi.spyOn(prisma.biller, "findMany").mockResolvedValue([]);
    const bRes = await runRouter(billerRouter, "GET", "/", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(bRes.status).toBe(200);
    expect(bRes.body.data.items).toEqual([]);
    expect(billerSpy).toHaveBeenCalledWith(expect.objectContaining({ where: { companyId: companyA } }));

    vi.spyOn(prisma.saleItem, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.sale, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.purchase, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.income, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.stockMovement, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.product, "findMany").mockResolvedValue([]);

    for (const ep of [
      "/best-sellers", "/customers", "/customer-due", "/suppliers", "/supplier-due",
      "/tax", "/income", "/invoices", "/sold-stock", "/stock-history",
      "/products", "/product-expired", "/product-quality"
    ]) {
      const r = await runRouter(reportsExtendedRouter, "GET", ep, { user: adminUser });
      expect(r.status).toBe(200);
      expect(r.body.data.items).toEqual([]);
    }
  });
});
