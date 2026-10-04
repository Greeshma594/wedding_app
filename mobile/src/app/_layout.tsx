import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Loading } from '../components/ui';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors } from '../theme';

function RootStack() {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.ink },
        contentStyle: { backgroundColor: colors.bg },
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="[section]/index" />
        <Stack.Screen name="[section]/catalogue" options={{ title: 'Catalogue' }} />
        <Stack.Screen name="[section]/add-dress" options={{ title: 'Add dress' }} />
        <Stack.Screen name="[section]/new-booking" options={{ title: 'New booking' }} />
        <Stack.Screen name="[section]/availability" options={{ title: 'Check a date' }} />
        <Stack.Screen name="[section]/bookings" options={{ title: 'Bookings' }} />
        <Stack.Screen name="dress/[id]/index" options={{ title: 'Dress' }} />
        <Stack.Screen name="dress/[id]/edit" options={{ title: 'Edit dress' }} />
        <Stack.Screen name="booking/[id]" options={{ title: 'Booking' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootStack />
    </AuthProvider>
  );
}
