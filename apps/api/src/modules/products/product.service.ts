import { prisma } from "@dreamspos/database";
import { ProductCreateInput } from "@dreamspos/shared";

export class ProductService {
  async list(companyId: string, options: { page?: number; limit?: number; search?: string; categoryId?: string; brandId?: string }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { companyId, isActive: true };

    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { sku: { contains: options.search } },
        { barcode: { contains: options.search } },
        { variants: { some: { OR: [{ sku: { contains: options.search } }, { barcode: { contains: options.search } }] } } }
      ];
    }
    if (options.categoryId && options.categoryId !== "all") {
      where.categoryId = options.categoryId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          unit: true,
          variants: { where: { isActive: true } },
          stockBalances: true
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.product.count({ where })
    ]);

    const items = products.map(p => {
      const totalStock = p.stockBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        unitName: p.unit.shortName,
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
        taxRate: Number(p.taxRate),
        taxType: p.taxType,
        alertQuantity: p.alertQuantity,
        stockQuantity: totalStock,
        image: p.image,
        variants: p.variants.map(v => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          barcode: v.barcode,
          price: Number(p.sellingPrice) + Number(v.priceDiff),
          stockQty: Number(v.stockQty)
        })),
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString()
      };
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findByBarcode(companyId: string, barcode: string) {
    // 1. Check if barcode belongs to a specific variant (clothing size/color)
    const variant = await prisma.productVariant.findFirst({
      where: {
        OR: [{ barcode }, { sku: barcode }],
        isActive: true,
        product: { companyId }
      },
      include: {
        product: {
          include: { category: true, unit: true, variants: { where: { isActive: true } } }
        }
      }
    });

    if (variant) {
      return {
        id: variant.product.id,
        variantId: variant.id,
        name: `${variant.product.name} (${variant.color} - ${variant.size})`,
        baseName: variant.product.name,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        barcode: variant.barcode,
        categoryId: variant.product.categoryId,
        categoryName: variant.product.category.name,
        unitName: variant.product.unit.shortName,
        costPrice: Number(variant.product.costPrice),
        sellingPrice: Number(variant.product.sellingPrice) + Number(variant.priceDiff),
        taxRate: Number(variant.product.taxRate),
        taxType: variant.product.taxType,
        stockQuantity: Number(variant.stockQty),
        image: variant.image || variant.product.image,
        variants: variant.product.variants.map(v => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          barcode: v.barcode,
          price: Number(variant.product.sellingPrice) + Number(v.priceDiff),
          stockQty: Number(v.stockQty)
        }))
      };
    }

    // 2. Otherwise check base product barcode
    const product = await prisma.product.findFirst({
      where: {
        companyId,
        OR: [{ barcode }, { sku: barcode }],
        isActive: true
      },
      include: {
        category: true,
        unit: true,
        variants: { where: { isActive: true } },
        stockBalances: true
      }
    });

    if (!product) return null;

    const totalStock = product.stockBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
    return {
      id: product.id,
      variantId: null,
      name: product.name,
      baseName: product.name,
      size: null,
      color: null,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      unitName: product.unit.shortName,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      taxRate: Number(product.taxRate),
      taxType: product.taxType,
      stockQuantity: totalStock,
      image: product.image,
      variants: product.variants.map(v => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        barcode: v.barcode,
        price: Number(product.sellingPrice) + Number(v.priceDiff),
        stockQty: Number(v.stockQty)
      }))
    };
  }

  async create(companyId: string, input: ProductCreateInput) {
    const product = await prisma.product.create({
      data: {
        companyId,
        name: input.name,
        sku: input.sku,
        barcode: input.barcode,
        categoryId: input.categoryId,
        brandId: input.brandId,
        unitId: input.unitId,
        costPrice: input.costPrice,
        sellingPrice: input.sellingPrice,
        taxRate: input.taxRate,
        taxType: input.taxType,
        alertQuantity: input.alertQuantity,
        description: input.description,
        image: input.image
      }
    });

    return product;
  }
}

export const productService = new ProductService();
