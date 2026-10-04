import type { ISODate } from './dates';

export type Section = 'wear' | 'guest';

export const SECTIONS: Record<Section, { title: string; subtitle: string }> = {
  wear: { title: 'Wedding Wear', subtitle: 'Bride and groom' },
  guest: { title: 'Wedding Guests', subtitle: 'Outfits for guests' },
};

export function isSection(value: unknown): value is Section {
  return value === 'wear' || value === 'guest';
}

export interface Dress {
  id: string;
  section: Section;
  /** Given automatically by the database: WW-001… or WG-001… */
  code: string;
  name: string;
  size: string | null;
  /** Rental price, used to prefill bookings and filter the catalogue. */
  price: number | null;
  /** Lower-case words for filtering, such as colours: ['red', 'silk']. */
  tags: string[];
  notes: string | null;
  image_path: string | null;
  thumb_path: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  dress_id: string;
  customer_name: string;
  customer_phone: string;
  start_date: ISODate;
  end_date: ISODate;
  return_date: ISODate;
  total_price: number;
  amount_collected: number;
  balance_due: number;
  measurements: string | null;
  custom_changes: string | null;
  notes: string | null;
  signature_name: string;
  returned_on: ISODate | null;
  created_at: string;
}

export interface BookingWithDress extends Booking {
  dress: Dress;
}

export type NewBooking = Omit<Booking, 'id' | 'balance_due' | 'returned_on' | 'created_at'>;
