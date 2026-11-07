import { prisma } from "@dreamspos/database";
import { PosCheckoutInput } from "@dreamspos/shared";
import { addMoney, subMoney, mulMoney, roundMoney } from "../../utils/decimal";

export class PosService {
  async checkout(companyId: string, cashierId: string, input: PosCheckoutInput) {
    return await prisma.$transaction(async (tx) => {
      // 1. Calculate line totals and subtotal
      let subtotal = 0;
      let totalTax = 0;

      for (const item of input.items as any[]) {
        const itemLineTotal = mulMoney(item.quantity, item.unitPrice);
        const itemNet = subMoney(itemLineTotal, item.discountAmount || 0);
        subtotal = addMoney(subtotal, itemNet);
        totalTax = addMoney(totalTax, item.taxAmount || 0);

        // Check stock availability in store warehouse
        const warehouse = await tx.warehouse.findFirst({ where: { companyId } });

        // If variant specified (clothing size/color), deduct variant stock
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId }
          });

          if (!variant || Number(variant.stockQty) < item.quantity) {
            throw new Error(
              `Insufficient stock for variant "${item.color || ''} - ${item.size || ''}". Available: ${variant ? Number(variant.stockQty) : 0}, Requested: ${item.quantity}`
            );
          }

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQty: { decrement: item.quantity } }
          });
        }

        if (warehouse) {
          const balance = await tx.stockBalance.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: warehouse.id
              }
            }
          });

          const currentQty = balance ? Number(balance.quantity) : 0;
          if (currentQty < item.quantity) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            throw new Error(`Insufficient stock for product "${product?.name || item.productId}". Available: ${currentQty}, Requested: ${item.quantity}`);
          }

          // Deduct main warehouse stock
          await tx.stockBalance.update({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: warehouse.id
              }
            },
            data: {
              quantity: { decrement: item.quantity }
            }
          });

          // Record stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: warehouse.id,
              type: "SALE",
              quantity: item.quantity,
              referenceType: "POS_SALE"
            }
          });
        }
      }

      // Calculate final total: subtotal - orderDiscount + totalTax + shippingFee
      const afterDiscount = subMoney(subtotal, input.orderDiscount || 0);
      const afterTax = addMoney(afterDiscount, totalTax);
      const finalTotal = roundMoney(addMoney(afterTax, input.shippingFee || 0));

      // Calculate total paid across split or single tenders
      const totalPaid = input.payments.reduce((sum, p) => addMoney(sum, p.amount), 0);
      const dueAmount = roundMoney(Math.max(0, subMoney(finalTotal, totalPaid)));

      // Generate invoice number: INV-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const countToday = await tx.sale.count();
      const invoiceNumber = `INV-${dateStr}-${String(countToday + 1).padStart(4, "0")}`;

      // Check for active cash register session
      const activeSession = await tx.cashRegisterSession.findFirst({
        where: { userId: cashierId, status: "OPEN" },
        orderBy: { openedAt: "desc" }
      });

      // Create Sale record
      const sale = await tx.sale.create({
        data: {
          companyId,
          storeId: input.storeId,
          registerSessionId: activeSession?.id || null,
          customerId: input.customerId,
          cashierId,
          invoiceNumber,
          channel: input.channel,
          subtotal,
          discountAmount: input.orderDiscount || 0,
          taxAmount: totalTax,
          shippingFee: input.shippingFee || 0,
          totalAmount: finalTotal,
          paidAmount: totalPaid,
          dueAmount,
          status: "COMPLETED",
          paymentStatus: dueAmount === 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "DUE",
          notes: input.notes,
          items: {
            create: (input.items as any[]).map(i => ({
              productId: i.productId,
              variantId: i.variantId || null,
              size: i.size || null,
              color: i.color || null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discountAmount: i.discountAmount || 0,
              taxAmount: i.taxAmount || 0,
              totalPrice: roundMoney(subMoney(mulMoney(i.quantity, i.unitPrice), i.discountAmount || 0))
            }))
          },
          payments: {
            create: input.payments.map(p => ({
              method: p.method,
              amount: p.amount,
              referenceNumber: p.referenceNumber
            }))
          }
        },
        include: {
          items: { include: { product: true, variant: true } },
          payments: true,
          customer: true
        }
      });

      return {
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
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
        items: sale.items.map(it => ({
          name: it.product.name,
          size: it.size,
          color: it.color,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          totalPrice: Number(it.totalPrice)
        })),
        payments: sale.payments.map(pm => ({
          method: pm.method,
          amount: Number(pm.amount)
        }))
      };
    });
  }

  // Cash Register Sessions
  async openRegister(storeId: string, userId: string, openingFloat: number) {
    // Check if open session already exists
    const existing = await prisma.cashRegisterSession.findFirst({
      where: { userId, status: "OPEN" }
    });

    if (existing) {
      return existing;
    }

    const register = await prisma.cashRegister.findFirst({
      where: { storeId, isActive: true }
    });

    if (!register) {
      throw new Error("No active cash register found for this store");
    }

    const session = await prisma.cashRegisterSession.create({
      data: {
        registerId: register.id,
        userId,
        openingFloat,
        status: "OPEN"
      }
    });

    return session;
  }

  async closeRegister(sessionId: string, closingCash: number) {
    const session = await prisma.cashRegisterSession.findUnique({
      where: { id: sessionId },
      include: {
        sales: {
          include: { payments: true }
        }
      }
    });

    if (!session || session.status === "CLOSED") {
      throw new Error("Session not found or already closed");
    }

    // Calculate cash payments received in this shift
    let cashSalesTotal = 0;
    for (const sale of session.sales) {
      for (const p of sale.payments) {
        if (p.method === "CASH") {
          cashSalesTotal = addMoney(cashSalesTotal, Number(p.amount));
        }
      }
    }

    const expectedCash = roundMoney(addMoney(Number(session.openingFloat), cashSalesTotal));
    const difference = roundMoney(subMoney(closingCash, expectedCash));

    const updated = await prisma.cashRegisterSession.update({
      where: { id: sessionId },
      data: {
        closingCash,
        expectedCash,
        difference,
        closedAt: new Date(),
        status: "CLOSED"
      }
    });

    return {
      session: updated,
      openingFloat: Number(session.openingFloat),
      cashSalesTotal,
      closingCash,
      expectedCash,
      difference
    };
  }

  async getActiveRegister(userId: string) {
    const session = await prisma.cashRegisterSession.findFirst({
      where: { userId, status: "OPEN" },
      include: {
        register: true,
        sales: {
          include: { payments: true }
        }
      },
      orderBy: { openedAt: "desc" }
    });

    if (!session) return null;

    let cashSalesTotal = 0;
    let cardSalesTotal = 0;
    let totalSales = 0;

    for (const sale of session.sales) {
      totalSales = addMoney(totalSales, Number(sale.totalAmount));
      for (const p of sale.payments) {
        if (p.method === "CASH") cashSalesTotal = addMoney(cashSalesTotal, Number(p.amount));
        if (p.method === "CARD") cardSalesTotal = addMoney(cardSalesTotal, Number(p.amount));
      }
    }

    return {
      id: session.id,
      registerName: session.register.name,
      openedAt: session.openedAt.toISOString(),
      openingFloat: Number(session.openingFloat),
      salesCount: session.sales.length,
      cashSalesTotal,
      cardSalesTotal,
      totalSales,
      expectedCash: roundMoney(addMoney(Number(session.openingFloat), cashSalesTotal))
    };
  }

  // Thermal Receipt Data Formatter (58mm and 80mm format)
  async getReceiptData(saleId: string) {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        company: true,
        store: true,
        cashier: true,
        customer: true,
        items: { include: { product: true, variant: true } },
        payments: true
      }
    });

    if (!sale) return null;

    return {
      companyName: sale.company.name,
      storeName: sale.store.name,
      storeAddress: sale.store.address || "Main Street Outlet",
      storePhone: sale.store.phone || "+1 800 555 0101",
      invoiceNumber: sale.invoiceNumber,
      date: sale.createdAt.toLocaleDateString(),
      time: sale.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      cashier: sale.cashier.name,
      customer: sale.customer?.name || "Walk-in Customer",
      items: sale.items.map(i => ({
        name: i.variant ? `${i.product.name} (${i.color} / ${i.size})` : i.product.name,
        quantity: Number(i.quantity),
        price: Number(i.unitPrice),
        total: Number(i.totalPrice)
      })),
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discountAmount),
      tax: Number(sale.taxAmount),
      total: Number(sale.totalAmount),
      payments: sale.payments.map(p => ({
        method: p.method,
        amount: Number(p.amount)
      })),
      changeDue: Math.max(0, roundMoney(subMoney(Number(sale.paidAmount), Number(sale.totalAmount)))),
      barcode: sale.invoiceNumber
    };
  }
}

export const posService = new PosService();
