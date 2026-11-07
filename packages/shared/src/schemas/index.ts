import { z } from "zod";
import { PaymentMethod, SalesChannel, TaxType } from "../enums";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ProductCreateSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  sku: z.string().min(2, "SKU is required"),
  barcode: z.string().optional(),
  categoryId: z.string().uuid("Invalid category ID"),
  brandId: z.string().uuid("Invalid brand ID").optional().nullable(),
  unitId: z.string().uuid("Invalid unit ID"),
  costPrice: z.number().nonnegative("Cost price must be non-negative"),
  sellingPrice: z.number().nonnegative("Selling price must be non-negative"),
  taxRate: z.number().min(0).max(100).default(0),
  taxType: z.nativeEnum(TaxType).default(TaxType.EXCLUSIVE),
  alertQuantity: z.number().int().nonnegative().default(10),
  description: z.string().optional(),
  image: z.string().optional()
});

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;

export const PosCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0)
});

export const PosPaymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive(),
  referenceNumber: z.string().optional()
});

export const PosCheckoutSchema = z.object({
  storeId: z.string().uuid(),
  customerId: z.string().uuid().optional().nullable(),
  channel: z.nativeEnum(SalesChannel).default(SalesChannel.POS),
  items: z.array(PosCartItemSchema).min(1, "Cart cannot be empty"),
  orderDiscount: z.number().nonnegative().default(0),
  shippingFee: z.number().nonnegative().default(0),
  payments: z.array(PosPaymentSchema).min(1, "At least one payment tender is required"),
  notes: z.string().optional()
});

export type PosCheckoutInput = z.infer<typeof PosCheckoutSchema>;
