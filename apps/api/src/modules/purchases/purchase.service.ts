import { prisma } from "@dreamspos/database";
import {
  PurchaseCreateInput,
  PurchaseReceiveInput,
  PurchaseReturnCreateInput,
  SupplierPaymentCreateInput
} from "@dreamspos/shared";

export class PurchaseService {
  async listPurchases(companyId: string, options: { supplierId?: string; status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (options.supplierId) where.supplierId = options.supplierId;
    if (options.status) where.status = options.status;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: { product: true, variant: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.purchase.count({ where })
    ]);

    return {
      items: purchases.map(p => ({
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        supplierName: p.supplier.name,
        warehouseName: p.warehouse.name,
        subtotal: Number(p.subtotal),
        taxAmount: Number(p.taxAmount),
        totalAmount: Number(p.totalAmount),
        paidAmount: Number(p.paidAmount),
        dueAmount: Number(p.totalAmount) - Number(p.paidAmount),
        status: p.status,
        paymentStatus: p.paymentStatus,
        itemCount: p.items.length,
        items: p.items.map(i => ({
          id: i.id,
          productId: i.productId,
          productName: i.product.name,
          variantSku: i.variant?.sku,
          size: i.variant?.size,
          color: i.variant?.color,
          quantity: Number(i.quantity),
          receivedQty: Number(i.receivedQty),
          unitCost: Number(i.unitCost),
          totalCost: Number(i.totalCost)
        })),
        createdAt: p.createdAt.toISOString()
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getPurchaseById(companyId: string, id: string) {
    const purchase = await prisma.purchase.findFirst({
      where: { id, companyId },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: { product: true, variant: true }
        },
        returns: true,
        payments: true
      }
    });

    if (!purchase) return null;

    return {
      ...purchase,
      subtotal: Number(purchase.subtotal),
      taxAmount: Number(purchase.taxAmount),
      totalAmount: Number(purchase.totalAmount),
      paidAmount: Number(purchase.paidAmount),
      dueAmount: Number(purchase.totalAmount) - Number(purchase.paidAmount),
      items: purchase.items.map(i => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        variantId: i.variantId,
        size: i.variant?.size,
        color: i.variant?.color,
        quantity: Number(i.quantity),
        receivedQty: Number(i.receivedQty),
        unitCost: Number(i.unitCost),
        totalCost: Number(i.totalCost)
      }))
    };
  }

  async createPurchase(companyId: string, input: PurchaseCreateInput) {
    return await prisma.$transaction(async tx => {
      const purchaseNumber = `PO-${Date.now().toString().slice(-6)}`;

      let subtotal = 0;
      let taxAmount = 0;

      for (const item of input.items) {
        subtotal += item.quantity * item.unitCost;
        taxAmount += item.taxAmount || 0;
      }
      const totalAmount = subtotal + taxAmount;

      const purchase = await tx.purchase.create({
        data: {
          companyId,
          warehouseId: input.warehouseId,
          supplierId: input.supplierId,
          purchaseNumber,
          subtotal,
          taxAmount,
          totalAmount,
          paidAmount: 0,
          status: "ORDERED",
          paymentStatus: "DUE",
          notes: input.notes
        }
      });

      for (const item of input.items) {
        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            receivedQty: 0,
            unitCost: item.unitCost,
            taxAmount: item.taxAmount || 0,
            totalCost: item.quantity * item.unitCost + (item.taxAmount || 0)
          }
        });
      }

      // Increment supplier balance due
      await tx.supplier.update({
        where: { id: input.supplierId },
        data: { currentBalance: { increment: totalAmount } }
      });

      return purchase;
    });
  }

  /**
   * Receive goods against Purchase Order (full or partial receiving).
   * Atomically increments inventory stock and updates unit cost history.
   */
  async receivePurchase(companyId: string, purchaseId: string, input: PurchaseReceiveInput) {
    return await prisma.$transaction(async tx => {
      const purchase = await tx.purchase.findFirst({
        where: { id: purchaseId, companyId },
        include: { items: true }
      });

      if (!purchase) throw new Error("Purchase order not found");

      for (const receiveLine of input.items) {
        const item = purchase.items.find(i => i.id === receiveLine.purchaseItemId);
        if (!item) throw new Error(`Purchase item ${receiveLine.purchaseItemId} not found in this order`);

        const newReceivedQty = Number(item.receivedQty) + receiveLine.receivedQty;
        if (newReceivedQty > Number(item.quantity)) {
          throw new Error(
            `Cannot receive ${receiveLine.receivedQty} units. Total ordered: ${Number(item.quantity)}, previously received: ${Number(item.receivedQty)}.`
          );
        }

        // Update received qty on line
        await tx.purchaseItem.update({
          where: { id: item.id },
          data: { receivedQty: newReceivedQty }
        });

        // Increment warehouse stock
        await tx.stockBalance.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: purchase.warehouseId
            }
          },
          create: {
            productId: item.productId,
            warehouseId: purchase.warehouseId,
            quantity: receiveLine.receivedQty
          },
          update: {
            quantity: { increment: receiveLine.receivedQty }
          }
        });

        // Increment variant stock if applicable
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQty: { increment: receiveLine.receivedQty },
              costPrice: item.unitCost
            }
          });
        }

        // Update product cost price
        await tx.product.update({
          where: { id: item.productId },
          data: { costPrice: item.unitCost }
        });

        // Create StockMovement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: purchase.warehouseId,
            type: "PURCHASE",
            quantity: receiveLine.receivedQty,
            referenceType: "PURCHASE_ORDER",
            referenceId: purchase.id,
            notes: `Received from PO ${purchase.purchaseNumber}`
          }
        });
      }

      // Check if all items fully received
      const updatedItems = await tx.purchaseItem.findMany({ where: { purchaseId } });
      const allFullyReceived = updatedItems.every(i => Number(i.receivedQty) >= Number(i.quantity));
      const anyReceived = updatedItems.some(i => Number(i.receivedQty) > 0);

      const status = allFullyReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : "ORDERED";

      return await tx.purchase.update({
        where: { id: purchaseId },
        data: { status }
      });
    });
  }

  /**
   * Purchase Returns (returning defective goods to supplier).
   * Atomically verifies stock is available, deducts stock, logs movement, reduces supplier balance.
   */
  async createPurchaseReturn(companyId: string, input: PurchaseReturnCreateInput) {
    return await prisma.$transaction(async tx => {
      const returnNumber = `PR-${Date.now().toString().slice(-6)}`;
      let refundAmount = 0;

      // Verify stock availability for all return items
      for (const item of input.items) {
        const balance = await tx.stockBalance.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: input.warehouseId
            }
          }
        });
        const available = balance ? Number(balance.quantity) : 0;
        if (available < item.quantity) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          throw new Error(
            `Cannot return defective garment "${product?.name}". Available warehouse stock is ${available}, return quantity is ${item.quantity}.`
          );
        }

        refundAmount += item.quantity * item.unitCost;
      }

      // Create return header
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          companyId,
          warehouseId: input.warehouseId,
          supplierId: input.supplierId,
          purchaseId: input.purchaseId,
          returnNumber,
          refundAmount,
          reason: input.reason,
          status: "COMPLETED"
        }
      });

      // Deduct stock and record items
      for (const item of input.items) {
        const totalAmount = item.quantity * item.unitCost;

        await tx.stockBalance.update({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: input.warehouseId
            }
          },
          data: { quantity: { decrement: item.quantity } }
        });

        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQty: { decrement: item.quantity } }
          });
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: input.warehouseId,
            type: "PURCHASE_RETURN",
            quantity: -item.quantity,
            referenceType: "PURCHASE_RETURN",
            referenceId: purchaseReturn.id,
            notes: `Supplier return: ${input.reason || "Defective goods"}`
          }
        });

        await tx.purchaseReturnItem.create({
          data: {
            purchaseReturnId: purchaseReturn.id,
            purchaseItemId: item.purchaseItemId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalAmount
          }
        });
      }

      // Decrement supplier balance
      await tx.supplier.update({
        where: { id: input.supplierId },
        data: { currentBalance: { decrement: refundAmount } }
      });

      return purchaseReturn;
    });
  }

  async listPurchaseReturns(companyId: string, options: { page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const [returns, total] = await Promise.all([
      prisma.purchaseReturn.findMany({
        where: { companyId },
        skip,
        take: limit,
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: { product: true, variant: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.purchaseReturn.count({ where: { companyId } })
    ]);

    return {
      items: returns.map(r => ({
        id: r.id,
        returnNumber: r.returnNumber,
        supplierName: r.supplier.name,
        warehouseName: r.warehouse.name,
        refundAmount: Number(r.refundAmount),
        reason: r.reason,
        status: r.status,
        itemCount: r.items.length,
        items: r.items.map(i => ({
          productName: i.product.name,
          variantSku: i.variant?.sku,
          size: i.variant?.size,
          color: i.variant?.color,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
          totalAmount: Number(i.totalAmount)
        })),
        createdAt: r.createdAt.toISOString()
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Supplier Payments
   */
  async recordSupplierPayment(companyId: string, input: SupplierPaymentCreateInput) {
    return await prisma.$transaction(async tx => {
      const paymentNumber = `SP-${Date.now().toString().slice(-6)}`;

      const payment = await tx.supplierPayment.create({
        data: {
          companyId,
          supplierId: input.supplierId,
          purchaseId: input.purchaseId,
          paymentNumber,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referenceNumber,
          notes: input.notes
        }
      });

      // Deduct balance from supplier
      await tx.supplier.update({
        where: { id: input.supplierId },
        data: { currentBalance: { decrement: input.amount } }
      });

      // If linked to specific purchase, update paidAmount
      if (input.purchaseId) {
        const purchase = await tx.purchase.findUnique({ where: { id: input.purchaseId } });
        if (purchase) {
          const newPaid = Number(purchase.paidAmount) + input.amount;
          const paymentStatus = newPaid >= Number(purchase.totalAmount) ? "PAID" : "PARTIAL";
          await tx.purchase.update({
            where: { id: input.purchaseId },
            data: { paidAmount: newPaid, paymentStatus }
          });
        }
      }

      return payment;
    });
  }
}

export const purchaseService = new PurchaseService();
