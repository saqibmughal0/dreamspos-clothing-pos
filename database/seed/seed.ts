import bcrypt from "bcrypt";
import { prisma } from "../src";

async function main() {
  console.log("Seeding DreamsPOS database...");

  // 1. Create or ensure Company
  let company = await prisma.company.findUnique({ where: { code: "DREAMS-01" } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Dreams Technologies Retail",
        code: "DREAMS-01",
        email: "contact@dreamspos.com",
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
        name: "Main Flagship Store",
        code: "STORE-01",
        address: "123 Retail Boulevard, Commerce City",
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
        name: "Central Logistics Warehouse",
        code: "WH-01",
        address: "789 Logistics Park, Hub City"
      }
    });
    console.log("Created Warehouse:", warehouse.name);
  }

  // 4. Create Roles
  const roles = [
    { name: "SUPER_ADMIN", description: "Super Administrator with global access" },
    { name: "STORE_MANAGER", description: "Store inventory, purchases, and reporting manager" },
    { name: "CASHIER", description: "Front-line POS billing and customer checkout cashier" }
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
      name: "DreamsPOS Administrator",
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
      name: "Front Desk Cashier",
      email: "cashier@dreamspos.com",
      passwordHash: cashierHash
    }
  });

  console.log("Created Users: admin@dreamspos.com, cashier@dreamspos.com");

  // 6. Categories & Units & Brands
  const catElectronics = await prisma.category.upsert({
    where: { code: "CAT-ELEC" },
    update: {},
    create: { name: "Electronics", code: "CAT-ELEC", slug: "electronics" }
  });

  const catComputers = await prisma.category.upsert({
    where: { code: "CAT-COMP" },
    update: {},
    create: { name: "Computers", code: "CAT-COMP", slug: "computers" }
  });

  const catGrocery = await prisma.category.upsert({
    where: { code: "CAT-GROC" },
    update: {},
    create: { name: "Grocery", code: "CAT-GROC", slug: "grocery" }
  });

  const unitPcs = await prisma.unit.upsert({
    where: { name: "Pieces" },
    update: {},
    create: { name: "Pieces", shortName: "pcs", allowDecimal: false }
  });

  const brandLenovo = await prisma.brand.upsert({
    where: { name: "Lenovo" },
    update: {},
    create: { name: "Lenovo", description: "Lenovo Computing" }
  });

  const brandApple = await prisma.brand.upsert({
    where: { name: "Apple" },
    update: {},
    create: { name: "Apple", description: "Apple Consumer Electronics" }
  });

  // 7. Seed Products with Stock
  const demoProducts = [
    {
      name: "Lenovo 3rd Generation 15.6 Laptop",
      sku: "PT001",
      barcode: "123456789012",
      categoryId: catComputers.id,
      brandId: brandLenovo.id,
      unitId: unitPcs.id,
      costPrice: 450.00,
      sellingPrice: 650.00,
      stockQty: 50
    },
    {
      name: "Apple iPhone 15 Pro 128GB",
      sku: "PT002",
      barcode: "123456789013",
      categoryId: catElectronics.id,
      brandId: brandApple.id,
      unitId: unitPcs.id,
      costPrice: 850.00,
      sellingPrice: 1099.00,
      stockQty: 35
    },
    {
      name: "Logitech MX Master 3S Wireless Mouse",
      sku: "PT003",
      barcode: "123456789014",
      categoryId: catComputers.id,
      unitId: unitPcs.id,
      costPrice: 65.00,
      sellingPrice: 99.00,
      stockQty: 80
    },
    {
      name: "Nescafe Gold Blend Coffee 200g",
      sku: "PT004",
      barcode: "123456789015",
      categoryId: catGrocery.id,
      unitId: unitPcs.id,
      costPrice: 6.50,
      sellingPrice: 11.99,
      stockQty: 150
    }
  ];

  for (const p of demoProducts) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        companyId: company.id,
        categoryId: p.categoryId,
        brandId: p.brandId,
        unitId: p.unitId,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        taxRate: 10,
        taxType: "EXCLUSIVE",
        alertQuantity: 10
      }
    });

    // Upsert stock balance
    await prisma.stockBalance.upsert({
      where: {
        productId_warehouseId: {
          productId: prod.id,
          warehouseId: warehouse.id
        }
      },
      update: {},
      create: {
        productId: prod.id,
        warehouseId: warehouse.id,
        quantity: p.stockQty
      }
    });
  }

  // 8. Customers & Suppliers
  await prisma.customer.upsert({
    where: { id: "cust-walkin" },
    update: {},
    create: {
      id: "cust-walkin",
      companyId: company.id,
      name: "Walk-in Customer",
      email: "walkin@example.com",
      phone: "000-000-0000"
    }
  });

  await prisma.customer.upsert({
    where: { id: "cust-johndoe" },
    update: {},
    create: {
      id: "cust-johndoe",
      companyId: company.id,
      name: "John Doe",
      email: "johndoe@example.com",
      phone: "+1 555 123 4567",
      address: "456 Elm Street"
    }
  });

  await prisma.supplier.upsert({
    where: { id: "supp-apex" },
    update: {},
    create: {
      id: "supp-apex",
      companyId: company.id,
      name: "Apex Electronics Wholesalers",
      email: "sales@apexwholesalers.com",
      phone: "+1 800 555 4321"
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
