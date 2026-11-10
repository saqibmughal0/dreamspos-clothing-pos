import { z } from "zod";
import { PaymentMethod, SalesChannel, TaxType } from "../enums";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ProductVariantInputSchema = z.object({
  id: z.string().optional(),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  sku: z.string().min(1, "Variant SKU is required"),
  barcode: z.string().optional(),
  costPrice: z.number().nonnegative().default(0),
  priceDiff: z.number().default(0),
  stockQty: z.number().nonnegative().default(0),
  image: z.string().optional()
});

export const ProductCreateSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  sku: z.string().min(2, "SKU is required"),
  articleCode: z.string().optional(),
  season: z.string().optional(),
  fabric: z.string().optional(),
  gender: z.string().optional(),
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
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  variants: z.array(ProductVariantInputSchema).optional()
});

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;

export const PosCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  size: z.string().optional(),
  color: z.string().optional(),
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

// Phase 5 Schemas

export const StockAdjustmentItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  type: z.enum(["ADD", "SUBTRACT"]).default("ADD"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitCost: z.number().nonnegative().default(0)
});

export const StockAdjustmentCreateSchema = z.object({
  warehouseId: z.string().uuid(),
  type: z.enum(["ADDITION", "SUBTRACTION", "PHYSICAL_COUNT", "DAMAGED"]).default("PHYSICAL_COUNT"),
  referenceNo: z.string().optional(),
  reason: z.string().optional(),
  items: z.array(StockAdjustmentItemSchema).min(1, "At least one item required for adjustment")
});

export type StockAdjustmentCreateInput = z.infer<typeof StockAdjustmentCreateSchema>;

export const StockTransferItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitCost: z.number().nonnegative().default(0)
});

export const StockTransferCreateSchema = z.object({
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  shippingCharge: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  items: z.array(StockTransferItemSchema).min(1, "At least one item required for transfer")
});

export type StockTransferCreateInput = z.infer<typeof StockTransferCreateSchema>;

export const PurchaseItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitCost: z.number().nonnegative("Unit cost must be non-negative"),
  taxAmount: z.number().nonnegative().default(0)
});

export const PurchaseCreateSchema = z.object({
  warehouseId: z.string().uuid(),
  supplierId: z.string().uuid(),
  notes: z.string().optional(),
  items: z.array(PurchaseItemSchema).min(1, "At least one item required for purchase")
});

export type PurchaseCreateInput = z.infer<typeof PurchaseCreateSchema>;

export const PurchaseReceiveSchema = z.object({
  items: z.array(
    z.object({
      purchaseItemId: z.string().uuid(),
      receivedQty: z.number().positive("Received quantity must be positive")
    })
  ).min(1, "At least one receive line required")
});

export type PurchaseReceiveInput = z.infer<typeof PurchaseReceiveSchema>;

export const PurchaseReturnItemSchema = z.object({
  purchaseItemId: z.string().uuid().optional().nullable(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  quantity: z.number().positive("Return quantity must be positive"),
  unitCost: z.number().nonnegative()
});

export const PurchaseReturnCreateSchema = z.object({
  warehouseId: z.string().uuid(),
  supplierId: z.string().uuid(),
  purchaseId: z.string().uuid().optional().nullable(),
  reason: z.string().optional(),
  items: z.array(PurchaseReturnItemSchema).min(1, "At least one item required to return")
});

export type PurchaseReturnCreateInput = z.infer<typeof PurchaseReturnCreateSchema>;

export const SupplierPaymentCreateSchema = z.object({
  supplierId: z.string().uuid(),
  purchaseId: z.string().uuid().optional().nullable(),
  amount: z.number().positive("Payment amount must be positive"),
  paymentMethod: z.string().default("BANK_TRANSFER"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional()
});

export type SupplierPaymentCreateInput = z.infer<typeof SupplierPaymentCreateSchema>;

export const ExpenseCategoryCreateSchema = z.object({
  name: z.string().min(2, "Category name is required"),
  code: z.string().min(2, "Category code is required"),
  description: z.string().optional()
});

export type ExpenseCategoryCreateInput = z.infer<typeof ExpenseCategoryCreateSchema>;

export const ExpenseCreateSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive("Expense amount must be positive"),
  taxAmount: z.number().nonnegative().default(0),
  paymentMethod: z.string().default("CASH"),
  referenceNumber: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional()
});

export type ExpenseCreateInput = z.infer<typeof ExpenseCreateSchema>;

export const JournalLineSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(["DEBIT", "CREDIT"]),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional()
});

export const JournalEntryCreateSchema = z.object({
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  lines: z.array(JournalLineSchema).min(2, "Journal entry requires at least 2 lines (debit & credit)")
});

export type JournalEntryCreateInput = z.infer<typeof JournalEntryCreateSchema>;
