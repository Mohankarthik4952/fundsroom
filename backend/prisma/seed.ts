import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const salesPassword = await bcrypt.hash("sales123", 10);
  const warehousePassword = await bcrypt.hash("warehouse123", 10);
  const accountsPassword = await bcrypt.hash("accounts123", 10);

  await prisma.user.upsert({
    where: { email: "admin@mini.erp" },
    update: {},
    create: {
      email: "admin@mini.erp",
      name: "System Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "sales@mini.erp" },
    update: {},
    create: {
      email: "sales@mini.erp",
      name: "Sales Executive",
      passwordHash: salesPassword,
      role: "SALES",
    },
  });

  await prisma.user.upsert({
    where: { email: "warehouse@mini.erp" },
    update: {},
    create: {
      email: "warehouse@mini.erp",
      name: "Warehouse Manager",
      passwordHash: warehousePassword,
      role: "WAREHOUSE",
    },
  });

  await prisma.user.upsert({
    where: { email: "accounts@mini.erp" },
    update: {},
    create: {
      email: "accounts@mini.erp",
      name: "Accounts Manager",
      passwordHash: accountsPassword,
      role: "ACCOUNTS",
    },
  });

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: "Premium Steel Rod",
          sku: "STEEL-101",
          category: "Industrial",
          unitPrice: 1700,
          currentStock: 55,
          minStockAlert: 15,
          location: "A1-02",
        },
        {
          name: "PVC Pipe 2 Inch",
          sku: "PVC-204",
          category: "Plumbing",
          unitPrice: 640,
          currentStock: 120,
          minStockAlert: 30,
          location: "B2-05",
        },
      ],
    });
  }

  const customerCount = await prisma.customer.count();
  if (customerCount === 0) {
    await prisma.customer.createMany({
      data: [
        {
          name: "Amit Sharma",
          mobile: "9876543210",
          email: "amit@example.com",
          businessName: "Sharma Traders",
          gstNumber: "27ABCDE1234F1Z5",
          customerType: "WHOLESALE",
          address: "Bandra West, Mumbai",
          status: "ACTIVE",
          followUpDate: new Date(),
          notes: "Prefers same-day deliveries for bulk orders.",
        },
        {
          name: "Meera Patel",
          mobile: "9988776655",
          email: "meera@example.com",
          businessName: "Patel Hardware",
          gstNumber: "24LMNOP5678Q2Z1",
          customerType: "RETAIL",
          address: "Navrangpura, Ahmedabad",
          status: "LEAD",
          followUpDate: new Date(Date.now() + 86400000),
          notes: "Interested in plumbing supplies.",
        },
      ],
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
