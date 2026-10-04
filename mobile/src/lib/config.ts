// Values come from mobile/.env (copy .env.example). EXPO_PUBLIC_ variables are
// bundled into the app, so only put publishable values here, never secret keys.
export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
  shopName: process.env.EXPO_PUBLIC_SHOP_NAME || 'Bridal Rentals',
  // The shop's Google review page. Set EXPO_PUBLIC_GOOGLE_REVIEW_URL to use a different link.
  googleReviewUrl: process.env.EXPO_PUBLIC_GOOGLE_REVIEW_URL || 'https://share.google/VEFZb3MdFuhjqTyJC',
  currencySymbol: process.env.EXPO_PUBLIC_CURRENCY_SYMBOL || '₹',
};

export const isConfigured = Boolean(config.supabaseUrl && config.supabaseKey);
