# DreamsPOS Automated Test Results

Date: 2026-11-06 / 2026-11-07
Engine: Vitest 3.x
Environment: Windows / Node.js 22.x / TypeScript 5.7+

## Test Execution Summary

| Test Suite | File | Tests | Passed | Failed | Duration | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Financial Decimal Arithmetic** | `apps/api/test/decimal.test.ts` | 6 | 6 | 0 | 14ms | ✅ PASSED |
| **Point of Sale (POS) Logic** | `apps/api/test/pos.test.ts` | 4 | 4 | 0 | 19ms | ✅ PASSED |
| **Total** | | **10** | **10** | **0** | **3.01s** | **100% PASS** |

---

## Detailed Test Cases

### 1. `apps/api/test/decimal.test.ts`
- ✅ `should add money without floating point errors` (Verifies `0.1 + 0.2 === 0.3` without 0.30000000000000004 discrepancy)
- ✅ `should subtract money accurately` (`100.00 - 33.33 === 66.67`)
- ✅ `should multiply unit price by quantity accurately` (`19.99 * 3 === 59.97`)
- ✅ `should calculate exclusive tax accurately` (`$100 * 10% === $10.00`)
- ✅ `should calculate inclusive tax accurately` (`$110 inclusive of 10% tax yields $10.00 tax component`)
- ✅ `should round money to 2 decimal places using half-up rule` (`10.555 -> 10.56`, `10.554 -> 10.55`)

### 2. `apps/api/test/pos.test.ts`
- ✅ `should validate valid POS checkout payload with Zod schema` (Verifies schema enforcement on items, tender methods, and store UUIDs)
- ✅ `should calculate split-tender payments accurately` (Validates `$150 Cash + $100 Card = $250 Total`, resulting in $0 balance due)
- ✅ `should calculate change due correctly when cash exceeds total` (`$100 tendered for $78.50 invoice produces $21.50 change`)
- ✅ `should calculate subtotal with line item discounts correctly` (Verifies line item discounts properly reduce subtotal)
