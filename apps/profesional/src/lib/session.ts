import * as SecureStore from 'expo-secure-store';
import { ENVIRONMENTS, type EnvironmentId, type EnvironmentInfo } from './config';

/**
 * La sesión del profesional es un token de Ker Hub guardado en el llavero del
 * teléfono (Keychain en iPhone, Keystore en Android), nunca en texto plano.
 * Cada ambiente tiene su propio token: la sesión de uno no viaja al otro.
 */
const ENVIRONMENT_KEY = 'kerhub.environment';

let environment: EnvironmentInfo = ENVIRONMENTS[0];

export const currentEnvironment = () => environment;

export async function loadEnvironment(): Promise<EnvironmentInfo> {
  const saved = await SecureStore.getItemAsync(ENVIRONMENT_KEY);
  environment = ENVIRONMENTS.find((e) => e.id === saved) ?? ENVIRONMENTS[0];
  return environment;
}

export async function selectEnvironment(id: EnvironmentId): Promise<EnvironmentInfo> {
  environment = ENVIRONMENTS.find((e) => e.id === id) ?? environment;
  await SecureStore.setItemAsync(ENVIRONMENT_KEY, environment.id);
  return environment;
}

const tokenKey = () => `kerhub.session.${environment.id}`;

export const readToken = () => SecureStore.getItemAsync(tokenKey());
export const saveToken = (token: string) => SecureStore.setItemAsync(tokenKey(), token);
export const clearToken = () => SecureStore.deleteItemAsync(tokenKey());
