import { describe, it, expect, vi, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { EventEmitter } from "events";
import { config } from "../src/config";
import { prisma } from "@dreamspos/database";
import { UserRole } from "@dreamspos/shared";
import { catalogRouter } from "../src/modules/catalog/catalog.routes";
import { productRouter } from "../src/modules/products/product.routes";
import { settingsRouter } from "../src/modules/settings/settings.routes";
import { promotionsRouter } from "../src/modules/promotions/promotions.routes";
import { hrmRouter } from "../src/modules/hrm/hrm.routes";
import { financeRouter } from "../src/modules/finance/finance.routes";

function runRouter(
  router: any,
  method: string,
  path: string,
  opts: { headers?: Record<string, string>; body?: any } = {}
) {
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
      if (err) reject(err);
      else resolve({ status: 404, body: { message: "Not Found" } });
    });
  });
}

describe("Admin Role & Module Permissions Verification", () => {
  const companyA = "aaaa1111-1111-4111-8111-111111111111";
  const companyB = "bbbb2222-2222-4222-8222-222222222222";

  const adminTokenA = jwt.sign(
    { id: "u-owner", companyId: companyA, role: UserRole.ADMIN, email: "hmsaqibmughal@gmail.com" },
    config.jwt.secret
  );
  const adminTokenB = jwt.sign(
    { id: "u-admin-b", companyId: companyB, role: UserRole.ADMIN, email: "adminB@test.local" },
    config.jwt.secret
  );
  const cashierTokenA = jwt.sign(
    { id: "u-cashier", companyId: companyA, role: UserRole.CASHIER, email: "cashier@test.local" },
    config.jwt.secret
  );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. ADMIN can create Brand (POLO), Category, and Unit", async () => {
    vi.spyOn(prisma.brand, "create").mockResolvedValueOnce({
      id: "brand-polo-1",
      name: "POLO",
      image: null,
      description: null,
      createdAt: new Date(),
    } as any);
    vi.spyOn(prisma.category, "create").mockResolvedValueOnce({
      id: "cat-1",
      name: "Shirts",
      code: "SHIR-1234",
      slug: "shirts-1234",
      image: null,
      isActive: true,
      createdAt: new Date(),
    } as any);
    vi.spyOn(prisma.unit, "create").mockResolvedValueOnce({
      id: "unit-1",
      name: "Piece",
      shortName: "pcs",
      allowDecimal: false,
      createdAt: new Date(),
    } as any);

    const rBrand = await runRouter(catalogRouter, "POST", "/brands", {
      headers: { authorization: `Bearer ${adminTokenA}` },
      body: { name: "POLO" },
    });
    expect(rBrand.status).toBe(201);
    expect(rBrand.body.data.name).toBe("POLO");

    const rCat = await runRouter(catalogRouter, "POST", "/categories", {
      headers: { authorization: `Bearer ${adminTokenA}` },
      body: { name: "Shirts" },
    });
    expect(rCat.status).toBe(201);

    const rUnit = await runRouter(catalogRouter, "POST", "/units", {
      headers: { authorization: `Bearer ${adminTokenA}` },
      body: { name: "Piece", shortName: "pcs" },
    });
    expect(rUnit.status).toBe(201);
  });

  it("2. CASHIER is blocked (403) from restricted administrative routes across modules", async () => {
    const checks = [
      runRouter(catalogRouter, "POST", "/brands", {
        headers: { authorization: `Bearer ${cashierTokenA}` },
        body: { name: "POLO" },
      }),
      runRouter(catalogRouter, "POST", "/categories", {
        headers: { authorization: `Bearer ${cashierTokenA}` },
        body: { name: "Shirts" },
      }),
      runRouter(catalogRouter, "POST", "/units", {
        headers: { authorization: `Bearer ${cashierTokenA}` },
        body: { name: "Piece", shortName: "pcs" },
      }),
      runRouter(productRouter, "POST", "/", {
        headers: { authorization: `Bearer ${cashierTokenA}` },
        body: { name: "Blocked Product" },
      }),
      runRouter(productRouter, "POST", "/upload-image", {
        headers: { authorization: `Bearer ${cashierTokenA}` },
      }),
      runRouter(settingsRouter, "PUT", "/", {
        headers: { authorization: `Bearer ${cashierTokenA}` },
        body: { shopName: "Unauthorized" },
      }),
      runRouter(promotionsRouter, "POST", "/coupons", {
        headers: { authorization: `Bearer ${cashierTokenA}` },
        body: { name: "Test", code: "T1", value: 10 },
      }),
      runRouter(hrmRouter, "POST", "/employees", {
        headers: { authorization: `Bearer ${cashierTokenA}` },
        body: { firstName: "A", lastName: "B" },
      }),
      runRouter(financeRouter, "POST", "/expenses", {
        headers: { authorization: `Bearer ${cashierTokenA}` },
        body: { amount: 100 },
      }),
    ];

    const results = await Promise.all(checks);
    for (const res of results) {
      expect(res.status).toBe(403);
    }
  });

  it("3. Cross-company store update/delete remains blocked (404)", async () => {
    vi.spyOn(prisma.store, "findFirst").mockResolvedValueOnce(null);

    const res = await runRouter(catalogRouter, "PUT", "/stores/store-belonging-to-company-a", {
      headers: { authorization: `Bearer ${adminTokenB}` },
      body: { name: "Hijacked Store" },
    });

    expect(res.status).toBe(404);
  });
});
