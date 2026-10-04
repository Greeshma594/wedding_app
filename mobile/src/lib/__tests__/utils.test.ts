import { describe, expect, it } from 'vitest';

import { base64ToBytes } from '../base64';
import { addDays, formatDate, isValidISODate, monthGrid } from '../dates';
import { formatMoney, parseAmount } from '../format';
import { fitWithin } from '../imageSize';
import { buildReceiptHtml } from '../receiptHtml';
import type { BookingWithDress } from '../types';

describe('dates', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('formats and validates dates', () => {
    expect(formatDate('2026-11-14')).toBe('14 Nov 2026');
    expect(isValidISODate('2026-02-29')).toBe(false);
    expect(isValidISODate('2028-02-29')).toBe(true);
  });

  it('builds a Monday-first month grid', () => {
    const weeks = monthGrid(2026, 10); // November 2026 starts on a Sunday
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
  });
});

describe('money', () => {
  it('formats amounts', () => {
    expect(formatMoney(12000, '₹')).toBe('₹12,000');
    expect(formatMoney(1250.5, '₹')).toBe('₹1,250.50');
  });

  it('parses typed amounts', () => {
    expect(parseAmount('12,000')).toBe(12000);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('12.345')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });
});

describe('photo compression sizes', () => {
  it('fits the longest side within the limit', () => {
    expect(fitWithin(4032, 3024, 1600)).toEqual({ width: 1600 });
    expect(fitWithin(3024, 4032, 1600)).toEqual({ height: 1600 });
    expect(fitWithin(1200, 900, 1600)).toBeNull();
  });
});

describe('base64ToBytes', () => {
  it('decodes with and without padding', () => {
    expect(Array.from(base64ToBytes('aGk='))).toEqual([104, 105]);
    expect(Array.from(base64ToBytes('aGVsbG8='))).toEqual([104, 101, 108, 108, 111]);
    const bytes = Array.from({ length: 257 }, (_, i) => (i * 37) % 256);
    expect(Array.from(base64ToBytes(btoa(String.fromCharCode(...bytes))))).toEqual(bytes);
  });
});

describe('receipt', () => {
  const booking: BookingWithDress = {
    id: '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90',
    dress_id: 'd1',
    customer_name: 'Anitha <R>',
    customer_phone: '98450 12345',
    start_date: '2026-11-14',
    end_date: '2026-11-16',
    return_date: '2026-11-17',
    total_price: 12000,
    amount_collected: 5000,
    balance_due: 7000,
    measurements: 'Bust 34\nWaist 28',
    custom_changes: 'Shorten sleeves by 1 inch',
    notes: null,
    signature_name: 'Anitha R',
    returned_on: null,
    created_at: '2026-10-04T10:00:00Z',
    dress: {
      id: 'd1',
      section: 'wear',
      code: 'WW-014',
      name: 'Ivory lehenga',
      size: 'M',
      price: 12000,
      tags: ['ivory', 'silk'],
      notes: null,
      image_path: null,
      thumb_path: null,
      created_at: '2026-10-01T10:00:00Z',
    },
  };

  const html = buildReceiptHtml({
    shopName: 'Bridal Rentals',
    booking,
    photoDataUri: null,
    reviewUrl: 'https://g.page/r/example/review',
    currencySymbol: '₹',
  });

  it('includes payments, dates, fitting details and the signature', () => {
    expect(html).toContain('₹12,000');
    expect(html).toContain('₹7,000');
    expect(html).toContain('17 Nov 2026');
    expect(html).toContain('Bust 34<br>Waist 28');
    expect(html).toContain('Shorten sleeves by 1 inch');
    expect(html).toContain('Anitha R');
    expect(html).toContain('https://g.page/r/example/review');
  });

  it('escapes customer text', () => {
    expect(html).toContain('Anitha &lt;R&gt;');
    expect(html).not.toContain('Anitha <R>');
  });
});
