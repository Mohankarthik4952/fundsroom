import cors from "cors";
import express from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { prisma } from "./lib/prisma.js";
import { signToken } from "./lib/auth.js";
import { authenticate, authorize } from "./middleware/auth.js";
import { createChallanNumber } from "./utils.js";

const app = express();
const allowedOrigins = [
  ...config.clientUrl,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/$/, "");
      const isAllowed =
        allowedOrigins.some(
          (allowed) => allowed.replace(/\/$/, "") === normalizedOrigin,
        ) ||
        (process.env.NODE_ENV === "production" && /^https?:\/\//.test(origin));

      if (isAllowed) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/auth/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid login payload",
      errors: parsed.error.flatten(),
    });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

app.get(
  "/customers",
  authenticate,
  authorize("ADMIN", "SALES", "ACCOUNTS"),
  async (req, res) => {
    const { q = "", status, type } = req.query;
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);

    const where: any = {
      OR: [
        { name: { contains: String(q) } },
        { businessName: { contains: String(q) } },
        { mobile: { contains: String(q) } },
        { email: { contains: String(q) } },
      ],
    };

    if (status) where.status = status;
    if (type) where.customerType = type;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { followUps: { orderBy: { createdAt: "desc" }, take: 3 } },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({ data: customers, total, page, pageSize });
  },
);

app.post(
  "/customers",
  authenticate,
  authorize("ADMIN", "SALES"),
  async (req, res) => {
    const schema = z.object({
      name: z.string().min(2),
      mobile: z.string().min(8),
      email: z.string().email().optional().or(z.literal("")),
      businessName: z.string().optional().or(z.literal("")),
      gstNumber: z.string().optional().or(z.literal("")),
      customerType: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]),
      address: z.string().optional().or(z.literal("")),
      status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]),
      followUpDate: z.string().optional().nullable(),
      notes: z.string().optional().or(z.literal("")),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid customer payload",
        errors: parsed.error.flatten(),
      });
    }

    const payload = parsed.data;
    const customer = await prisma.customer.create({
      data: {
        ...payload,
        email: payload.email || null,
        businessName: payload.businessName || null,
        gstNumber: payload.gstNumber || null,
        address: payload.address || null,
        notes: payload.notes || null,
        followUpDate: payload.followUpDate
          ? new Date(payload.followUpDate)
          : null,
      },
    });

    res.status(201).json(customer);
  },
);

app.get(
  "/customers/:id",
  authenticate,
  authorize("ADMIN", "SALES", "ACCOUNTS", "WAREHOUSE"),
  async (req, res) => {
    const customerId = String(req.params.id);
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        followUps: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: { select: { name: true, email: true, role: true } },
          },
        },
        challans: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  },
);

app.put(
  "/customers/:id",
  authenticate,
  authorize("ADMIN", "SALES"),
  async (req, res) => {
    const customerId = String(req.params.id);
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const schema = z.object({
      name: z.string().min(2).optional(),
      mobile: z.string().min(8).optional(),
      email: z.string().email().optional().or(z.literal("")).nullable(),
      businessName: z.string().optional().or(z.literal("")).nullable(),
      gstNumber: z.string().optional().or(z.literal("")).nullable(),
      customerType: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]).optional(),
      address: z.string().optional().or(z.literal("")).nullable(),
      status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).optional(),
      followUpDate: z.string().optional().nullable(),
      notes: z.string().optional().or(z.literal("")).nullable(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid customer update payload",
        errors: parsed.error.flatten(),
      });
    }

    const updateData = parsed.data;
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...updateData,
        email:
          updateData.email === undefined ? undefined : updateData.email || null,
        businessName:
          updateData.businessName === undefined
            ? undefined
            : updateData.businessName || null,
        gstNumber:
          updateData.gstNumber === undefined
            ? undefined
            : updateData.gstNumber || null,
        address:
          updateData.address === undefined
            ? undefined
            : updateData.address || null,
        notes:
          updateData.notes === undefined ? undefined : updateData.notes || null,
        followUpDate:
          updateData.followUpDate === undefined
            ? undefined
            : updateData.followUpDate
              ? new Date(updateData.followUpDate)
              : null,
      },
    });

    res.json(updated);
  },
);

app.post(
  "/customers/:id/follow-ups",
  authenticate,
  authorize("ADMIN", "SALES", "ACCOUNTS"),
  async (req, res) => {
    const customerId = String(req.params.id);
    const schema = z.object({ note: z.string().min(3) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Follow-up note required",
        errors: parsed.error.flatten(),
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId,
        createdById: req.user!.id,
        note: parsed.data.note,
      },
      include: { createdBy: { select: { name: true, role: true } } },
    });

    res.status(201).json(followUp);
  },
);

app.get(
  "/products",
  authenticate,
  authorize("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
  async (req, res) => {
    const q = String(req.query.q ?? "");
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);

    const where: any = q
      ? {
          OR: [
            { name: { contains: q } },
            { sku: { contains: q } },
            { category: { contains: q } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ data: products, total, page, pageSize });
  },
);

app.post(
  "/products",
  authenticate,
  authorize("ADMIN", "WAREHOUSE"),
  async (req, res) => {
    const schema = z.object({
      name: z.string().min(2),
      sku: z.string().min(2),
      category: z.string().min(2),
      unitPrice: z.number().min(0),
      currentStock: z.number().int().min(0),
      minStockAlert: z.number().int().min(0),
      location: z.string().min(1),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid product payload",
        errors: parsed.error.flatten(),
      });
    }

    const exists = await prisma.product.findUnique({
      where: { sku: parsed.data.sku },
    });
    if (exists) {
      return res.status(409).json({ message: "SKU already exists" });
    }

    const product = await prisma.product.create({ data: parsed.data });
    res.status(201).json(product);
  },
);

app.put(
  "/products/:id",
  authenticate,
  authorize("ADMIN", "WAREHOUSE"),
  async (req, res) => {
    const schema = z.object({
      name: z.string().min(2).optional(),
      sku: z.string().min(2).optional(),
      category: z.string().min(2).optional(),
      unitPrice: z.number().min(0).optional(),
      currentStock: z.number().int().min(0).optional(),
      minStockAlert: z.number().int().min(0).optional(),
      location: z.string().min(1).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid update payload",
        errors: parsed.error.flatten(),
      });
    }

    const productId = String(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: parsed.data,
    });

    res.json(updated);
  },
);

app.get(
  "/stock-movements",
  authenticate,
  authorize("ADMIN", "WAREHOUSE", "ACCOUNTS"),
  async (_req, res) => {
    const movements = await prisma.stockMovement.findMany({
      orderBy: { timestamp: "desc" },
      include: {
        product: true,
        createdBy: { select: { name: true, role: true } },
      },
    });
    res.json(movements);
  },
);

app.get(
  "/challans",
  authenticate,
  authorize("ADMIN", "SALES", "ACCOUNTS", "WAREHOUSE"),
  async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);
    const status = String(req.query.status ?? "");

    const where: any = status ? { status } : {};
    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          customer: true,
          createdBy: { select: { name: true, role: true } },
          items: true,
        },
      }),
      prisma.challan.count({ where }),
    ]);

    res.json({ data: challans, total, page, pageSize });
  },
);

app.post(
  "/challans",
  authenticate,
  authorize("ADMIN", "SALES"),
  async (req, res) => {
    const schema = z.object({
      customerId: z.string().min(1),
      status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]),
      items: z
        .array(
          z.object({
            productId: z.string().min(1),
            quantity: z.number().int().positive(),
          }),
        )
        .min(1),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid challan payload",
        errors: parsed.error.flatten(),
      });
    }

    const { customerId, status, items } = parsed.data;
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    let productEntries: Array<{ product: any; item: (typeof items)[number] }>;

    try {
      productEntries = await Promise.all(
        items.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });
          if (!product)
            throw new Error(`Product with id ${item.productId} not found`);
          if (status === "CONFIRMED" && product.currentStock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
          return { product, item };
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create challan";
      if (message.includes("Insufficient stock")) {
        return res.status(400).json({ message });
      }
      return res.status(400).json({ message });
    }

    try {
      const challan = await prisma.$transaction(async (tx) => {
        const totalQuantity = items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        const totalAmount = productEntries.reduce((sum, entry) => {
          return sum + entry.product.unitPrice * entry.item.quantity;
        }, 0);

        const newChallan = await tx.challan.create({
          data: {
            challanNumber: createChallanNumber(),
            customerId,
            totalQuantity,
            totalAmount,
            status,
            createdById: req.user!.id,
            items: {
              create: productEntries.map(({ product, item }) => ({
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                quantity: item.quantity,
                unitPrice: product.unitPrice,
                lineTotal: product.unitPrice * item.quantity,
              })),
            },
          },
          include: { items: true },
        });

        if (status === "CONFIRMED") {
          for (const { product, item } of productEntries) {
            const updatedStock = product.currentStock - item.quantity;
            await tx.product.update({
              where: { id: product.id },
              data: { currentStock: updatedStock },
            });
            await tx.stockMovement.create({
              data: {
                productId: product.id,
                quantityChanged: item.quantity,
                movementType: "OUT",
                reason: `Sales challan ${newChallan.challanNumber}`,
                createdById: req.user!.id,
              },
            });
          }
        }

        return newChallan;
      });

      res.status(201).json(challan);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create challan";
      if (message.includes("Insufficient stock")) {
        return res.status(400).json({ message });
      }
      return res.status(400).json({ message });
    }
  },
);

app.get("/dashboard/summary", authenticate, async (_req, res) => {
  const [customerCount, productCount, pendingChallans, totalRevenue] =
    await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.challan.count({ where: { status: "DRAFT" } }),
      prisma.challan.aggregate({ _sum: { totalAmount: true } }),
    ]);

  res.json({
    customerCount,
    productCount,
    pendingChallans,
    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
  });
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ message });
  },
);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
