import { describe, it, expect } from "vitest";
import { PosCheckoutSchema, PaymentMethod, SalesChannel } from "@dreamspos/shared";
import { addMoney, subMoney, mulMoney, roundMoney } from "../src/utils/decimal";

describe("Point of Sale (POS) Business Logic Tests", () => {
  it("should validate valid POS checkout payload with Zod schema", () => {
    const payload = {
      storeId: "11111111-1111-4111-8111-111111111111",
      customerId: "22222222-2222-4222-8222-222222222222",
      channel: SalesChannel.POS,
      items: [
        {
          productId: "33333333-3333-4333-8333-333333333333",
          quantity: 2,
          unitPrice: 50.00,
          discountAmount: 0.00,
          taxAmount: 5.00
        }
      ],
      orderDiscount: 10.00,
      shippingFee: 0.00,
      payments: [
        {
          method: PaymentMethod.CASH,
          amount: 100.00
        }
      ],
      notes: "Test transaction"
    };

    const parseResult = PosCheckoutSchema.safeParse(payload);
    expect(parseResult.success).toBe(true);
  });

  it("should calculate split-tender payments accurately", () => {
    const totalAmount = 250.00;
    const payment1 = { method: PaymentMethod.CASH, amount: 150.00 };
    const payment2 = { method: PaymentMethod.CARD, amount: 100.00 };

    const totalPaid = addMoney(payment1.amount, payment2.amount);
    expect(totalPaid).toBe(250.00);

    const dueAmount = Math.max(0, subMoney(totalAmount, totalPaid));
    expect(dueAmount).toBe(0.00);
  });

  it("should calculate change due correctly when cash exceeds total", () => {
    const totalAmount = 78.50;
    const cashGiven = 100.00;

    const changeDue = roundMoney(subMoney(cashGiven, totalAmount));
    expect(changeDue).toBe(21.50);
  });

  it("should calculate subtotal with line item discounts correctly", () => {
    // Item 1: 3 * $20 with $5 line discount = $55
    // Item 2: 1 * $45 with $0 discount = $45
    // Total subtotal = $100
    const item1 = subMoney(mulMoney(3, 20.00), 5.00);
    const item2 = subMoney(mulMoney(1, 45.00), 0.00);

    const subtotal = addMoney(item1, item2);
    expect(subtotal).toBe(100.00);
  });
});
