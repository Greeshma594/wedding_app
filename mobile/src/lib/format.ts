import { config } from './config';

/** 12000 → '₹12,000', 1250.5 → '₹1,250.50' */
export function formatMoney(amount: number, symbol: string = config.currencySymbol): string {
  const negative = amount < 0;
  const [whole, fraction] = Math.abs(amount).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${symbol}${grouped}${fraction === '00' ? '' : `.${fraction}`}`;
}

/** Reads a typed amount; returns null for empty or invalid input. */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[,\s]/g, '');
  if (cleaned === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Number(cleaned);
}
