import { describe, it, expect, vi, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { EventEmitter } from "events";
import { config } from "../src/config";
import { prisma } from "@dreamspos/database";
import { UserRole } from "@dreamspos/shared";
import { settingsRouter } from "../src/modules/settings/settings.routes";

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

describe("Settings API — Auth, Validation, Blank Optionals & Company Isolation", () => {
  const companyA = "aaaa1111-1111-4111-8111-111111111111";
  const companyB = "bbbb2222-2222-4222-8222-222222222222";

  const adminA = jwt.sign(
    { id: "u-admin-a", companyId: companyA, role: UserRole.ADMIN, email: "adminA@test.local" },
    config.jwt.secret
  );
  const adminB = jwt.sign(
    { id: "u-admin-b", companyId: companyB, role: UserRole.ADMIN, email: "adminB@test.local" },
    config.jwt.secret
  );
  const cashierA = jwt.sign(
    { id: "u-cashier-a", companyId: companyA, role: UserRole.CASHIER, email: "cashierA@test.local" },
    config.jwt.secret
  );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Rejects unauthenticated GET and PUT requests with 401", async () => {
    const r1 = await runRouter(settingsRouter, "GET", "/");
    expect(r1.status).toBe(401);

    const r2 = await runRouter(settingsRouter, "PUT", "/", {
      body: { shopName: "Test Shop" },
    });
    expect(r2.status).toBe(401);
  });

  it("2. Rejects non-admin (CASHIER) PUT requests with 403", async () => {
    const res = await runRouter(settingsRouter, "PUT", "/", {
      headers: { authorization: `Bearer ${cashierA}` },
      body: { shopName: "Unauthorized Shop" },
    });
    expect(res.status).toBe(403);
  });

  it("3. Returns PKR defaults when a company has no saved settings yet", async () => {
    vi.spyOn(prisma.setting, "findMany").mockResolvedValueOnce([]);

    const res = await runRouter(settingsRouter, "GET", "/", {
      headers: { authorization: `Bearer ${adminA}` },
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currency).toEqual({ code: "PKR", symbol: "Rs", position: "PREFIX" });
    expect(res.body.data.tax).toEqual({ rate: 0, type: "EXCLUSIVE" });
    expect(res.body.data.printer.paperSize).toBe("80mm");
    expect(res.body.data.invoice.prefix).toBe("INV-");
  });

  it("4. Rejects invalid inputs with 400 validation errors", async () => {
    const badEmail = await runRouter(settingsRouter, "PUT", "/", {
      headers: { authorization: `Bearer ${adminA}` },
      body: { email: "not-an-email" },
    });
    expect(badEmail.status).toBe(400);

    const badTax = await runRouter(settingsRouter, "PUT", "/", {
      headers: { authorization: `Bearer ${adminA}` },
      body: { tax: { rate: 150, type: "EXCLUSIVE" } },
    });
    expect(badTax.status).toBe(400);

    const badPaper = await runRouter(settingsRouter, "PUT", "/", {
      headers: { authorization: `Bearer ${adminA}` },
      body: { printer: { paperSize: "A4" } },
    });
    expect(badPaper.status).toBe(400);

    const badCurrencyPos = await runRouter(settingsRouter, "PUT", "/", {
      headers: { authorization: `Bearer ${adminA}` },
      body: { currency: { code: "PKR", symbol: "Rs", position: "MIDDLE" } },
    });
    expect(badCurrencyPos.status).toBe(400);
  });

  it("5. Persists settings with blank optional fields and isolates companies", async () => {
    const store = new Map<string, { companyId: string; group: string; key: string; value: string }>();

    vi.spyOn(prisma.setting, "findMany").mockImplementation(async (args: any) => {
      const cid = args?.where?.companyId;
      return Array.from(store.values()).filter((r) => r.companyId === cid) as any;
    });

    vi.spyOn(prisma.setting, "upsert").mockImplementation(async (args: any) => {
      const { companyId, group, key } = args.where.companyId_group_key;
      const record = { companyId, group, key, value: args.create.value };
      store.set(`${companyId}:${group}:${key}`, record);
      return record as any;
    });

    // Save Company A settings with blank optional fields
    const saveA = await runRouter(settingsRouter, "PUT", "/", {
      headers: { authorization: `Bearer ${adminA}` },
      body: {
        shopName: "Isolated Test Shop A",
        brandName: "",
        email: "",
        phone: "",
        website: "",
        taxNumber: "",
        address: "",
        tax: { rate: 5, type: "EXCLUSIVE" },
        printer: { paperSize: "58mm", autoCut: false, openCashDrawer: true },
        invoice: { prefix: "MB-" },
      },
    });

    expect(saveA.status).toBe(200);
    expect(saveA.body.data.shopName).toBe("Isolated Test Shop A");
    expect(saveA.body.data.taxNumber).toBe("");
    expect(saveA.body.data.email).toBe("");
    expect(saveA.body.data.tax.rate).toBe(5);
    expect(saveA.body.data.printer.paperSize).toBe("58mm");
    expect(saveA.body.data.invoice.prefix).toBe("MB-");

    // Reload Company A and confirm persistence
    const reloadA = await runRouter(settingsRouter, "GET", "/", {
      headers: { authorization: `Bearer ${adminA}` },
    });
    expect(reloadA.status).toBe(200);
    expect(reloadA.body.data.shopName).toBe("Isolated Test Shop A");
    expect(reloadA.body.data.printer.paperSize).toBe("58mm");
    expect(reloadA.body.data.invoice.prefix).toBe("MB-");

    // Company B must NOT see Company A's settings
    const reloadB = await runRouter(settingsRouter, "GET", "/", {
      headers: { authorization: `Bearer ${adminB}` },
    });
    expect(reloadB.status).toBe(200);
    expect(reloadB.body.data.shopName).toBe("");
    expect(reloadB.body.data.printer.paperSize).toBe("80mm");
    expect(reloadB.body.data.invoice.prefix).toBe("INV-");
  });
});
