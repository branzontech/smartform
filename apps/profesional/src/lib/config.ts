import Constants from 'expo-constants';

/**
 * Ambientes de Ker Hub, como en el login de la web. Cada uno habla con su API
 * (y su base de datos) y guarda su propia sesión.
 *
 *   · Desarrollo: la API de este computador (puerto 5340), base dev de Neon.
 *     Solo existe mientras se prueba con Expo; la dirección sale del mismo PC
 *     que sirve la app, así funciona aunque cambie la IP de la red.
 *   · Producción: datos reales.
 */
export type EnvironmentId = 'desarrollo' | 'produccion';

export interface EnvironmentInfo {
  id: EnvironmentId;
  label: string;
  description: string;
  url: string;
}

const PRODUCTION_URL = 'https://kerhub-web-production.up.railway.app';
const DEV_API_PORT = 5340;

function devApiUrl(): string | null {
  if (process.env.EXPO_PUBLIC_DEV_API_URL) return process.env.EXPO_PUBLIC_DEV_API_URL.replace(/\/$/, '');
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:${DEV_API_PORT}` : null;
}

const devUrl = __DEV__ ? devApiUrl() : null;

/** Ambientes que se pueden elegir en esta compilación (la app publicada solo conoce producción). */
export const ENVIRONMENTS: EnvironmentInfo[] = [
  ...(devUrl
    ? [{ id: 'desarrollo' as const, label: 'Desarrollo', description: 'Datos de prueba de este computador.', url: devUrl }]
    : []),
  { id: 'produccion', label: 'Producción', description: 'Datos reales de la operación.', url: PRODUCTION_URL },
];
