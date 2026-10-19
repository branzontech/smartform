import { Linking, Platform } from 'react-native';
import { showAlert } from '@/components/overlay/Overlay';

/**
 * Abre un enlace (teléfono, mapas, web) sin dejar errores sueltos: si el
 * teléfono no puede abrirlo prueba la alternativa y, si tampoco, avisa.
 */
export async function openLink(url: string, fallback?: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    if (fallback) {
      try {
        await Linking.openURL(fallback);
        return;
      } catch {
        // Sigue al aviso.
      }
    }
    showAlert('No se pudo abrir', 'Este teléfono no tiene una aplicación para abrir este enlace.');
  }
}

export const callPhone = (phone: string) => openLink(`tel:${phone.replace(/\s+/g, '')}`);

const googleSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${q}`;

/** La dirección en el mapa (Mapas de Apple en iPhone, Google Maps en Android). */
export function openAddress(address: string) {
  const q = encodeURIComponent(address);
  return openLink(Platform.OS === 'ios' ? `https://maps.apple.com/?q=${q}` : googleSearch(q), googleSearch(q));
}

/** Cómo llegar a la dirección desde donde está. */
export function openDirections(address: string) {
  const q = encodeURIComponent(address);
  const url = Platform.OS === 'ios' ? `https://maps.apple.com/?daddr=${q}&dirflg=d` : `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  return openLink(url, googleSearch(q));
}
