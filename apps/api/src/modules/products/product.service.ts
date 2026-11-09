import { prisma } from "@dreamspos/database";
import { ProductCreateInput } from "@dreamspos/shared";

export class ProductService {
  async list(companyId: string, options: { page?: number; limit?: number; search?: string; categoryId?: string; brandId?: string; season?: string; gender?: string }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { companyId, isActive: true };

    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { sku: { contains: options.search } },
        { barcode: { contains: options.search } },
        { articleCode: { contains: options.search } },
        { variants: { some: { OR: [{ sku: { contains: options.search } }, { barcode: { contains: options.search } }] } } }
      ];
    }
    if (options.categoryId && options.categoryId !== "all") {
      where.categoryId = options.categoryId;
    }
    if (options.brandId && options.brandId !== "all") {
      where.brandId = options.brandId;
    }
    if (options.season && options.season !== "all") {
      where.season = options.season;
    }
    if (options.gender && options.gender !== "all") {
      where.gender = options.gender;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          unit: true,
          brand: true,
          variants: { where: { isActive: true } },
          stockBalances: true
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.product.count({ where })
    ]);

    const items = products.map(p => {
      const warehouseStock = p.stockBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
      const variantStock = p.variants.reduce((sum, v) => sum + Number(v.stockQty), 0);
      const totalStock = Math.max(warehouseStock, variantStock);

      let parsedImages: string[] = [];
      if (p.images) {
        try {
          parsedImages = JSON.parse(p.images);
        } catch {
          parsedImages = [p.images];
        }
      } else if (p.image) {
        parsedImages = [p.image];
      }

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        articleCode: p.articleCode,
        season: p.season,
        fabric: p.fabric,
        gender: p.gender,
        barcode: p.barcode,
        categoryId: p.categoryId,
        categoryName: p.category?.name || "Apparel",
        brandId: p.brandId,
        brandName: p.brand?.name || "Dreams Apparel",
        unitName: p.unit?.shortName || "Pc",
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
        taxRate: Number(p.taxRate),
        taxType: p.taxType,
        alertQuantity: p.alertQuantity,
        stockQuantity: totalStock,
        image: p.image,
        images: parsedImages,
        variants: p.variants.map(v => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          barcode: v.barcode,
          costPrice: Number(v.costPrice || p.costPrice),
          price: Number(p.sellingPrice) + Number(v.priceDiff),
          priceDiff: Number(v.priceDiff),
          stockQty: Number(v.stockQty),
          image: v.image
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
        articleCode: variant.product.articleCode,
        season: variant.product.season,
        fabric: variant.product.fabric,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        barcode: variant.barcode,
        categoryId: variant.product.categoryId,
        categoryName: variant.product.category?.name || "Apparel",
        unitName: variant.product.unit?.shortName || "Pc",
        costPrice: Number(variant.costPrice || variant.product.costPrice),
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

    const warehouseStock = product.stockBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
    const variantStock = product.variants.reduce((sum, v) => sum + Number(v.stockQty), 0);
    const totalStock = Math.max(warehouseStock, variantStock);

    return {
      id: product.id,
      variantId: null,
      name: product.name,
      baseName: product.name,
      articleCode: product.articleCode,
      season: product.season,
      fabric: product.fabric,
      size: null,
      color: null,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: product.categoryId,
      categoryName: product.category?.name || "Apparel",
      unitName: product.unit?.shortName || "Pc",
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

  async getById(companyId: string, id: string) {
    const product = await prisma.product.findFirst({
      where: { id, companyId, isActive: true },
      include: {
        category: true,
        unit: true,
        brand: true,
        variants: { where: { isActive: true } },
        stockBalances: true
      }
    });

    if (!product) return null;

    let parsedImages: string[] = [];
    if (product.images) {
      try {
        parsedImages = JSON.parse(product.images);
      } catch {
        parsedImages = [product.images];
      }
    } else if (product.image) {
      parsedImages = [product.image];
    }

    return {
      ...product,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      taxRate: Number(product.taxRate),
      images: parsedImages,
      variants: product.variants.map(v => ({
        ...v,
        costPrice: Number(v.costPrice),
        priceDiff: Number(v.priceDiff),
        stockQty: Number(v.stockQty)
      }))
    };
  }

  async create(companyId: string, input: ProductCreateInput) {
    return await prisma.$transaction(async tx => {
      const imagesJson = input.images ? JSON.stringify(input.images) : input.image ? JSON.stringify([input.image]) : null;

      const product = await tx.product.create({
        data: {
          companyId,
          name: input.name,
          sku: input.sku,
          articleCode: input.articleCode,
          season: input.season,
          fabric: input.fabric,
          gender: input.gender,
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
          image: input.image,
          images: imagesJson
        }
      });

      // If clothing size/color variants are provided, create them
      if (input.variants && input.variants.length > 0) {
        for (const variant of input.variants) {
          await tx.productVariant.create({
            data: {
              productId: product.id,
              size: variant.size,
              color: variant.color,
              sku: variant.sku,
              barcode: variant.barcode || variant.sku,
              costPrice: variant.costPrice !== undefined ? variant.costPrice : input.costPrice,
              priceDiff: variant.priceDiff || 0,
              stockQty: variant.stockQty || 0,
              image: variant.image || input.image
            }
          });
        }
      }

      return product;
    });
  }

  async update(companyId: string, id: string, input: Partial<ProductCreateInput>) {
    return await prisma.$transaction(async tx => {
      const existing = await tx.product.findFirst({
        where: { id, companyId }
      });
      if (!existing) {
        throw new Error("Product not found");
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.sku !== undefined) updateData.sku = input.sku;
      if (input.articleCode !== undefined) updateData.articleCode = input.articleCode;
      if (input.season !== undefined) updateData.season = input.season;
      if (input.fabric !== undefined) updateData.fabric = input.fabric;
      if (input.gender !== undefined) updateData.gender = input.gender;
      if (input.barcode !== undefined) updateData.barcode = input.barcode;
      if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
      if (input.brandId !== undefined) updateData.brandId = input.brandId;
      if (input.unitId !== undefined) updateData.unitId = input.unitId;
      if (input.costPrice !== undefined) updateData.costPrice = input.costPrice;
      if (input.sellingPrice !== undefined) updateData.sellingPrice = input.sellingPrice;
      if (input.taxRate !== undefined) updateData.taxRate = input.taxRate;
      if (input.taxType !== undefined) updateData.taxType = input.taxType;
      if (input.alertQuantity !== undefined) updateData.alertQuantity = input.alertQuantity;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.image !== undefined) updateData.image = input.image;
      if (input.images !== undefined) updateData.images = JSON.stringify(input.images);

      const updated = await tx.product.update({
        where: { id },
        data: updateData
      });

      // Upsert variants if provided
      if (input.variants && input.variants.length > 0) {
        for (const variant of input.variants) {
          if (variant.id) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                size: variant.size,
                color: variant.color,
                sku: variant.sku,
                barcode: variant.barcode || variant.sku,
                costPrice: variant.costPrice,
                priceDiff: variant.priceDiff || 0,
                stockQty: variant.stockQty,
                image: variant.image
              }
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                size: variant.size,
                color: variant.color,
                sku: variant.sku,
                barcode: variant.barcode || variant.sku,
                costPrice: variant.costPrice !== undefined ? variant.costPrice : updated.costPrice,
                priceDiff: variant.priceDiff || 0,
                stockQty: variant.stockQty || 0,
                image: variant.image || updated.image
              }
            });
          }
        }
      }

      return updated;
    });
  }

  async delete(companyId: string, id: string) {
    const existing = await prisma.product.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Product not found");

    return await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async getBarcodeLabels(companyId: string, productIds?: string[]) {
    const where: any = { companyId, isActive: true };
    if (productIds && productIds.length > 0) {
      where.id = { in: productIds };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        variants: { where: { isActive: true } }
      }
    });

    const labels: Array<{
      productId: string;
      productName: string;
      articleCode: string;
      brand: string;
      size: string;
      color: string;
      sku: string;
      barcode: string;
      price: number;
      currency: string;
    }> = [];

    for (const p of products) {
      const brandName = p.brand?.name || "Dreams Apparel";
      const baseArticle = p.articleCode || p.sku;

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          labels.push({
            productId: p.id,
            productName: p.name,
            articleCode: baseArticle,
            brand: brandName,
            size: v.size,
            color: v.color,
            sku: v.sku,
            barcode: v.barcode || v.sku,
            price: Number(p.sellingPrice) + Number(v.priceDiff),
            currency: "USD"
          });
        }
      } else {
        labels.push({
          productId: p.id,
          productName: p.name,
          articleCode: baseArticle,
          brand: brandName,
          size: "Standard",
          color: "Standard",
          sku: p.sku,
          barcode: p.barcode || p.sku,
          price: Number(p.sellingPrice),
          currency: "USD"
        });
      }
    }

    return labels;
  }

  async exportProducts(companyId: string) {
    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      include: {
        category: true,
        brand: true,
        unit: true,
        variants: { where: { isActive: true } },
        stockBalances: true
      }
    });

    return products.map(p => ({
      name: p.name,
      articleCode: p.articleCode || "",
      sku: p.sku,
      barcode: p.barcode || "",
      category: p.category.name,
      brand: p.brand?.name || "Dreams Apparel",
      season: p.season || "",
      fabric: p.fabric || "",
      gender: p.gender || "",
      unit: p.unit.shortName,
      costPrice: Number(p.costPrice),
      sellingPrice: Number(p.sellingPrice),
      taxRate: Number(p.taxRate),
      taxType: p.taxType,
      alertQuantity: p.alertQuantity,
      variantsCount: p.variants.length,
      totalStock: p.variants.reduce((acc, v) => acc + Number(v.stockQty), 0)
    }));
  }

  async importProducts(companyId: string, items: any[]) {
    let imported = 0;
    for (const item of items) {
      // Find or default category and unit
      let category = await prisma.category.findFirst({ where: { name: item.category || "Apparel" } });
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: item.category || "Apparel",
            code: `CAT-${Date.now().toString().slice(-4)}`,
            slug: (item.category || "Apparel").toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString().slice(-4)
          }
        });
      }

      let unit = await prisma.unit.findFirst({ where: { shortName: item.unit || "Pc" } });
      if (!unit) {
        unit = await prisma.unit.create({
          data: {
            name: item.unit || "Piece",
            shortName: item.unit || "Pc"
          }
        });
      }

      const sku = item.sku || `ART-${Date.now().toString().slice(-6)}`;
      const product = await prisma.product.create({
        data: {
          companyId,
          name: item.name,
          sku,
          articleCode: item.articleCode || sku,
          season: item.season || "SS26",
          fabric: item.fabric || "Cotton",
          gender: item.gender || "UNISEX",
          barcode: item.barcode || sku,
          categoryId: category.id,
          unitId: unit.id,
          costPrice: Number(item.costPrice || 0),
          sellingPrice: Number(item.sellingPrice || 0),
          taxRate: Number(item.taxRate || 0),
          alertQuantity: Number(item.alertQuantity || 10)
        }
      });

      imported++;
    }

    return { imported };
  }
}

export const productService = new ProductService();
