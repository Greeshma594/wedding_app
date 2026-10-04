import { formatDate } from './dates';
import { formatMoney } from './format';
import { SECTIONS, type BookingWithDress } from './types';

export interface ReceiptInput {
  shopName: string;
  booking: BookingWithDress;
  photoDataUri: string | null;
  reviewUrl: string;
  currencySymbol: string;
}

function esc(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const multiline = (value: string) => esc(value).replace(/\n/g, '<br>');

function row(label: string, value: string, className = ''): string {
  return `<tr class="${className}"><td>${esc(label)}</td><td>${value}</td></tr>`;
}

/** HTML for the booking receipt PDF. */
export function buildReceiptHtml(input: ReceiptInput): string {
  const { booking: b, shopName, currencySymbol } = input;
  const money = (n: number) => esc(formatMoney(n, currencySymbol));
  const dressDetails = b.dress.size ? `Size ${b.dress.size}` : '';
  const shortId = b.id.slice(0, 8).toUpperCase();

  const extras = [
    b.measurements && `<h2>Measurements</h2><p>${multiline(b.measurements)}</p>`,
    b.custom_changes && `<h2>Custom changes requested</h2><p>${multiline(b.custom_changes)}</p>`,
    b.notes && `<h2>Notes</h2><p>${multiline(b.notes)}</p>`,
  ]
    .filter(Boolean)
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif; color: #2a1f2d; margin: 32px; font-size: 13px; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #7a2e5c; padding-bottom: 12px; }
  .shop { font-size: 24px; color: #7a2e5c; font-family: Georgia, serif; }
  .meta { text-align: right; color: #6d6170; font-size: 12px; }
  .dress { display: flex; gap: 20px; margin: 20px 0; align-items: flex-start; }
  .dress img { width: 180px; border-radius: 8px; object-fit: cover; }
  .dress h1 { font-size: 18px; margin: 0 0 4px; }
  .muted { color: #6d6170; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td { padding: 7px 0; border-bottom: 1px solid #e4dde6; vertical-align: top; }
  td:first-child { color: #6d6170; width: 45%; }
  td:last-child { text-align: right; }
  tr.balance td { font-weight: 700; color: #7a2e5c; font-size: 15px; border-bottom: none; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a2e5c; margin: 22px 0 6px; }
  p { margin: 0; line-height: 1.5; }
  .sign { margin-top: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
  .sign .name { font-family: Georgia, serif; font-size: 20px; border-bottom: 1px solid #2a1f2d; padding: 0 24px 2px 0; }
  .review { margin-top: 28px; padding: 12px; background: #f6eedf; border-radius: 8px; font-size: 12px; }
  .review a { color: #7a2e5c; word-break: break-all; }
  .terms { margin-top: 16px; font-size: 11px; color: #6d6170; }
</style></head>
<body>
  <header>
    <div class="shop">${esc(shopName)}</div>
    <div class="meta">Booking receipt<br>No. ${esc(shortId)}<br>${esc(formatDate(b.created_at.slice(0, 10)))}</div>
  </header>

  <div class="dress">
    ${input.photoDataUri ? `<img src="${esc(input.photoDataUri)}" alt="">` : ''}
    <div>
      <h1>${esc(b.dress.code)} · ${esc(b.dress.name)}</h1>
      <div class="muted">${esc(SECTIONS[b.dress.section].title)}${dressDetails ? ` · ${esc(dressDetails)}` : ''}</div>
      <table>
        ${row('Customer', esc(b.customer_name))}
        ${row('Phone', esc(b.customer_phone))}
        ${row('Rental', `${esc(formatDate(b.start_date))} to ${esc(formatDate(b.end_date))}`)}
        ${row('Return by', esc(formatDate(b.return_date)))}
        ${b.returned_on ? row('Returned on', esc(formatDate(b.returned_on))) : ''}
      </table>
    </div>
  </div>

  <h2>Payment</h2>
  <table>
    ${row('Total price', money(b.total_price))}
    ${row('Amount collected', money(b.amount_collected))}
    ${row('Balance due', money(b.balance_due), 'balance')}
  </table>

  ${extras}

  <div class="sign">
    <div><div class="muted">Acknowledged by customer</div><div class="name">${esc(b.signature_name)}</div></div>
  </div>

  <p class="terms">Please return the dress by ${esc(formatDate(b.return_date))}.</p>

  ${
    input.reviewUrl
      ? `<div class="review">Enjoyed your outfit? Please rate us on Google: <a href="${esc(input.reviewUrl)}">${esc(input.reviewUrl)}</a></div>`
      : ''
  }
</body></html>`;
}
