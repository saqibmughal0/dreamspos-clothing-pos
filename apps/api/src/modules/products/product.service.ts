import { prisma } from "@dreamspos/database";
import { ProductCreateInput } from "@dreamspos/shared";

export class ProductService {
  async list(companyId: string, options: { page?: number; limit?: number; search?: string; categoryId?: string; brandId?: string }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = { companyId, isActive: true };

    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { sku: { contains: options.search } },
        { barcode: { contains: options.search } }
      ];
    }
    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }
    if (options.brandId) {
      where.brandId = options.brandId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          brand: true,
          unit: true,
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
        brandId: p.brandId,
        brandName: p.brand?.name || null,
        unitId: p.unitId,
        unitName: p.unit.shortName,
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
        taxRate: Number(p.taxRate),
        taxType: p.taxType,
        alertQuantity: p.alertQuantity,
        stockQuantity: totalStock,
        image: p.image,
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
    const product = await prisma.product.findFirst({
      where: {
        companyId,
        OR: [{ barcode }, { sku: barcode }],
        isActive: true
      },
      include: {
        category: true,
        unit: true,
        stockBalances: true
      }
    });

    if (!product) return null;

    const totalStock = product.stockBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
    return {
      id: product.id,
      name: product.name,
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
      image: product.image
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
