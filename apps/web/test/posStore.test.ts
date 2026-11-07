import { describe, it, expect, beforeEach } from "vitest";
import { usePosStore } from "../src/core/posStore";

describe("DreamsPOS Frontend POS Store & Clothing Variants", () => {
  beforeEach(() => {
    usePosStore.getState().clearCart();
  });

  it("should add a clothing product with variant (size and color) to cart", () => {
    const store = usePosStore.getState();

    store.addItem({
      id: "prod-tshirt-01",
      variantId: "var-tshirt-black-m",
      name: "Classic Crew Neck T-Shirt (Jet Black - M)",
      size: "M",
      color: "Jet Black",
      sku: "TSH-BLK-M",
      sellingPrice: 29.99,
      taxRate: 8.5,
      stockQty: 45
    });

    const state = usePosStore.getState();
    expect(state.cart.length).toBe(1);
    expect(state.cart[0].cartKey).toBe("prod-tshirt-01_var-tshirt-black-m");
    expect(state.cart[0].size).toBe("M");
    expect(state.cart[0].color).toBe("Jet Black");
    expect(state.cart[0].quantity).toBe(1);
    expect(state.cart[0].price).toBe(29.99);
  });

  it("should treat different clothing variants of the same product as distinct cart lines", () => {
    const store = usePosStore.getState();

    // Medium Black
    store.addItem({
      id: "prod-tshirt-01",
      variantId: "var-tshirt-black-m",
      name: "Classic Crew Neck T-Shirt (Jet Black - M)",
      size: "M",
      color: "Jet Black",
      sku: "TSH-BLK-M",
      sellingPrice: 29.99,
      taxRate: 8.5,
      stockQty: 45
    });

    // Large Navy
    store.addItem({
      id: "prod-tshirt-01",
      variantId: "var-tshirt-navy-l",
      name: "Classic Crew Neck T-Shirt (Navy Blue - L)",
      size: "L",
      color: "Navy Blue",
      sku: "TSH-NVY-L",
      sellingPrice: 29.99,
      taxRate: 8.5,
      stockQty: 30
    });

    const state = usePosStore.getState();
    expect(state.cart.length).toBe(2);
    expect(state.getItemCount()).toBe(2);
    expect(state.getSubtotal()).toBeCloseTo(59.98, 2);
  });

  it("should increment quantity when identical variant is added again", () => {
    const store = usePosStore.getState();

    store.addItem({
      id: "prod-jeans-01",
      variantId: "var-jeans-32-darkblue",
      name: "Slim Fit Denim Jeans (Dark Indigo - 32/32)",
      size: "32/32",
      color: "Dark Indigo",
      sku: "JNS-IND-32",
      sellingPrice: 79.50,
      taxRate: 8.5,
      stockQty: 20
    });

    store.addItem({
      id: "prod-jeans-01",
      variantId: "var-jeans-32-darkblue",
      name: "Slim Fit Denim Jeans (Dark Indigo - 32/32)",
      size: "32/32",
      color: "Dark Indigo",
      sku: "JNS-IND-32",
      sellingPrice: 79.50,
      taxRate: 8.5,
      stockQty: 20
    });

    const state = usePosStore.getState();
    expect(state.cart.length).toBe(1);
    expect(state.cart[0].quantity).toBe(2);
    expect(state.getSubtotal()).toBeCloseTo(159.00, 2);
  });

  it("should update quantity, price override, line discount, and correctly compute grand total", () => {
    const store = usePosStore.getState();

    store.addItem({
      id: "prod-hoodie-01",
      variantId: "var-hoodie-grey-l",
      name: "Heavyweight Fleece Hoodie (Heather Grey - L)",
      size: "L",
      color: "Heather Grey",
      sku: "HD-GRY-L",
      sellingPrice: 89.00,
      taxRate: 10, // 10%
      stockQty: 15
    });

    const key = "prod-hoodie-01_var-hoodie-grey-l";
    // Increase quantity to 3
    store.updateQuantity(key, 3);
    // Line discount of $10
    store.updateLineDiscount(key, 10);
    // Order discount of $15
    store.setOrderDiscount(15);
    // Shipping of $5
    store.setShippingFee(5);

    const state = usePosStore.getState();
    // Subtotal = (89 * 3) - 10 = 267 - 10 = 257
    expect(state.getSubtotal()).toBeCloseTo(257, 2);
    // Tax = (89 * 0.10) * 3 = 8.90 * 3 = 26.70
    expect(state.getTotalTax()).toBeCloseTo(26.70, 2);
    // Grand Total = 257 - 15 (order discount) + 26.70 (tax) + 5 (shipping) = 273.70
    expect(state.getGrandTotal()).toBeCloseTo(273.70, 2);
  });

  it("should hold an active order and recall it accurately", () => {
    const store = usePosStore.getState();

    store.addItem({
      id: "prod-shirt-01",
      variantId: "var-shirt-white-s",
      name: "Oxford Cotton Button-Down (Crisp White - S)",
      size: "S",
      color: "Crisp White",
      sku: "OXF-WHT-S",
      sellingPrice: 55.00,
      taxRate: 5,
      stockQty: 25
    });

    store.setCustomer({ id: "cust-101", name: "Sarah Connor", phone: "555-0199" });
    expect(usePosStore.getState().cart.length).toBe(1);

    // Hold current order
    store.holdCurrentOrder("Sarah - Order 1");
    expect(usePosStore.getState().cart.length).toBe(0);
    expect(usePosStore.getState().heldOrders.length).toBe(1);
    expect(usePosStore.getState().heldOrders[0].referenceName).toBe("Sarah - Order 1");

    // Add another customer's order
    store.addItem({
      id: "prod-cap-01",
      name: "Apparel Vintage Cap",
      sku: "CAP-01",
      sellingPrice: 20.00,
      taxRate: 5,
      stockQty: 50
    });
    expect(usePosStore.getState().cart.length).toBe(1);

    // Clear and recall first held order
    store.clearCart();
    const heldId = usePosStore.getState().heldOrders[0].id;
    store.recallOrder(heldId);

    const restoredState = usePosStore.getState();
    expect(restoredState.cart.length).toBe(1);
    expect(restoredState.cart[0].sku).toBe("OXF-WHT-S");
    expect(restoredState.customer?.name).toBe("Sarah Connor");
    expect(restoredState.heldOrders.length).toBe(0);
  });
});
