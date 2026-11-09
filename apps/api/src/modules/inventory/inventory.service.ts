import { prisma } from "@dreamspos/database";
import { StockAdjustmentCreateInput, StockTransferCreateInput } from "@dreamspos/shared";

export class InventoryService {
  /**
   * Create Stock Adjustment (Addition, Subtraction, Physical Count variance, Damaged)
   * Enforces strict transactional integrity and prevents negative stock.
   */
  async createAdjustment(companyId: string, input: StockAdjustmentCreateInput) {
    return await prisma.$transaction(async tx => {
      const adjustmentNumber = `ADJ-${Date.now().toString().slice(-6)}`;
      let totalAmount = 0;

      // 1. Create StockAdjustment header
      const adjustment = await tx.stockAdjustment.create({
        data: {
          companyId,
          warehouseId: input.warehouseId,
          adjustmentNumber,
          referenceNo: input.referenceNo,
          type: input.type,
          reason: input.reason,
          totalAmount: 0,
          status: "COMPLETED"
        }
      });

      // 2. Process each item atomically
      for (const item of input.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, companyId }
        });
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const unitCost = item.unitCost !== undefined ? item.unitCost : Number(product.costPrice);
        const lineTotal = item.quantity * unitCost;
        totalAmount += lineTotal;

        // Verify warehouse balance
        const balance = await tx.stockBalance.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: input.warehouseId
            }
          }
        });

        const currentBalanceQty = balance ? Number(balance.quantity) : 0;

        // If subtracting, strictly prevent negative stock
        if (item.type === "SUBTRACT") {
          if (currentBalanceQty < item.quantity) {
            throw new Error(
              `Insufficient stock for "${product.name}". Available warehouse stock is ${currentBalanceQty}, requested adjustment is -${item.quantity}. Negative stock is disallowed.`
            );
          }

          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId }
            });
            if (!variant) throw new Error(`Variant not found: ${item.variantId}`);
            if (Number(variant.stockQty) < item.quantity) {
              throw new Error(
                `Insufficient stock for variant "${variant.sku}" (${variant.color} - ${variant.size}). Available stock is ${Number(variant.stockQty)}, requested adjustment is -${item.quantity}.`
              );
            }

            // Deduct variant stock
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQty: { decrement: item.quantity } }
            });
          }

          // Deduct warehouse stock
          await tx.stockBalance.update({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: input.warehouseId
              }
            },
            data: { quantity: { decrement: item.quantity } }
          });

          // Log movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: input.warehouseId,
              type: "ADJUSTMENT_SUB",
              quantity: -item.quantity,
              referenceType: "STOCK_ADJUSTMENT",
              referenceId: adjustment.id,
              notes: `${input.type}: ${input.reason || "Manual deduction"}`
            }
          });
        } else {
          // ADDITION
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQty: { increment: item.quantity } }
            });
          }

          await tx.stockBalance.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: input.warehouseId
              }
            },
            create: {
              productId: item.productId,
              warehouseId: input.warehouseId,
              quantity: item.quantity
            },
            update: {
              quantity: { increment: item.quantity }
            }
          });

          // Log movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: input.warehouseId,
              type: "ADJUSTMENT_ADD",
              quantity: item.quantity,
              referenceType: "STOCK_ADJUSTMENT",
              referenceId: adjustment.id,
              notes: `${input.type}: ${input.reason || "Manual addition"}`
            }
          });
        }

        // Record adjustment line
        await tx.stockAdjustmentItem.create({
          data: {
            adjustmentId: adjustment.id,
            productId: item.productId,
            variantId: item.variantId,
            type: item.type,
            quantity: item.quantity,
            unitCost,
            subtotal: lineTotal
          }
        });
      }

      // 3. Update adjustment total
      return await tx.stockAdjustment.update({
        where: { id: adjustment.id },
        data: { totalAmount },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          },
          warehouse: true
        }
      });
    });
  }

  /**
   * List adjustments
   */
  async listAdjustments(companyId: string, options: { warehouseId?: string; type?: string; page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (options.warehouseId) where.warehouseId = options.warehouseId;
    if (options.type) where.type = options.type;

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        skip,
        take: limit,
        include: {
          warehouse: true,
          items: {
            include: { product: true, variant: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.stockAdjustment.count({ where })
    ]);

    return {
      items: adjustments.map(a => ({
        id: a.id,
        adjustmentNumber: a.adjustmentNumber,
        warehouseName: a.warehouse.name,
        type: a.type,
        reason: a.reason,
        totalAmount: Number(a.totalAmount),
        status: a.status,
        itemCount: a.items.length,
        items: a.items.map(i => ({
          productId: i.productId,
          productName: i.product.name,
          variantSku: i.variant?.sku,
          size: i.variant?.size,
          color: i.variant?.color,
          type: i.type,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
          subtotal: Number(i.subtotal)
        })),
        createdAt: a.createdAt.toISOString()
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
   * Warehouse / Store Stock Transfer
   */
  async createTransfer(companyId: string, input: StockTransferCreateInput) {
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new Error("Source and destination warehouses cannot be the same");
    }

    return await prisma.$transaction(async tx => {
      const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;

      // Check all items have sufficient stock in fromWarehouse
      for (const item of input.items) {
        const balance = await tx.stockBalance.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: input.fromWarehouseId
            }
          }
        });

        const currentQty = balance ? Number(balance.quantity) : 0;
        if (currentQty < item.quantity) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          throw new Error(
            `Insufficient stock to transfer "${product?.name}". Source warehouse has ${currentQty}, requested transfer is ${item.quantity}.`
          );
        }
      }

      // Create transfer header
      const transfer = await tx.stockTransfer.create({
        data: {
          companyId,
          fromWarehouseId: input.fromWarehouseId,
          toWarehouseId: input.toWarehouseId,
          transferNumber,
          shippingCharge: input.shippingCharge || 0,
          notes: input.notes,
          status: "COMPLETED"
        }
      });

      // Transfer each item
      for (const item of input.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const unitCost = item.unitCost !== undefined ? item.unitCost : Number(product?.costPrice || 0);
        const subtotal = item.quantity * unitCost;

        // Deduct from source warehouse
        await tx.stockBalance.update({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: input.fromWarehouseId
            }
          },
          data: { quantity: { decrement: item.quantity } }
        });

        // Add to destination warehouse
        await tx.stockBalance.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: input.toWarehouseId
            }
          },
          create: {
            productId: item.productId,
            warehouseId: input.toWarehouseId,
            quantity: item.quantity
          },
          update: {
            quantity: { increment: item.quantity }
          }
        });

        // Log TRANSFER_OUT and TRANSFER_IN
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: input.fromWarehouseId,
            type: "TRANSFER_OUT",
            quantity: -item.quantity,
            referenceType: "STOCK_TRANSFER",
            referenceId: transfer.id,
            notes: `Transfer to warehouse ${input.toWarehouseId}`
          }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: input.toWarehouseId,
            type: "TRANSFER_IN",
            quantity: item.quantity,
            referenceType: "STOCK_TRANSFER",
            referenceId: transfer.id,
            notes: `Transfer from warehouse ${input.fromWarehouseId}`
          }
        });

        await tx.stockTransferItem.create({
          data: {
            transferId: transfer.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitCost,
            subtotal
          }
        });
      }

      return transfer;
    });
  }

  /**
   * List transfers
   */
  async listTransfers(companyId: string, options: { page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where: { companyId },
        skip,
        take: limit,
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: {
            include: { product: true, variant: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.stockTransfer.count({ where: { companyId } })
    ]);

    return {
      items: transfers.map(t => ({
        id: t.id,
        transferNumber: t.transferNumber,
        fromWarehouseName: t.fromWarehouse.name,
        toWarehouseName: t.toWarehouse.name,
        shippingCharge: Number(t.shippingCharge),
        status: t.status,
        itemCount: t.items.length,
        notes: t.notes,
        createdAt: t.createdAt.toISOString()
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
   * Inventory Valuation Report
   */
  async getValuation(companyId: string) {
    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      include: {
        variants: { where: { isActive: true } },
        stockBalances: true
      }
    });

    let totalQuantity = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    const productBreakdown = products.map(p => {
      const warehouseStock = p.stockBalances.reduce((acc, b) => acc + Number(b.quantity), 0);
      const variantStock = p.variants.reduce((acc, v) => acc + Number(v.stockQty), 0);
      const qty = Math.max(warehouseStock, variantStock);

      const costPrice = Number(p.costPrice);
      const sellingPrice = Number(p.sellingPrice);
      const costValue = qty * costPrice;
      const retailValue = qty * sellingPrice;
      const profitPotential = retailValue - costValue;

      totalQuantity += qty;
      totalCostValue += costValue;
      totalRetailValue += retailValue;

      return {
        id: p.id,
        name: p.name,
        articleCode: p.articleCode,
        sku: p.sku,
        quantity: qty,
        costPrice,
        sellingPrice,
        costValue,
        retailValue,
        profitPotential
      };
    });

    const totalPotentialProfit = totalRetailValue - totalCostValue;
    const overallMargin = totalRetailValue > 0 ? (totalPotentialProfit / totalRetailValue) * 100 : 0;

    return {
      summary: {
        totalProducts: products.length,
        totalQuantity,
        totalCostValue,
        totalRetailValue,
        totalPotentialProfit,
        overallMargin: Number(overallMargin.toFixed(2))
      },
      items: productBreakdown
    };
  }

  /**
   * Low Stock & Out of Stock Alerts
   */
  async getLowStockAlerts(companyId: string) {
    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      include: {
        category: true,
        variants: { where: { isActive: true } },
        stockBalances: true
      }
    });

    const lowStockItems: any[] = [];
    const outOfStockItems: any[] = [];

    for (const p of products) {
      const totalStock = p.variants.reduce((sum, v) => sum + Number(v.stockQty), 0);

      if (totalStock === 0) {
        outOfStockItems.push({
          id: p.id,
          name: p.name,
          articleCode: p.articleCode,
          sku: p.sku,
          category: p.category.name,
          stockQuantity: 0,
          alertQuantity: p.alertQuantity,
          status: "OUT_OF_STOCK"
        });
      } else if (totalStock <= p.alertQuantity) {
        lowStockItems.push({
          id: p.id,
          name: p.name,
          articleCode: p.articleCode,
          sku: p.sku,
          category: p.category.name,
          stockQuantity: totalStock,
          alertQuantity: p.alertQuantity,
          status: "LOW_STOCK"
        });
      }

      // Variant level check
      for (const v of p.variants) {
        const vQty = Number(v.stockQty);
        if (vQty <= 2) {
          lowStockItems.push({
            id: p.id,
            variantId: v.id,
            name: `${p.name} (${v.color} - ${v.size})`,
            articleCode: p.articleCode,
            sku: v.sku,
            category: p.category.name,
            size: v.size,
            color: v.color,
            stockQuantity: vQty,
            alertQuantity: 2,
            status: vQty === 0 ? "OUT_OF_STOCK" : "LOW_STOCK"
          });
        }
      }
    }

    return {
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems,
      outOfStockItems
    };
  }

  /**
   * Audit Trail of Stock Movements
   */
  async getMovements(companyId: string, options: { productId?: string; warehouseId?: string; type?: string; page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.productId) where.productId = options.productId;
    if (options.warehouseId) where.warehouseId = options.warehouseId;
    if (options.type) where.type = options.type;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: true,
          warehouse: true
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.stockMovement.count({ where })
    ]);

    return {
      items: movements.map(m => ({
        id: m.id,
        productName: m.product.name,
        productSku: m.product.sku,
        warehouseName: m.warehouse.name,
        type: m.type,
        quantity: Number(m.quantity),
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        notes: m.notes,
        createdAt: m.createdAt.toISOString()
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export const inventoryService = new InventoryService();
