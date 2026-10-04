import * as Linking from 'expo-linking';
import { useState } from 'react';
import { View } from 'react-native';

import { config } from '../lib/config';
import { Button, Message } from './ui';

/** Opens the shop's Google review page in one tap. */
export function ReviewButton() {
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    if (!config.googleReviewUrl) {
      setError('Add the Google review link as EXPO_PUBLIC_GOOGLE_REVIEW_URL in the app settings.');
      return;
    }
    try {
      setError(null);
      await Linking.openURL(config.googleReviewUrl);
    } catch {
      setError('Could not open Google reviews on this phone.');
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Button label="★  Review us on Google" variant="secondary" onPress={open} />
      {error ? <Message>{error}</Message> : null}
    </View>
  );
}
