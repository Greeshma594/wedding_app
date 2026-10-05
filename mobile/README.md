# Bridal Rentals app

Staff app for a wedding dress rental shop, for Android and iOS. Built with Expo (React Native) and Supabase.

## What it does

- **Home**: Wedding Wear and Wedding Guests sections, plus a one-tap "Review us on Google" button.
- **Catalogue**: a photo grid per section, with search, tag filters (e.g. red, green, silk) and a price range
  at the top. Staff add a dress with a photo, a name, rental price, size and tags. It gets the next code
  automatically (WW-001… for Wedding Wear, WG-001… for Wedding Guests) and appears straight away.
  Name, price, size, tags and notes can be edited later; the code never changes.
  Photos are compressed on the phone before upload: the longest side is resized to 1600 px at 78% quality
  (about 200–300 KB), and a 400 px thumbnail is made for the grid.
- **New booking**: dress (pick from the catalogue, or add a new one with the camera, which also goes into the
  catalogue), customer name and phone, body measurements, custom changes requested,
  rental dates, return date, total price (filled in from the dress's rental price), amount collected, balance due (calculated), notes,
  and the customer's typed name as their signature.
- **Check a date**: a calendar showing how many dresses are blocked each day, the blocked dresses for the
  chosen date (rented, overdue or cleaning day) and the free ones, which can be booked from there.
- **Bookings**: active bookings (overdue first, then out, then upcoming) and returned bookings.
- **Booking details**: record a payment, mark the dress returned (or undo), share the PDF receipt,
  open Google reviews, or cancel the booking.
- **Live sync**: changes on one staff phone show on the others straight away.

### Blocking rule

A dress is blocked from its rental start until **1 day after it is actually returned** (the cleaning day).
If it isn't back by its return date, it stays blocked until staff mark it returned. The app checks this
before saving a booking, and the database checks it again so two phones can't double-book a dress.
The rule lives in `src/lib/blocking.ts` and `booking_blocked_until()` in the migration; keep them in sync.

## Setup

### 1. Supabase (free plan, no card)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run each file in `../supabase/migrations/` in order (paste its contents, then Run):
   - `20261004000000_init.sql`: tables, the double-booking check, staff-only access, the `dresses` photo
     bucket and live sync.
   - `20261005000000_dress_codes_tags_price.sql`: automatic dress codes, tags and rental price.
3. In **Authentication → Sign In / Providers**, turn off **Allow new users to sign up**, so only staff
   accounts you create can sign in.
4. In **Authentication → Users**, use **Add user** to create an email and password for each staff member.

### 2. App settings

```bash
cp .env.example .env
```

Fill in `.env`:

| Setting | Where to find it |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_KEY` | Supabase → Project Settings → API Keys → publishable key (never the secret key) |
| `EXPO_PUBLIC_SHOP_NAME` | Your shop name, shown on the home screen and receipts |
| `EXPO_PUBLIC_GOOGLE_REVIEW_URL` | Optional. The app already uses the shop's link, https://share.google/VEFZb3MdFuhjqTyJC |
| `EXPO_PUBLIC_CURRENCY_SYMBOL` | Defaults to ₹ |

### 3. Run it on your phone

```bash
npm install
npx expo start
```

Install **Expo Go** on your phone and scan the QR code. Expo Go must support Expo SDK 57.
After changing `.env`, restart with `npx expo start --clear`.

Expo Go is for testing. To install the app on staff phones, build it once (below).

## Install on Android phones (APK)

Builds run on Expo's servers (free plan) and give you an APK file to install directly, so staff
don't need Expo Go or a laptop. Run these in the `mobile` folder.

1. Create a free account at [expo.dev](https://expo.dev), then sign in and link the project:
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
2. Save the app settings in Expo. `.env` stays on your laptop and isn't sent to the build servers.
   Use the same values as your `.env`:
   ```bash
   npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project-ref.supabase.co" --visibility plaintext
   npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_KEY --value "sb_publishable_..." --visibility plaintext
   npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SHOP_NAME --value "Rental Jeannie" --visibility plaintext
   ```
3. Build the APK. The first build takes about 10–20 minutes:
   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```
4. When it finishes, the terminal shows a link and a QR code. Open it on each Android phone, download
   the APK and install it. Android asks once to allow installing apps from your browser.

To update the app after code changes, run step 3 again and install the new APK over the old one. Bookings
and dresses are kept, because they live in Supabase.

iPhones need an Apple Developer account (US$99 a year) and are installed through TestFlight:
`npx eas-cli@latest build --platform ios --profile production`, then `npx eas-cli@latest submit --platform ios`.

## Development

```bash
npm run typecheck   # TypeScript
npm test            # unit tests for the blocking rule, catalogue filters, dates, money, photo sizes and receipt
```

Screens are in `src/app` (Expo Router), shared UI in `src/components`, and logic and data access in `src/lib`.

## Not built yet

- Editing a booking's dates or customer details after saving (cancel and re-create for now).
- Replacing a dress photo, or removing a dress from the catalogue.
- Working offline: the app needs an internet connection to save bookings.
- Automatic backups: the Supabase free plan has none, so export the bookings and dresses tables
  regularly (Table Editor → Export to CSV).
