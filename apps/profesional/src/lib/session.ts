import * as SecureStore from 'expo-secure-store';

/**
 * La sesión del profesional es un token de Ker Hub guardado en el llavero del
 * teléfono (Keychain en iPhone, Keystore en Android), nunca en texto plano.
 */
const KEY = 'kerhub.session';

export const readToken = () => SecureStore.getItemAsync(KEY);
export const saveToken = (token: string) => SecureStore.setItemAsync(KEY, token);
export const clearToken = () => SecureStore.deleteItemAsync(KEY);
