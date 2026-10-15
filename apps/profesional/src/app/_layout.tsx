import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { colors } from '@/theme';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.canvas },
            headerShadowVisible: false,
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.ink, fontWeight: '700' },
            contentStyle: { backgroundColor: colors.canvas },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="mi-dia" options={{ title: 'Mi día', headerBackVisible: false }} />
          <Stack.Screen name="cita/[id]" options={{ title: 'Cita', headerBackTitle: 'Mi día' }} />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
