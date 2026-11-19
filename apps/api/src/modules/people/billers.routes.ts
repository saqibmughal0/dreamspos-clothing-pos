import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";
import { authenticate, requireRoles } from "../../middleware/auth";
import { UserRole } from "@dreamspos/shared";

export const billerRouter = Router();
billerRouter.use(authenticate);

const writeRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER];

billerRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { companyName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }
    const items = await prisma.biller.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

billerRouter.post("/", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const { name, companyName, email, phone, address, city, country, taxNumber, isActive } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ success: false, message: "Biller name is required" });
      return;
    }
    const created = await prisma.biller.create({
      data: {
        companyId,
        name: name.trim(),
        companyName: companyName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        country: country || "Pakistan",
        taxNumber: taxNumber || null,
        isActive: isActive !== false
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

billerRouter.put("/:id", requireRoles(writeRoles), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.biller.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Biller not found" });
      return;
    }
    const { name, companyName, email, phone, address, city, country, taxNumber, isActive } = req.body || {};
    const updated = await prisma.biller.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(companyName !== undefined ? { companyName } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(country !== undefined ? { country } : {}),
        ...(taxNumber !== undefined ? { taxNumber } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
      }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

billerRouter.delete("/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.biller.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Biller not found" });
      return;
    }
    await prisma.biller.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Biller deleted" });
  } catch (err) { next(err); }
});
