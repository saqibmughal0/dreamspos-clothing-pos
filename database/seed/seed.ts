import bcrypt from "bcrypt";
import { prisma } from "../src";

async function main() {
  console.log("Seeding DreamsPOS Clothing Retail database...");

  // 1. Create or ensure Company (Single-Brand Clothing Retail)
  let company = await prisma.company.findUnique({ where: { code: "DREAMS-01" } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Dreams Apparel Retail",
        code: "DREAMS-01",
        email: "store@dreamsapparel.com",
        phone: "+1 800 555 0199",
        currency: "USD"
      }
    });
    console.log("Created Company:", company.name);
  }

  // 2. Create Store
  let store = await prisma.store.findFirst({ where: { companyId: company.id } });
  if (!store) {
    store = await prisma.store.create({
      data: {
        companyId: company.id,
        name: "Flagship Retail Store",
        code: "STORE-01",
        address: "100 Fashion Avenue, Suite 10",
        phone: "+1 800 555 0101"
      }
    });
    console.log("Created Store:", store.name);
  }

  // 3. Create Warehouse
  let warehouse = await prisma.warehouse.findFirst({ where: { companyId: company.id } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        companyId: company.id,
        name: "Main Stockroom / Warehouse",
        code: "WH-01",
        address: "200 Logistics Drive"
      }
    });
    console.log("Created Warehouse:", warehouse.name);
  }

  // 4. Create Roles
  const roles = [
    { name: "SUPER_ADMIN", description: "Super Administrator" },
    { name: "STORE_MANAGER", description: "Store Manager" },
    { name: "CASHIER", description: "POS Cashier" }
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name, description: r.description, isSystem: true }
    });
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  const cashierRole = await prisma.role.findUnique({ where: { name: "CASHIER" } });

  // 5. Create Default Users
  const passwordHash = await bcrypt.hash("Admin@12345", 10);
  const cashierHash = await bcrypt.hash("Cashier@12345", 10);

  await prisma.user.upsert({
    where: { email: "admin@dreamspos.com" },
    update: {},
    create: {
      companyId: company.id,
      storeId: store.id,
      roleId: superAdminRole!.id,
      name: "Admin Manager",
      email: "admin@dreamspos.com",
      passwordHash: passwordHash
    }
  });

  await prisma.user.upsert({
    where: { email: "cashier@dreamspos.com" },
    update: {},
    create: {
      companyId: company.id,
      storeId: store.id,
      roleId: cashierRole!.id,
      name: "Floor Cashier",
      email: "cashier@dreamspos.com",
      passwordHash: cashierHash
    }
  });

  // 6. Cash Register
  await prisma.cashRegister.upsert({
    where: { id: "reg-01" },
    update: {},
    create: {
      id: "reg-01",
      storeId: store.id,
      name: "Checkout Register 01",
      terminalId: "TERM-01",
      isActive: true
    }
  });

  // 7. Clothing Categories
  const catTees = await prisma.category.upsert({
    where: { code: "CAT-TEES" },
    update: {},
    create: { name: "T-Shirts & Tops", code: "CAT-TEES", slug: "t-shirts", image: "assets/img/categories/category-01.svg" }
  });

  const catShirts = await prisma.category.upsert({
    where: { code: "CAT-SHIRTS" },
    update: {},
    create: { name: "Shirts", code: "CAT-SHIRTS", slug: "shirts", image: "assets/img/categories/category-02.svg" }
  });

  const catJeans = await prisma.category.upsert({
    where: { code: "CAT-JEANS" },
    update: {},
    create: { name: "Jeans & Trousers", code: "CAT-JEANS", slug: "jeans", image: "assets/img/categories/category-03.svg" }
  });

  const catHoodies = await prisma.category.upsert({
    where: { code: "CAT-HOODIES" },
    update: {},
    create: { name: "Hoodies & Jackets", code: "CAT-HOODIES", slug: "hoodies", image: "assets/img/categories/category-04.svg" }
  });

  const catShorts = await prisma.category.upsert({
    where: { code: "CAT-SHORTS" },
    update: {},
    create: { name: "Shorts", code: "CAT-SHORTS", slug: "shorts", image: "assets/img/categories/category-05.svg" }
  });

  const unitPcs = await prisma.unit.upsert({
    where: { name: "Pieces" },
    update: {},
    create: { name: "Pieces", shortName: "pcs", allowDecimal: false }
  });

  const brandOwn = await prisma.brand.upsert({
    where: { name: "Dreams Apparel" },
    update: {},
    create: { name: "Dreams Apparel", description: "In-House Clothing Brand" }
  });

  // 8. Clothing Products & Variants
  const apparelCatalog = [
    {
      name: "Classic Crewneck Cotton Tee",
      sku: "APP-TSH-01",
      barcode: "890123450010",
      categoryId: catTees.id,
      costPrice: 8.50,
      sellingPrice: 24.99,
      image: "assets/img/products/pos-product-01.png",
      variants: [
        { size: "S", color: "Jet Black", sku: "APP-TSH-BLK-S", barcode: "890123450101", stockQty: 25 },
        { size: "M", color: "Jet Black", sku: "APP-TSH-BLK-M", barcode: "890123450102", stockQty: 40 },
        { size: "L", color: "Jet Black", sku: "APP-TSH-BLK-L", barcode: "890123450103", stockQty: 30 },
        { size: "M", color: "Pure White", sku: "APP-TSH-WHT-M", barcode: "890123450104", stockQty: 35 },
        { size: "L", color: "Pure White", sku: "APP-TSH-WHT-L", barcode: "890123450105", stockQty: 20 },
        { size: "M", color: "Navy Blue", sku: "APP-TSH-NVY-M", barcode: "890123450106", stockQty: 30 }
      ]
    },
    {
      name: "Oxford Button-Down Long Sleeve Shirt",
      sku: "APP-SHT-01",
      barcode: "890123450020",
      categoryId: catShirts.id,
      costPrice: 18.00,
      sellingPrice: 49.99,
      image: "assets/img/products/pos-product-02.png",
      variants: [
        { size: "M", color: "Sky Blue", sku: "APP-SHT-BLU-M", barcode: "890123450201", stockQty: 20 },
        { size: "L", color: "Sky Blue", sku: "APP-SHT-BLU-L", barcode: "890123450202", stockQty: 18 },
        { size: "M", color: "Crisp White", sku: "APP-SHT-WHT-M", barcode: "890123450203", stockQty: 25 },
        { size: "L", color: "Crisp White", sku: "APP-SHT-WHT-L", barcode: "890123450204", stockQty: 15 }
      ]
    },
    {
      name: "Slim Fit Stretch Denim Jeans",
      sku: "APP-JNS-01",
      barcode: "890123450030",
      categoryId: catJeans.id,
      costPrice: 24.00,
      sellingPrice: 69.99,
      image: "assets/img/products/pos-product-03.png",
      variants: [
        { size: "30", color: "Dark Indigo", sku: "APP-JNS-IND-30", barcode: "890123450301", stockQty: 15 },
        { size: "32", color: "Dark Indigo", sku: "APP-JNS-IND-32", barcode: "890123450302", stockQty: 28 },
        { size: "34", color: "Dark Indigo", sku: "APP-JNS-IND-34", barcode: "890123450303", stockQty: 20 },
        { size: "32", color: "Washed Black", sku: "APP-JNS-BLK-32", barcode: "890123450304", stockQty: 22 },
        { size: "34", color: "Washed Black", sku: "APP-JNS-BLK-34", barcode: "890123450305", stockQty: 14 }
      ]
    },
    {
      name: "Heavyweight Fleece Pullover Hoodie",
      sku: "APP-HOD-01",
      barcode: "890123450040",
      categoryId: catHoodies.id,
      costPrice: 22.50,
      sellingPrice: 59.99,
      image: "assets/img/products/pos-product-04.png",
      variants: [
        { size: "S", color: "Heather Grey", sku: "APP-HOD-GRY-S", barcode: "890123450401", stockQty: 15 },
        { size: "M", color: "Heather Grey", sku: "APP-HOD-GRY-M", barcode: "890123450402", stockQty: 25 },
        { size: "L", color: "Heather Grey", sku: "APP-HOD-GRY-L", barcode: "890123450403", stockQty: 20 },
        { size: "M", color: "Onyx Black", sku: "APP-HOD-BLK-M", barcode: "890123450404", stockQty: 30 },
        { size: "L", color: "Onyx Black", sku: "APP-HOD-BLK-L", barcode: "890123450405", stockQty: 22 }
      ]
    },
    {
      name: "Casual Tailored Chino Shorts",
      sku: "APP-SHTS-01",
      barcode: "890123450050",
      categoryId: catShorts.id,
      costPrice: 12.00,
      sellingPrice: 34.99,
      image: "assets/img/products/pos-product-05.png",
      variants: [
        { size: "30", color: "Classic Khaki", sku: "APP-SHTS-KHA-30", barcode: "890123450501", stockQty: 12 },
        { size: "32", color: "Classic Khaki", sku: "APP-SHTS-KHA-32", barcode: "890123450502", stockQty: 24 },
        { size: "34", color: "Classic Khaki", sku: "APP-SHTS-KHA-34", barcode: "890123450503", stockQty: 18 },
        { size: "32", color: "Olive Green", sku: "APP-SHTS-OLV-32", barcode: "890123450504", stockQty: 16 }
      ]
    }
  ];

  for (const item of apparelCatalog) {
    const prod = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        image: item.image
      },
      create: {
        companyId: company.id,
        categoryId: item.categoryId,
        brandId: brandOwn.id,
        unitId: unitPcs.id,
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        taxRate: 8.5,
        taxType: "EXCLUSIVE",
        alertQuantity: 10,
        image: item.image
      }
    });

    let totalProdStock = 0;
    for (const v of item.variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          stockQty: v.stockQty,
          barcode: v.barcode
        },
        create: {
          productId: prod.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          barcode: v.barcode,
          priceDiff: 0,
          stockQty: v.stockQty
        }
      });
      totalProdStock += v.stockQty;
    }

    // Set warehouse stock balance
    await prisma.stockBalance.upsert({
      where: {
        productId_warehouseId: {
          productId: prod.id,
          warehouseId: warehouse.id
        }
      },
      update: { quantity: totalProdStock },
      create: {
        productId: prod.id,
        warehouseId: warehouse.id,
        quantity: totalProdStock
      }
    });
  }

  // 9. Customers
  await prisma.customer.upsert({
    where: { id: "cust-walkin" },
    update: {},
    create: {
      id: "cust-walkin",
      companyId: company.id,
      name: "Walk-in Customer",
      email: "walkin@clothingpos.com",
      phone: "000-000-0000"
    }
  });

  await prisma.customer.upsert({
    where: { id: "cust-emily" },
    update: {},
    create: {
      id: "cust-emily",
      companyId: company.id,
      name: "Emily Watson",
      email: "emily.watson@example.com",
      phone: "+1 555 789 1234",
      address: "24 Park Avenue, Cityville"
    }
  });

  console.log("Clothing retail database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
