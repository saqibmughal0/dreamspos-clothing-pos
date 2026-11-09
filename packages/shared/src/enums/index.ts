export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  STORE_MANAGER = "STORE_MANAGER",
  CASHIER = "CASHIER",
  WAREHOUSE_STAFF = "WAREHOUSE_STAFF",
  INVENTORY_CLERK = "INVENTORY_CLERK"
}

export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
  GIFT_CARD = "GIFT_CARD",
  POINTS = "POINTS",
  SPLIT = "SPLIT"
}

export enum SaleStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  CANCELLED = "CANCELLED"
}

export enum PaymentStatus {
  PAID = "PAID",
  PARTIAL = "PARTIAL",
  DUE = "DUE"
}

export enum SalesChannel {
  POS = "POS",
  ONLINE = "ONLINE",
  MANUAL = "MANUAL"
}

export enum StockMovementType {
  PURCHASE = "PURCHASE",
  SALE = "SALE",
  SALE_RETURN = "SALE_RETURN",
  PURCHASE_RETURN = "PURCHASE_RETURN",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
  ADJUSTMENT_ADD = "ADJUSTMENT_ADD",
  ADJUSTMENT_SUB = "ADJUSTMENT_SUB"
}

export enum TaxType {
  EXCLUSIVE = "EXCLUSIVE",
  INCLUSIVE = "INCLUSIVE"
}

export const RolePermissions: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: ["*"],
  [UserRole.ADMIN]: ["*"],
  [UserRole.STORE_MANAGER]: [
    "pos.access",
    "pos.checkout",
    "pos.returns",
    "pos.exchange",
    "products.view",
    "products.edit",
    "inventory.view",
    "inventory.adjust",
    "customers.manage",
    "reports.store",
    "cash_register.manage"
  ],
  [UserRole.CASHIER]: [
    "pos.access",
    "pos.checkout",
    "pos.barcode_scan",
    "pos.returns",
    "pos.receipt",
    "customers.view",
    "cash_register.own_session"
  ],
  [UserRole.WAREHOUSE_STAFF]: [
    "products.view",
    "products.create",
    "products.variants",
    "inventory.view",
    "inventory.adjust",
    "inventory.transfer",
    "purchases.receive",
    "purchases.returns"
  ],
  [UserRole.INVENTORY_CLERK]: [
    "products.view",
    "products.create",
    "products.variants",
    "inventory.view",
    "inventory.adjust",
    "inventory.transfer",
    "purchases.receive",
    "purchases.returns"
  ]
};

export const hasPermission = (role: UserRole, permission: string): boolean => {
  const permissions = RolePermissions[role] || [];
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
};
