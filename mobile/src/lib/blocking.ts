import { addDays, type ISODate } from './dates';

// A dress is blocked from its rental start until 1 day after it is actually returned.
// Keep in sync with public.booking_blocked_until() in supabase/migrations.

export interface BlockingFields {
  start_date: ISODate;
  return_date: ISODate;
  returned_on: ISODate | null;
}

/** Last blocked day, or null when the dress is overdue and blocked with no end date. */
export function blockedUntil(b: BlockingFields, today: ISODate): ISODate | null {
  if (b.returned_on) return addDays(b.returned_on, 1);
  if (today <= b.return_date) return addDays(b.return_date, 1);
  return null;
}

export type DayStatus = 'rented' | 'overdue' | 'buffer';

/** Why a booking blocks its dress on `day`, or null if it doesn't. */
export function statusOn(b: BlockingFields, day: ISODate, today: ISODate): DayStatus | null {
  if (day < b.start_date) return null;
  if (b.returned_on) {
    if (day <= b.returned_on) return 'rented';
    if (day === addDays(b.returned_on, 1)) return 'buffer';
    return null;
  }
  if (today <= b.return_date) {
    if (day <= b.return_date) return 'rented';
    if (day === addDays(b.return_date, 1)) return 'buffer';
    return null;
  }
  // Overdue: still out, so blocked on every day from the start.
  return day <= b.return_date ? 'rented' : 'overdue';
}

export type BookingState = 'upcoming' | 'out' | 'overdue' | 'returned';

export function bookingState(b: BlockingFields, today: ISODate): BookingState {
  if (b.returned_on) return 'returned';
  if (today < b.start_date) return 'upcoming';
  if (today <= b.return_date) return 'out';
  return 'overdue';
}

/** The first day the dress can be booked again, or null while it is overdue. */
export function availableFrom(b: BlockingFields, today: ISODate): ISODate | null {
  const until = blockedUntil(b, today);
  return until ? addDays(until, 1) : null;
}

export interface Candidate {
  start_date: ISODate;
  return_date: ISODate;
}

/** Existing bookings whose blocked period overlaps the candidate's (including its buffer day). */
export function findConflicts<T extends BlockingFields & { id: string }>(
  candidate: Candidate,
  existing: T[],
  today: ISODate,
  ignoreId?: string,
): T[] {
  const candidateUntil = addDays(candidate.return_date, 1);
  return existing.filter((b) => {
    if (b.id === ignoreId) return false;
    const until = blockedUntil(b, today);
    const startsBeforeOtherEnds = until === null || candidate.start_date <= until;
    return startsBeforeOtherEnds && b.start_date <= candidateUntil;
  });
}

export function balanceDue(total: number, collected: number): number {
  return Math.round((total - collected) * 100) / 100;
}

export interface BookingDraft {
  start_date: ISODate | null;
  end_date: ISODate | null;
  return_date: ISODate | null;
  total_price: number | null;
  amount_collected: number | null;
}

/** Problems with the dates and amounts, as messages for staff. Empty when valid. */
export function validateBookingDraft(d: BookingDraft): string[] {
  const errors: string[] = [];
  if (!d.start_date || !d.end_date || !d.return_date) {
    errors.push('Choose the rental start, end and return dates.');
  } else {
    if (d.end_date < d.start_date) errors.push('Rental end date must be on or after the start date.');
    if (d.return_date < d.end_date) errors.push('Return date must be on or after the rental end date.');
  }
  if (d.total_price === null || Number.isNaN(d.total_price) || d.total_price < 0) {
    errors.push('Enter the total price.');
  }
  if (d.amount_collected === null || Number.isNaN(d.amount_collected) || d.amount_collected < 0) {
    errors.push('Enter the amount collected (0 if nothing was paid).');
  } else if (d.total_price !== null && d.amount_collected > d.total_price) {
    errors.push('Amount collected cannot be more than the total price.');
  }
  return errors;
}
