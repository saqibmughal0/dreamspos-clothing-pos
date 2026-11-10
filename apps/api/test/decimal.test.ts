import { describe, it, expect } from "vitest";
import { addMoney, subMoney, mulMoney, calculateTax, roundMoney } from "../src/utils/decimal";

describe("Decimal Safe Financial Calculations", () => {
  it("should add money without floating point errors", () => {
    // In IEEE 754: 0.1 + 0.2 = 0.30000000000000004
    const result = addMoney(0.1, 0.2);
    expect(result).toBe(0.3);
  });

  it("should subtract money accurately", () => {
    // 100.00 - 33.33 = 66.67
    const result = subMoney(100.00, 33.33);
    expect(result).toBe(66.67);
  });

  it("should multiply unit price by quantity accurately", () => {
    // 19.99 * 3 = 59.97
    const result = mulMoney(19.99, 3);
    expect(result).toBe(59.97);
  });

  it("should calculate exclusive tax accurately", () => {
    // $100 with 10% exclusive tax = $10.00
    const tax = calculateTax(100, 10, false);
    expect(tax).toBe(10);
  });

  it("should calculate inclusive tax accurately", () => {
    // $110 with 10% inclusive tax: tax component should be $10.00
    const tax = calculateTax(110, 10, true);
    expect(tax).toBe(10);
  });

  it("should round money to 2 decimal places using half-up rule", () => {
    expect(roundMoney(10.555)).toBe(10.56);
    expect(roundMoney(10.554)).toBe(10.55);
  });
});
