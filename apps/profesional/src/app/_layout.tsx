import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/auth';
import { preloadImages } from '@/lib/preload';
import { Intro } from '@/components/Intro';
import { OverlayHost } from '@/components/overlay/Overlay';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

/** Tiempo mínimo de la bienvenida, para que se alcance a ver y no parpadee. */
const MIN_INTRO_MS = 1400;

function Boot() {
  const { loading } = useAuth();
  const [imagesReady, setImagesReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    void preloadImages().finally(() => setImagesReady(true));
    const t = setTimeout(() => setMinElapsed(true), MIN_INTRO_MS);
    return () => clearTimeout(t);
  }, []);

  const showIntro = loading || !imagesReady || !minElapsed;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StatusBar style={showIntro ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.canvas },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.ink, fontWeight: '700' },
          contentStyle: { backgroundColor: colors.canvas },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="cita/[id]" options={{ title: 'Cita', headerBackTitle: 'Atrás' }} />
        <Stack.Screen name="atencion/[id]" options={{ title: 'Atención', headerBackTitle: 'Cita' }} />
        <Stack.Screen name="atencion/resumen/[id]" options={{ title: 'Resumen de la atención', headerBackTitle: 'Cita' }} />
        <Stack.Screen name="contenido/[id]" options={{ title: '', headerBackTitle: 'Inicio', headerTransparent: true }} />
      </Stack>
      <OverlayHost />
      {showIntro && <Intro onShown={() => void SplashScreen.hideAsync()} />}
    </View>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Boot />
      </AuthProvider>
    </QueryClientProvider>
  );
}
