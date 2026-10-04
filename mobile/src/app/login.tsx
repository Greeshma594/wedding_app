import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Button, Field, Message } from '../components/ui';
import { config, isConfigured } from '../lib/config';
import { supabase } from '../lib/supabase';
import { colors, space, type } from '../theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Email or password is wrong. Check them and try again.'
          : signInError.message,
      );
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <View style={styles.box}>
        <Text style={styles.shop}>{config.shopName}</Text>
        <Text style={[type.small, { textAlign: 'center' }]}>Staff sign in</Text>

        {!isConfigured ? (
          <Message>
            The app isn't connected to Supabase yet. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY to
            mobile/.env and restart.
          </Message>
        ) : null}

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={signIn}
        />
        {error ? <Message>{error}</Message> : null}
        <Button label="Sign in" onPress={signIn} loading={busy} />
        <Text style={[type.small, { textAlign: 'center' }]}>Staff accounts are created by the shop owner.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: space.lg },
  box: { gap: space.lg, maxWidth: 420, width: '100%', alignSelf: 'center' },
  shop: { fontSize: 32, fontWeight: '700', color: colors.accent, textAlign: 'center', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }) },
});
