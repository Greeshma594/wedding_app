import { describe, expect, it } from 'vitest';

import {
  availableFrom,
  balanceDue,
  blockedUntil,
  bookingState,
  findConflicts,
  statusOn,
  validateBookingDraft,
} from '../blocking';

// Booking out 14–16 Nov, due back 17 Nov.
const booking = { id: 'a', start_date: '2026-11-14', return_date: '2026-11-17', returned_on: null as string | null };

describe('blockedUntil', () => {
  it('blocks until 1 day after the planned return while it is not due yet', () => {
    expect(blockedUntil(booking, '2026-11-10')).toBe('2026-11-18');
  });

  it('blocks until 1 day after the actual return', () => {
    expect(blockedUntil({ ...booking, returned_on: '2026-11-16' }, '2026-11-20')).toBe('2026-11-17');
    expect(blockedUntil({ ...booking, returned_on: '2026-11-19' }, '2026-11-20')).toBe('2026-11-20');
  });

  it('has no end while the dress is overdue', () => {
    expect(blockedUntil(booking, '2026-11-18')).toBeNull();
  });
});

describe('statusOn', () => {
  it('matches the on-time example: rented to the 17th, cleaning on the 18th, free on the 19th', () => {
    const returned = { ...booking, returned_on: '2026-11-17' };
    expect(statusOn(returned, '2026-11-13', '2026-11-20')).toBeNull();
    expect(statusOn(returned, '2026-11-14', '2026-11-20')).toBe('rented');
    expect(statusOn(returned, '2026-11-17', '2026-11-20')).toBe('rented');
    expect(statusOn(returned, '2026-11-18', '2026-11-20')).toBe('buffer');
    expect(statusOn(returned, '2026-11-19', '2026-11-20')).toBeNull();
  });

  it('matches the late example: back on the 19th, cleaning on the 20th', () => {
    const late = { ...booking, returned_on: '2026-11-19' };
    expect(statusOn(late, '2026-11-19', '2026-11-25')).toBe('rented');
    expect(statusOn(late, '2026-11-20', '2026-11-25')).toBe('buffer');
    expect(statusOn(late, '2026-11-21', '2026-11-25')).toBeNull();
  });

  it('shows an unreturned overdue dress as overdue on every later day', () => {
    expect(statusOn(booking, '2026-11-16', '2026-11-19')).toBe('rented');
    expect(statusOn(booking, '2026-11-18', '2026-11-19')).toBe('overdue');
    expect(statusOn(booking, '2026-12-25', '2026-11-19')).toBe('overdue');
  });

  it('plans with the return date while the dress is not due yet', () => {
    expect(statusOn(booking, '2026-11-18', '2026-11-01')).toBe('buffer');
    expect(statusOn(booking, '2026-11-19', '2026-11-01')).toBeNull();
  });
});

describe('bookingState and availableFrom', () => {
  it('moves from upcoming to out to overdue to returned', () => {
    expect(bookingState(booking, '2026-11-13')).toBe('upcoming');
    expect(bookingState(booking, '2026-11-14')).toBe('out');
    expect(bookingState(booking, '2026-11-17')).toBe('out');
    expect(bookingState(booking, '2026-11-18')).toBe('overdue');
    expect(bookingState({ ...booking, returned_on: '2026-11-17' }, '2026-11-18')).toBe('returned');
  });

  it('gives the first bookable day', () => {
    expect(availableFrom({ ...booking, returned_on: '2026-11-17' }, '2026-11-20')).toBe('2026-11-19');
    expect(availableFrom(booking, '2026-11-25')).toBeNull();
  });
});

describe('findConflicts', () => {
  const today = '2026-11-01';

  it('rejects a booking starting on the cleaning day', () => {
    expect(findConflicts({ start_date: '2026-11-18', return_date: '2026-11-20' }, [booking], today)).toHaveLength(1);
  });

  it('allows a booking starting the day after the cleaning day', () => {
    expect(findConflicts({ start_date: '2026-11-19', return_date: '2026-11-20' }, [booking], today)).toHaveLength(0);
  });

  it('rejects a booking whose own cleaning day runs into the next rental', () => {
    expect(findConflicts({ start_date: '2026-11-10', return_date: '2026-11-13' }, [booking], today)).toHaveLength(1);
    expect(findConflicts({ start_date: '2026-11-10', return_date: '2026-11-12' }, [booking], today)).toHaveLength(0);
  });

  it('rejects any later booking while the dress is overdue', () => {
    expect(findConflicts({ start_date: '2027-01-10', return_date: '2027-01-12' }, [booking], '2026-11-20')).toHaveLength(1);
  });

  it('frees the dates once an early return is recorded', () => {
    const early = { ...booking, returned_on: '2026-11-15' };
    expect(findConflicts({ start_date: '2026-11-17', return_date: '2026-11-18' }, [early], today)).toHaveLength(0);
  });

  it('ignores the booking being edited', () => {
    expect(findConflicts({ start_date: '2026-11-14', return_date: '2026-11-17' }, [booking], today, 'a')).toHaveLength(0);
  });
});

describe('validateBookingDraft and balanceDue', () => {
  const valid = {
    start_date: '2026-11-14',
    end_date: '2026-11-16',
    return_date: '2026-11-17',
    total_price: 12000,
    amount_collected: 5000,
  };

  it('accepts a complete booking', () => {
    expect(validateBookingDraft(valid)).toEqual([]);
  });

  it('catches dates in the wrong order and overpayment', () => {
    expect(validateBookingDraft({ ...valid, end_date: '2026-11-13' })).toContain(
      'Rental end date must be on or after the start date.',
    );
    expect(validateBookingDraft({ ...valid, return_date: '2026-11-15' })).toContain(
      'Return date must be on or after the rental end date.',
    );
    expect(validateBookingDraft({ ...valid, amount_collected: 13000 })).toContain(
      'Amount collected cannot be more than the total price.',
    );
  });

  it('works out the balance', () => {
    expect(balanceDue(12000, 5000)).toBe(7000);
    expect(balanceDue(1000.5, 0.25)).toBe(1000.25);
  });
});
