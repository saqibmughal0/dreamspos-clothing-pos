import { prisma } from "@dreamspos/database";
import { addMoney, subMoney, roundMoney } from "../../utils/decimal";

export interface SalesReturnInput {
  saleId: string;
  items: {
    saleItemId: string;
    quantity: number;
    reason?: string;
  }[];
  refundMethod: string; // CASH, CARD, STORE_CREDIT
  reason?: string;
}

export interface ClothingExchangeInput {
  saleId: string;
  originalSaleItemId: string;
  exchangeQuantity: number;
  newVariantId: string;
  reason?: string;
}

export class SaleService {
  async processReturn(companyId: string, storeId: string, input: SalesReturnInput) {
    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: input.saleId },
        include: { items: true, company: true }
      });

      if (!sale) {
        throw new Error("Original sale record not found");
      }

      const warehouse = await tx.warehouse.findFirst({ where: { companyId } });
      let totalRefund = 0;
      const returnItemsData: any[] = [];

      for (const reqItem of input.items) {
        const saleItem = sale.items.find(i => i.id === reqItem.saleItemId);
        if (!saleItem) {
          throw new Error(`Sale line item ${reqItem.saleItemId} not found on invoice`);
        }

        if (reqItem.quantity > Number(saleItem.quantity)) {
          throw new Error(`Cannot return quantity ${reqItem.quantity} exceeding purchased quantity ${saleItem.quantity}`);
        }

        const lineUnitPrice = Number(saleItem.unitPrice);
        const itemRefund = roundMoney(lineUnitPrice * reqItem.quantity);
        totalRefund = addMoney(totalRefund, itemRefund);

        // Restock variant if item had variant
        if (saleItem.variantId) {
          await tx.productVariant.update({
            where: { id: saleItem.variantId },
            data: { stockQty: { increment: reqItem.quantity } }
          });
        }

        // Restock warehouse balance
        if (warehouse) {
          await tx.stockBalance.update({
            where: {
              productId_warehouseId: {
                productId: saleItem.productId,
                warehouseId: warehouse.id
              }
            },
            data: { quantity: { increment: reqItem.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              productId: saleItem.productId,
              warehouseId: warehouse.id,
              type: "SALE_RETURN",
              quantity: reqItem.quantity,
              referenceType: "SALES_RETURN"
            }
          });
        }

        returnItemsData.push({
          saleItemId: saleItem.id,
          productId: saleItem.productId,
          variantId: saleItem.variantId,
          quantity: reqItem.quantity,
          refundAmount: itemRefund,
          isRestocked: true
        });
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const countReturns = await tx.salesReturn.count();
      const returnNumber = `RET-${dateStr}-${String(countReturns + 1).padStart(4, "0")}`;

      const salesReturn = await tx.salesReturn.create({
        data: {
          companyId,
          storeId,
          saleId: sale.id,
          returnNumber,
          refundAmount: totalRefund,
          refundMethod: input.refundMethod,
          reason: input.reason || "Customer return",
          items: {
            create: returnItemsData
          }
        },
        include: { items: true }
      });

      return {
        returnId: salesReturn.id,
        returnNumber: salesReturn.returnNumber,
        refundAmount: Number(salesReturn.refundAmount),
        refundMethod: salesReturn.refundMethod,
        itemsCount: salesReturn.items.length,
        createdAt: salesReturn.createdAt.toISOString()
      };
    });
  }

  // Clothing Size / Color Exchange
  async processExchange(companyId: string, storeId: string, input: ClothingExchangeInput) {
    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: input.saleId },
        include: { items: true }
      });

      if (!sale) throw new Error("Sale not found");

      const origItem = sale.items.find(i => i.id === input.originalSaleItemId);
      if (!origItem) throw new Error("Original item not found in sale");

      if (input.exchangeQuantity > Number(origItem.quantity)) {
        throw new Error("Exchange quantity cannot exceed originally purchased quantity");
      }

      // Find replacement variant
      const newVariant = await tx.productVariant.findUnique({
        where: { id: input.newVariantId },
        include: { product: true }
      });

      if (!newVariant || !newVariant.isActive) {
        throw new Error("Replacement clothing variant not found or inactive");
      }

      if (Number(newVariant.stockQty) < input.exchangeQuantity) {
        throw new Error(`Insufficient stock for replacement variant (${newVariant.color} - ${newVariant.size}). Available: ${newVariant.stockQty}`);
      }

      // 1. Restock original variant
      if (origItem.variantId) {
        await tx.productVariant.update({
          where: { id: origItem.variantId },
          data: { stockQty: { increment: input.exchangeQuantity } }
        });
      }

      // 2. Deduct replacement variant stock
      await tx.productVariant.update({
        where: { id: newVariant.id },
        data: { stockQty: { decrement: input.exchangeQuantity } }
      });

      // 3. Price difference
      const origPrice = Number(origItem.unitPrice);
      const newPrice = Number(newVariant.product.sellingPrice) + Number(newVariant.priceDiff);
      const priceDifference = roundMoney((newPrice - origPrice) * input.exchangeQuantity);

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          action: "CLOTHING_EXCHANGE",
          entityType: "SALE",
          entityId: sale.id,
          newValues: JSON.stringify({
            from: { variantId: origItem.variantId, size: origItem.size, color: origItem.color },
            to: { variantId: newVariant.id, size: newVariant.size, color: newVariant.color },
            quantity: input.exchangeQuantity,
            priceDifference,
            reason: input.reason || "Size/color exchange"
          })
        }
      });

      return {
        success: true,
        exchangeSummary: {
          originalItem: `${origItem.color || ''} - ${origItem.size || ''}`,
          replacementItem: `${newVariant.color} - ${newVariant.size}`,
          quantity: input.exchangeQuantity,
          priceDifference, // positive means customer pays extra, negative means store refunds
          status: "EXCHANGED"
        }
      };
    });
  }
}

export const saleService = new SaleService();
