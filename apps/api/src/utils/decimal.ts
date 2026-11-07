import Decimal from "decimal.js";

// Set precision for 4 decimal places
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export const toDecimal = (val: number | string | Decimal): Decimal => new Decimal(val);

export const addMoney = (a: number | string, b: number | string): number =>
  new Decimal(a).plus(new Decimal(b)).toNumber();

export const subMoney = (a: number | string, b: number | string): number =>
  new Decimal(a).minus(new Decimal(b)).toNumber();

export const mulMoney = (a: number | string, b: number | string): number =>
  new Decimal(a).times(new Decimal(b)).toNumber();

export const calculateTax = (amount: number, taxRate: number, isInclusive = false): number => {
  const amt = new Decimal(amount);
  const rate = new Decimal(taxRate).dividedBy(100);

  if (isInclusive) {
    // tax = amt - (amt / (1 + rate))
    return amt.minus(amt.dividedBy(rate.plus(1))).toDecimalPlaces(2).toNumber();
  }
  // tax = amt * rate
  return amt.times(rate).toDecimalPlaces(2).toNumber();
};

export const roundMoney = (val: number | string): number =>
  new Decimal(val).toDecimalPlaces(2).toNumber();
