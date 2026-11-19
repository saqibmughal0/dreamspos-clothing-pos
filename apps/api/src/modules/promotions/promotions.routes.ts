import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";
import { authenticate, requireRoles } from "../../middleware/auth";
import { UserRole } from "@dreamspos/shared";

export const promotionsRouter = Router();
promotionsRouter.use(authenticate);

const promoWriteRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER];

// --- COUPONS ---
promotionsRouter.get("/coupons", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.coupon.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
    res.json({
      success: true,
      data: {
        items: items.map(c => ({
          ...c,
          value: Number(c.value),
          minPurchase: Number(c.minPurchase)
        }))
      }
    });
  } catch (err) { next(err); }
});

promotionsRouter.post("/coupons", requireRoles(promoWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, code, type, value, minPurchase, maxUses, validFrom, validUntil, description, isActive } = req.body;
    if (!name || !code || value === undefined) {
      res.status(400).json({ success: false, message: "Coupon name, code, and value are required" });
      return;
    }
    const created = await prisma.coupon.create({
      data: {
        companyId,
        name: String(name).trim(),
        code: String(code).trim().toUpperCase(),
        type: type === "FIXED" ? "FIXED" : "PERCENTAGE",
        value: Number(value),
        minPurchase: Number(minPurchase || 0),
        maxUses: maxUses ? Number(maxUses) : null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        description: description || null,
        isActive: isActive !== false
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

promotionsRouter.put("/coupons/:id", requireRoles(promoWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.coupon.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Coupon not found" }); return; }
    const { name, code, type, value, minPurchase, maxUses, validUntil, description, isActive } = req.body;
    const updated = await prisma.coupon.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(code !== undefined ? { code: String(code).trim().toUpperCase() } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(value !== undefined ? { value: Number(value) } : {}),
        ...(minPurchase !== undefined ? { minPurchase: Number(minPurchase) } : {}),
        ...(maxUses !== undefined ? { maxUses: maxUses ? Number(maxUses) : null } : {}),
        ...(validUntil !== undefined ? { validUntil: validUntil ? new Date(validUntil) : null } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
      }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

promotionsRouter.delete("/coupons/:id", requireRoles(promoWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.coupon.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Coupon not found" }); return; }
    await prisma.coupon.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) { next(err); }
});

// --- GIFT CARDS ---
promotionsRouter.get("/gift-cards", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const [cards, customers] = await Promise.all([
      prisma.giftCard.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } }),
      prisma.customer.findMany({ where: { companyId }, select: { id: true, name: true } })
    ]);
    const custMap = new Map(customers.map(c => [c.id, c.name]));
    res.json({
      success: true,
      data: {
        items: cards.map(g => ({
          ...g,
          customerName: g.customerId ? (custMap.get(g.customerId) || "Walk-in") : "Walk-in",
          initialBalance: Number(g.initialBalance),
          currentBalance: Number(g.currentBalance)
        }))
      }
    });
  } catch (err) { next(err); }
});

promotionsRouter.post("/gift-cards", requireRoles(promoWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { cardNumber, customerId, initialBalance, expiryDate, status } = req.body;
    const bal = Number(initialBalance || 0);
    if (!cardNumber || bal <= 0) {
      res.status(400).json({ success: false, message: "Card number and positive initial balance are required" });
      return;
    }
    const created = await prisma.giftCard.create({
      data: {
        companyId,
        customerId: customerId || null,
        cardNumber: String(cardNumber).trim().toUpperCase(),
        initialBalance: bal,
        currentBalance: bal,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: status || "ACTIVE"
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

promotionsRouter.delete("/gift-cards/:id", requireRoles(promoWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.giftCard.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Gift card not found" }); return; }
    await prisma.giftCard.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Gift card deleted" });
  } catch (err) { next(err); }
});

// --- DISCOUNT PLANS ---
promotionsRouter.get("/discount-plans", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.discountPlan.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

promotionsRouter.post("/discount-plans", requireRoles(promoWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, targetCustomers, isActive } = req.body;
    if (!name) { res.status(400).json({ success: false, message: "Plan name is required" }); return; }
    const created = await prisma.discountPlan.create({
      data: { companyId, name: String(name).trim(), targetCustomers: targetCustomers || "ALL", isActive: isActive !== false }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

promotionsRouter.delete("/discount-plans/:id", requireRoles(promoWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.discountPlan.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Discount plan not found" }); return; }
    await prisma.discountPlan.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Discount plan deleted" });
  } catch (err) { next(err); }
});

// --- DISCOUNTS ---
promotionsRouter.get("/discounts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.discount.findMany({
      where: { companyId },
      include: { plan: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({
      success: true,
      data: {
        items: items.map(d => ({ ...d, value: Number(d.value) }))
      }
    });
  } catch (err) { next(err); }
});

promotionsRouter.post("/discounts", requireRoles(promoWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, planId, type, value, validFrom, validUntil, isActive } = req.body;
    if (!name || value === undefined) { res.status(400).json({ success: false, message: "Discount name and value are required" }); return; }
    const created = await prisma.discount.create({
      data: {
        companyId,
        planId: planId || null,
        name: String(name).trim(),
        type: type === "FIXED" ? "FIXED" : "PERCENTAGE",
        value: Number(value),
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive !== false
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

promotionsRouter.delete("/discounts/:id", requireRoles(promoWriteRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.discount.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Discount not found" }); return; }
    await prisma.discount.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Discount deleted" });
  } catch (err) { next(err); }
});
