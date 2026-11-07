import { prisma } from "@dreamspos/database";
import { PosCheckoutInput } from "@dreamspos/shared";
import { addMoney, subMoney, mulMoney, roundMoney } from "../../utils/decimal";

export class PosService {
  async checkout(companyId: string, cashierId: string, input: PosCheckoutInput) {
    return await prisma.$transaction(async (tx) => {
      // 1. Calculate line totals and subtotal
      let subtotal = 0;
      let totalTax = 0;

      for (const item of input.items) {
        const itemLineTotal = mulMoney(item.quantity, item.unitPrice);
        const itemNet = subMoney(itemLineTotal, item.discountAmount || 0);
        subtotal = addMoney(subtotal, itemNet);
        totalTax = addMoney(totalTax, item.taxAmount || 0);

        // Check stock availability in store warehouse
        const warehouse = await tx.warehouse.findFirst({
          where: { companyId }
        });

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

          // Deduct stock
          await tx.stockBalance.update({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: warehouse.id
              }
            },
            data: {
              quantity: {
                decrement: item.quantity
              }
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

      // Calculate total paid
      const totalPaid = input.payments.reduce((sum, p) => addMoney(sum, p.amount), 0);
      const dueAmount = roundMoney(Math.max(0, subMoney(finalTotal, totalPaid)));

      // Generate invoice number: INV-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const countToday = await tx.sale.count();
      const invoiceNumber = `INV-${dateStr}-${String(countToday + 1).padStart(4, "0")}`;

      // Create Sale record
      const sale = await tx.sale.create({
        data: {
          companyId,
          storeId: input.storeId,
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
            create: input.items.map(i => ({
              productId: i.productId,
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
          items: { include: { product: true } },
          payments: true,
          customer: true
        }
      });

      return {
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        totalAmount: Number(sale.totalAmount),
        paidAmount: Number(sale.paidAmount),
        dueAmount: Number(sale.dueAmount),
        changeDue: Math.max(0, roundMoney(subMoney(totalPaid, finalTotal))),
        status: sale.status,
        createdAt: sale.createdAt.toISOString()
      };
    });
  }

  async getRecentOrders(companyId: string, limit = 10) {
    const sales = await prisma.sale.findMany({
      where: { companyId, channel: "POS" },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        cashier: true
      }
    });

    return sales.map(s => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.customer?.name || "Walk-in Customer",
      cashierName: s.cashier.name,
      totalAmount: Number(s.totalAmount),
      status: s.status,
      paymentStatus: s.paymentStatus,
      createdAt: s.createdAt.toISOString()
    }));
  }
}

export const posService = new PosService();
