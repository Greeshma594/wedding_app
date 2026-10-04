import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { photoDataUri } from './api';
import { config } from './config';
import { buildReceiptHtml } from './receiptHtml';
import type { BookingWithDress } from './types';

/** Creates the booking receipt PDF and opens the share sheet (WhatsApp, email, save to Files…). */
export async function shareReceipt(booking: BookingWithDress): Promise<void> {
  const html = buildReceiptHtml({
    shopName: config.shopName,
    booking,
    photoDataUri: await photoDataUri(booking.dress.image_path),
    reviewUrl: config.googleReviewUrl,
    currencySymbol: config.currencySymbol,
  });

  if (Platform.OS === 'web') {
    // Browsers can't share files from here; open the print dialog so it can be saved as PDF.
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Receipt for ${booking.customer_name}`,
  });
}
