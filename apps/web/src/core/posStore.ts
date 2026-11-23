import { create } from "zustand";

export interface CartItem {
  cartKey: string;
  productId: string;
  variantId?: string | null;
  name: string;
  size?: string | null;
  color?: string | null;
  sku: string;
  price: number;
  quantity: number;
  discount: number;
  taxRate: number;
  taxType?: "EXCLUSIVE" | "INCLUSIVE";
  /** Total tax amount for this line (already accounting for quantity & line discount, rounded to 2 decimals) */
  taxAmount: number;
  image?: string | null;
  stockQty?: number;
}

export interface CustomerInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface HeldOrder {
  id: string;
  heldAt: string;
  customer?: CustomerInfo | null;
  items: CartItem[];
  orderDiscount: number;
  shippingFee: number;
  referenceName: string;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Exact line-level tax calculation:
 * - If taxRate <= 0, tax is strictly 0.
 * - Exclusive: round2((netLine * taxRate) / 100)
 * - Inclusive: round2(netLine - netLine / (1 + taxRate / 100))
 */
export function computeLineTax(
  price: number,
  quantity: number,
  discount: number,
  taxRate: number,
  taxType: "EXCLUSIVE" | "INCLUSIVE" = "EXCLUSIVE"
): number {
  const rate = Number(taxRate || 0);
  if (!Number.isFinite(rate) || rate <= 0) return 0;

  const netLine = Math.max(0, round2(Number(price || 0) * Number(quantity || 0) - Number(discount || 0)));
  if (netLine <= 0) return 0;

  if (taxType === "INCLUSIVE") {
    return round2(netLine - netLine / (1 + rate / 100));
  }
  return round2((netLine * rate) / 100);
}

interface PosState {
  cart: CartItem[];
  customer: CustomerInfo | null;
  orderDiscount: number;
  shippingFee: number;
  heldOrders: HeldOrder[];
  lastCompletedSale: any | null;

  // Actions
  addItem: (product: {
    id: string;
    variantId?: string | null;
    name: string;
    size?: string | null;
    color?: string | null;
    sku: string;
    sellingPrice: number;
    taxRate?: number;
    taxType?: "EXCLUSIVE" | "INCLUSIVE";
    image?: string | null;
    stockQty?: number;
  }) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  updateLineDiscount: (cartKey: string, discount: number) => void;
  updatePriceOverride: (cartKey: string, newPrice: number) => void;
  setOrderDiscount: (discount: number) => void;
  setShippingFee: (fee: number) => void;
  setCustomer: (customer: CustomerInfo | null) => void;
  setLastCompletedSale: (sale: any | null) => void;
  clearCart: () => void;

  // Held Orders
  holdCurrentOrder: (referenceName?: string) => void;
  recallOrder: (heldOrderId: string) => void;
  deleteHeldOrder: (heldOrderId: string) => void;

  // Computations
  getSubtotal: () => number;
  getTotalTax: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  customer: { id: "cust-walkin", name: "Walk-in Customer", phone: "" },
  orderDiscount: 0,
  shippingFee: 0,
  heldOrders: [],
  lastCompletedSale: null,

  addItem: (product) => {
    const { cart } = get();
    const cartKey = product.variantId ? `${product.id}_${product.variantId}` : product.id;
    const existing = cart.find((i) => i.cartKey === cartKey);

    if (existing) {
      const nextQty = existing.quantity + 1;
      const nextTax = computeLineTax(
        existing.price,
        nextQty,
        existing.discount,
        existing.taxRate,
        existing.taxType || "EXCLUSIVE"
      );
      set({
        cart: cart.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: nextQty, taxAmount: nextTax } : i
        ),
      });
    } else {
      const taxRate = Number(product.taxRate ?? 0);
      const taxType = product.taxType || "EXCLUSIVE";
      const taxAmount = computeLineTax(product.sellingPrice, 1, 0, taxRate, taxType);
      set({
        cart: [
          ...cart,
          {
            cartKey,
            productId: product.id,
            variantId: product.variantId || null,
            name: product.name,
            size: product.size || null,
            color: product.color || null,
            sku: product.sku,
            price: product.sellingPrice,
            quantity: 1,
            discount: 0,
            taxRate,
            taxType,
            taxAmount,
            image: product.image,
            stockQty: product.stockQty,
          },
        ],
      });
    }
  },

  removeItem: (cartKey) => {
    set({ cart: get().cart.filter((i) => i.cartKey !== cartKey) });
  },

  updateQuantity: (cartKey, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartKey);
      return;
    }
    set({
      cart: get().cart.map((i) =>
        i.cartKey === cartKey
          ? {
              ...i,
              quantity,
              taxAmount: computeLineTax(i.price, quantity, i.discount, i.taxRate, i.taxType || "EXCLUSIVE"),
            }
          : i
      ),
    });
  },

  updateLineDiscount: (cartKey, discount) => {
    const cleanDiscount = Math.max(0, discount);
    set({
      cart: get().cart.map((i) =>
        i.cartKey === cartKey
          ? {
              ...i,
              discount: cleanDiscount,
              taxAmount: computeLineTax(i.price, i.quantity, cleanDiscount, i.taxRate, i.taxType || "EXCLUSIVE"),
            }
          : i
      ),
    });
  },

  updatePriceOverride: (cartKey, newPrice) => {
    const cleanPrice = Math.max(0, newPrice);
    set({
      cart: get().cart.map((i) =>
        i.cartKey === cartKey
          ? {
              ...i,
              price: cleanPrice,
              taxAmount: computeLineTax(cleanPrice, i.quantity, i.discount, i.taxRate, i.taxType || "EXCLUSIVE"),
            }
          : i
      ),
    });
  },

  setOrderDiscount: (discount) => set({ orderDiscount: Math.max(0, discount) }),
  setShippingFee: (fee) => set({ shippingFee: Math.max(0, fee) }),
  setCustomer: (customer) => set({ customer }),
  setLastCompletedSale: (sale) => set({ lastCompletedSale: sale }),
  clearCart: () =>
    set({
      cart: [],
      orderDiscount: 0,
      shippingFee: 0,
      customer: { id: "cust-walkin", name: "Walk-in Customer", phone: "" },
    }),

  holdCurrentOrder: (referenceName = "Held Order") => {
    const { cart, customer, orderDiscount, shippingFee, heldOrders } = get();
    if (cart.length === 0) return;

    const newHeldOrder: HeldOrder = {
      id: `hold_${Date.now()}`,
      heldAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      customer,
      items: [...cart],
      orderDiscount,
      shippingFee,
      referenceName,
    };

    set({
      heldOrders: [...heldOrders, newHeldOrder],
      cart: [],
      orderDiscount: 0,
      shippingFee: 0,
      customer: { id: "cust-walkin", name: "Walk-in Customer", phone: "" },
    });
  },

  recallOrder: (heldOrderId) => {
    const { heldOrders } = get();
    const order = heldOrders.find((h) => h.id === heldOrderId);
    if (!order) return;

    set({
      cart: order.items,
      customer: order.customer || { id: "cust-walkin", name: "Walk-in Customer", phone: "" },
      orderDiscount: order.orderDiscount,
      shippingFee: order.shippingFee,
      heldOrders: heldOrders.filter((h) => h.id !== heldOrderId),
    });
  },

  deleteHeldOrder: (heldOrderId) => {
    set({ heldOrders: get().heldOrders.filter((h) => h.id !== heldOrderId) });
  },

  getSubtotal: () => {
    return round2(
      get().cart.reduce((sum, item) => sum + (item.price * item.quantity - item.discount), 0)
    );
  },

  getTotalTax: () => {
    return round2(get().cart.reduce((sum, item) => sum + Number(item.taxAmount || 0), 0));
  },

  getGrandTotal: () => {
    const sub = get().getSubtotal();
    const exclusiveTax = round2(
      get().cart.reduce(
        (sum, item) => sum + (item.taxType === "INCLUSIVE" ? 0 : Number(item.taxAmount || 0)),
        0
      )
    );
    const discount = get().orderDiscount;
    const shipping = get().shippingFee;
    return Math.max(0, round2(sub - discount + exclusiveTax + shipping));
  },

  getItemCount: () => {
    return get().cart.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
