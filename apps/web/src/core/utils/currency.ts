export const DEFAULT_CURRENCY = 'Rs';

export function formatCurrency(amount: number | string | null | undefined, decimals: number = 0): string {
  if (amount === null || amount === undefined || amount === '') {
    return `${DEFAULT_CURRENCY} 0`;
  }
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) {
    return `${DEFAULT_CURRENCY} 0`;
  }
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${DEFAULT_CURRENCY} ${formatted}`;
}

export function formatPrice(amount: number | string | null | undefined): string {
  return formatCurrency(amount, 2);
}

export default formatCurrency;
