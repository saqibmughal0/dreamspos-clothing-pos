import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";

export const quotationRouter = Router();

quotationRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const items = await prisma.quotation.findMany({
      where: { companyId },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });
    const [customers, products] = await Promise.all([
      prisma.customer.findMany({ where: { companyId }, select: { id: true, name: true } }),
      prisma.product.findMany({ where: { companyId }, select: { id: true, name: true, sku: true } })
    ]);
    const custMap = new Map(customers.map(c => [c.id, c.name]));
    const prodMap = new Map(products.map(p => [p.id, p]));

    res.json({
      success: true,
      data: {
        items: items.map(q => ({
          id: q.id,
          quotationNumber: q.quotationNumber,
          customerId: q.customerId,
          customerName: q.customerId ? (custMap.get(q.customerId) || "Walk-in Customer") : "Walk-in Customer",
          productName: q.items[0] ? (prodMap.get(q.items[0].productId)?.name || q.quotationNumber) : q.quotationNumber,
          subtotal: Number(q.subtotal),
          discountAmount: Number(q.discountAmount),
          taxAmount: Number(q.taxAmount),
          totalAmount: Number(q.totalAmount),
          status: q.status,
          validUntil: q.validUntil ? q.validUntil.toISOString() : null,
          convertedSaleId: q.convertedSaleId,
          notes: q.notes,
          createdAt: q.createdAt.toISOString(),
          items: q.items.map(i => ({
            id: i.id,
            productId: i.productId,
            productName: prodMap.get(i.productId)?.name || "",
            variantId: i.variantId,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice)
          }))
        }))
      }
    });
  } catch (err) { next(err); }
});

quotationRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    let storeId = req.user!.storeId || req.body.storeId;
    if (!storeId) {
      const firstStore = await prisma.store.findFirst({ where: { companyId } });
      storeId = firstStore?.id || "default-store";
    }
    const { customerId, items, discountAmount = 0, taxAmount = 0, validUntil, notes } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "At least one item is required" });
      return;
    }

    let subtotal = 0;
    const lineItems = items.map((i: any) => {
      const qty = Number(i.quantity || 1);
      const price = Number(i.unitPrice || 0);
      const total = qty * price;
      subtotal += total;
      return {
        productId: i.productId,
        variantId: i.variantId || null,
        quantity: qty,
        unitPrice: price,
        discountAmount: 0,
        taxAmount: 0,
        totalPrice: total
      };
    });

    const totalAmount = Math.max(0, subtotal - Number(discountAmount) + Number(taxAmount));

    const created = await prisma.quotation.create({
      data: {
        companyId,
        storeId,
        customerId: customerId || null,
        quotationNumber: "QT-" + Date.now().toString().slice(-6),
        subtotal,
        discountAmount: Number(discountAmount),
        taxAmount: Number(taxAmount),
        totalAmount,
        status: "PENDING",
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: notes || null,
        items: { create: lineItems }
      },
      include: { items: true }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
});

quotationRouter.post("/:id/convert-to-sale", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const cashierId = req.user!.id;
    const result = await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findFirst({
        where: { id: String(req.params.id), companyId },
        include: { items: true }
      });
      if (!quotation) throw new Error("Quotation not found");
      if (quotation.status === "CONVERTED" && quotation.convertedSaleId) {
        throw new Error("Quotation is already converted to a sale");
      }

      const sale = await tx.sale.create({
        data: {
          companyId,
          storeId: quotation.storeId,
          customerId: quotation.customerId,
          cashierId,
          invoiceNumber: "INV-QT-" + Date.now().toString().slice(-6),
          channel: "POS",
          subtotal: quotation.subtotal,
          discountAmount: quotation.discountAmount,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
          paidAmount: quotation.totalAmount,
          dueAmount: 0,
          status: "COMPLETED",
          paymentStatus: "PAID",
          notes: `Converted from ${quotation.quotationNumber}`,
          items: {
            create: quotation.items.map(i => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discountAmount: i.discountAmount,
              taxAmount: i.taxAmount,
              totalPrice: i.totalPrice
            }))
          }
        }
      });

      const updatedQuotation = await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: "CONVERTED", convertedSaleId: sale.id }
      });

      return { quotation: updatedQuotation, sale };
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

quotationRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const existing = await prisma.quotation.findFirst({ where: { id: String(req.params.id), companyId } });
    if (!existing) { res.status(404).json({ success: false, message: "Quotation not found" }); return; }
    await prisma.quotation.delete({ where: { id: existing.id } });
    res.json({ success: true, message: "Quotation deleted" });
  } catch (err) { next(err); }
});
