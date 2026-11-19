import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";
import { authenticate, requireRoles } from "../../middleware/auth";
import { UserRole } from "@dreamspos/shared";

export const catalogRouter = Router();
catalogRouter.use(authenticate);

const writeRoles = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.STORE_MANAGER,
  UserRole.INVENTORY_CLERK,
  UserRole.WAREHOUSE_STAFF
];

// --- CATEGORIES ---
catalogRouter.get("/categories", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

catalogRouter.post("/categories", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, slug, isActive } = req.body;
    if (!name || !String(name).trim()) {
      res.status(400).json({ success: false, message: "Category name is required" });
      return;
    }
    const cleanName = String(name).trim();
    const cleanCode = code ? String(code).trim().toUpperCase() : cleanName.slice(0, 4).toUpperCase() + "-" + Date.now().toString().slice(-4);
    const cleanSlug = slug ? String(slug).trim().toLowerCase() : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-4);
    const created = await prisma.category.create({
      data: { name: cleanName, code: cleanCode, slug: cleanSlug, isActive: isActive !== false }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

catalogRouter.put("/categories/:id", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, slug, isActive } = req.body;
    const updated = await prisma.category.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(code !== undefined ? { code: String(code).trim().toUpperCase() } : {}),
        ...(slug !== undefined ? { slug: String(slug).trim().toLowerCase() } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
      }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

catalogRouter.delete("/categories/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.category.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: "Category deleted" });
  } catch (err) { next(err); }
});

// --- SUBCATEGORIES ---
catalogRouter.get("/subcategories", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.subCategory.findMany({
      orderBy: { name: "asc" },
      include: { category: { select: { id: true, name: true } } }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

catalogRouter.post("/subcategories", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, name, code, description } = req.body;
    if (!categoryId || !name) {
      res.status(400).json({ success: false, message: "Category and name are required" });
      return;
    }
    const created = await prisma.subCategory.create({
      data: {
        categoryId,
        name: String(name).trim(),
        code: code ? String(code).trim().toUpperCase() : String(name).slice(0, 4).toUpperCase() + "-" + Date.now().toString().slice(-3),
        description: description || null
      },
      include: { category: { select: { id: true, name: true } } }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

catalogRouter.put("/subcategories/:id", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, name, code, description } = req.body;
    const updated = await prisma.subCategory.update({
      where: { id: String(req.params.id) },
      data: {
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(code !== undefined ? { code: String(code).trim().toUpperCase() } : {}),
        ...(description !== undefined ? { description } : {})
      },
      include: { category: { select: { id: true, name: true } } }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

catalogRouter.delete("/subcategories/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.subCategory.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: "Sub-category deleted" });
  } catch (err) { next(err); }
});

// --- BRANDS ---
catalogRouter.get("/brands", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

catalogRouter.post("/brands", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      res.status(400).json({ success: false, message: "Brand name is required" });
      return;
    }
    const created = await prisma.brand.create({
      data: { name: String(name).trim(), description: description || null }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

catalogRouter.put("/brands/:id", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const updated = await prisma.brand.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(description !== undefined ? { description } : {})
      }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

catalogRouter.delete("/brands/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.brand.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: "Brand deleted" });
  } catch (err) { next(err); }
});

// --- UNITS ---
catalogRouter.get("/units", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.unit.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

catalogRouter.post("/units", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, shortName, allowDecimal } = req.body;
    if (!name || !shortName) {
      res.status(400).json({ success: false, message: "Unit name and shortName are required" });
      return;
    }
    const created = await prisma.unit.create({
      data: {
        name: String(name).trim(),
        shortName: String(shortName).trim(),
        allowDecimal: Boolean(allowDecimal)
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

catalogRouter.put("/units/:id", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, shortName, allowDecimal } = req.body;
    const updated = await prisma.unit.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(shortName !== undefined ? { shortName: String(shortName).trim() } : {}),
        ...(allowDecimal !== undefined ? { allowDecimal: Boolean(allowDecimal) } : {})
      }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

catalogRouter.delete("/units/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.unit.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: "Unit deleted" });
  } catch (err) { next(err); }
});

// --- STORES (Company Scoped) ---
catalogRouter.get("/stores", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.store.findMany({
      where: { companyId },
      orderBy: { name: "asc" }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

catalogRouter.post("/stores", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, code, address, phone, isActive } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: "Store name is required" });
      return;
    }
    const created = await prisma.store.create({
      data: {
        companyId,
        name: String(name).trim(),
        code: code ? String(code).trim().toUpperCase() : "STR-" + Date.now().toString().slice(-4),
        address: address || null,
        phone: phone || null,
        isActive: isActive !== false
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

catalogRouter.put("/stores/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.store.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Store not found" });
      return;
    }
    const { name, code, address, phone, isActive } = req.body;
    const updated = await prisma.store.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(code !== undefined ? { code: String(code).trim().toUpperCase() } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
      }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

catalogRouter.delete("/stores/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.store.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Store not found" }); return; }
    await prisma.store.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Store deleted" });
  } catch (err) { next(err); }
});

// --- WAREHOUSES (Company Scoped) ---
catalogRouter.get("/warehouses", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.warehouse.findMany({
      where: { companyId },
      orderBy: { name: "asc" }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

catalogRouter.post("/warehouses", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, code, phone, email, address } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: "Warehouse name is required" });
      return;
    }
    const created = await prisma.warehouse.create({
      data: {
        companyId,
        name: String(name).trim(),
        code: code ? String(code).trim().toUpperCase() : "WH-" + Date.now().toString().slice(-4),
        phone: phone || null,
        email: email || null,
        address: address || null
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

catalogRouter.put("/warehouses/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.warehouse.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Warehouse not found" });
      return;
    }
    const { name, code, phone, email, address } = req.body;
    const updated = await prisma.warehouse.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(code !== undefined ? { code: String(code).trim().toUpperCase() } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(address !== undefined ? { address } : {})
      }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

catalogRouter.delete("/warehouses/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.warehouse.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Warehouse not found" }); return; }
    await prisma.warehouse.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Warehouse deleted" });
  } catch (err) { next(err); }
});

// --- VARIANT ATTRIBUTES (Company Scoped) ---
catalogRouter.get("/variant-attributes", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.variantAttribute.findMany({
      where: { companyId },
      orderBy: { name: "asc" }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

catalogRouter.post("/variant-attributes", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, values, isActive } = req.body;
    if (!name || !values) {
      res.status(400).json({ success: false, message: "Attribute name and values are required" });
      return;
    }
    const created = await prisma.variantAttribute.create({
      data: {
        companyId,
        name: String(name).trim(),
        values: Array.isArray(values) ? values.join(", ") : String(values).trim(),
        isActive: isActive !== false
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

catalogRouter.put("/variant-attributes/:id", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.variantAttribute.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Variant attribute not found" });
      return;
    }
    const { name, values, isActive } = req.body;
    const updated = await prisma.variantAttribute.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(values !== undefined ? { values: Array.isArray(values) ? values.join(", ") : String(values).trim() } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
      }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

catalogRouter.delete("/variant-attributes/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.variantAttribute.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Variant attribute not found" });
      return;
    }
    await prisma.variantAttribute.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Variant attribute deleted" });
  } catch (err) { next(err); }
});

// --- WARRANTIES (Company Scoped) ---
catalogRouter.get("/warranties", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.warranty.findMany({
      where: { companyId },
      orderBy: { name: "asc" }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

catalogRouter.post("/warranties", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, duration, durationUnit, description, isActive } = req.body;
    if (!name || duration === undefined) {
      res.status(400).json({ success: false, message: "Warranty name and duration are required" });
      return;
    }
    const created = await prisma.warranty.create({
      data: {
        companyId,
        name: String(name).trim(),
        duration: Number(duration),
        durationUnit: durationUnit ? String(durationUnit).trim() : "Months",
        description: description || null,
        isActive: isActive !== false
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

catalogRouter.put("/warranties/:id", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.warranty.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Warranty not found" });
      return;
    }
    const { name, duration, durationUnit, description, isActive } = req.body;
    const updated = await prisma.warranty.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(duration !== undefined ? { duration: Number(duration) } : {}),
        ...(durationUnit !== undefined ? { durationUnit: String(durationUnit).trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
      }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

catalogRouter.delete("/warranties/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.warranty.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Warranty not found" });
      return;
    }
    await prisma.warranty.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Warranty deleted" });
  } catch (err) { next(err); }
});
