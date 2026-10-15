/** Dirección de Ker Hub. Por defecto producción; para desarrollo: EXPO_PUBLIC_API_URL=http://<ip-del-pc>:5341 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://kerhub-web-production.up.railway.app').replace(/\/$/, '');
