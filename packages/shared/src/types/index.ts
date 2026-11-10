import { UserRole, SaleStatus, PaymentStatus, SalesChannel } from "../enums";

export interface UserDTO {
  id: string;
  companyId: string;
  storeId?: string | null;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  accessToken: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  categoryId: string;
  categoryName?: string;
  brandId?: string | null;
  brandName?: string;
  unitId: string;
  unitName?: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  taxType: string;
  alertQuantity: number;
  stockQuantity: number;
  image?: string | null;
  isActive: boolean;
}

export interface SaleSummaryDTO {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  channel: SalesChannel;
  createdAt: string;
}
