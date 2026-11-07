import { create } from "zustand";

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  image?: string | null;
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

interface PosState {
  cart: CartItem[];
  customer: CustomerInfo | null;
  orderDiscount: number;
  shippingFee: number;
  heldOrders: HeldOrder[];

  // Actions
  addItem: (product: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    taxRate?: number;
    image?: string | null;
  }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateLineDiscount: (productId: string, discount: number) => void;
  updatePriceOverride: (productId: string, newPrice: number) => void;
  setOrderDiscount: (discount: number) => void;
  setShippingFee: (fee: number) => void;
  setCustomer: (customer: CustomerInfo | null) => void;
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
  customer: null,
  orderDiscount: 0,
  shippingFee: 0,
  heldOrders: [],

  addItem: (product) => {
    const { cart } = get();
    const existing = cart.find(i => i.productId === product.id);

    if (existing) {
      set({
        cart: cart.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      });
    } else {
      const taxRate = product.taxRate || 0;
      const taxAmount = (product.sellingPrice * taxRate) / 100;
      set({
        cart: [
          ...cart,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            price: product.sellingPrice,
            quantity: 1,
            discount: 0,
            taxRate,
            taxAmount,
            image: product.image
          }
        ]
      });
    }
  },

  removeItem: (productId) => {
    set({ cart: get().cart.filter(i => i.productId !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      cart: get().cart.map(i =>
        i.productId === productId ? { ...i, quantity } : i
      )
    });
  },

  updateLineDiscount: (productId, discount) => {
    set({
      cart: get().cart.map(i =>
        i.productId === productId ? { ...i, discount: Math.max(0, discount) } : i
      )
    });
  },

  updatePriceOverride: (productId, newPrice) => {
    set({
      cart: get().cart.map(i =>
        i.productId === productId ? { ...i, price: Math.max(0, newPrice) } : i
      )
    });
  },

  setOrderDiscount: (discount) => set({ orderDiscount: Math.max(0, discount) }),
  setShippingFee: (fee) => set({ shippingFee: Math.max(0, fee) }),
  setCustomer: (customer) => set({ customer }),
  clearCart: () => set({ cart: [], orderDiscount: 0, shippingFee: 0, customer: null }),

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
      referenceName
    };

    set({
      heldOrders: [...heldOrders, newHeldOrder],
      cart: [],
      orderDiscount: 0,
      shippingFee: 0,
      customer: null
    });
  },

  recallOrder: (heldOrderId) => {
    const { heldOrders } = get();
    const order = heldOrders.find(h => h.id === heldOrderId);
    if (!order) return;

    set({
      cart: order.items,
      customer: order.customer || null,
      orderDiscount: order.orderDiscount,
      shippingFee: order.shippingFee,
      heldOrders: heldOrders.filter(h => h.id !== heldOrderId)
    });
  },

  deleteHeldOrder: (heldOrderId) => {
    set({ heldOrders: get().heldOrders.filter(h => h.id !== heldOrderId) });
  },

  getSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + (item.price * item.quantity - item.discount), 0);
  },

  getTotalTax: () => {
    return get().cart.reduce((sum, item) => sum + (item.taxAmount * item.quantity), 0);
  },

  getGrandTotal: () => {
    const sub = get().getSubtotal();
    const tax = get().getTotalTax();
    const discount = get().orderDiscount;
    const shipping = get().shippingFee;
    return Math.max(0, sub - discount + tax + shipping);
  },

  getItemCount: () => {
    return get().cart.reduce((sum, item) => sum + item.quantity, 0);
  }
}));
