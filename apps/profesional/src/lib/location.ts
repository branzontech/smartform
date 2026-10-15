import * as Location from 'expo-location';

/**
 * Ubicación para registrar la salida hacia el paciente y la llegada. Si el
 * profesional no da permiso o el GPS tarda, la acción sigue sin ubicación.
 */
export async function currentPosition(): Promise<{ latitud: number; longitud: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    if (!position) return null;
    return { latitud: Number(position.coords.latitude.toFixed(6)), longitud: Number(position.coords.longitude.toFixed(6)) };
  } catch {
    return null;
  }
}
