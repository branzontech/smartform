import { Asset } from 'expo-asset';
import { BRAULIO_POSES } from '@/components/Braulio';
import { ICONS_3D } from '@/components/Icon3D';

const TAB_ICONS = [
  require('../../assets/tabs/inicio.png'),
  require('../../assets/tabs/inicio-off.png'),
  require('../../assets/tabs/citas.png'),
  require('../../assets/tabs/citas-off.png'),
  require('../../assets/tabs/zonas.png'),
  require('../../assets/tabs/zonas-off.png'),
  require('../../assets/tabs/pacientes.png'),
  require('../../assets/tabs/pacientes-off.png'),
  require('../../assets/tabs/medicos.png'),
  require('../../assets/tabs/medicos-off.png'),
];

/**
 * Descarga y decodifica las imágenes de la app mientras se ve la pantalla de
 * bienvenida: así Braulio y los íconos aparecen al instante, no a medias.
 * Si algo falla, la app sigue (las imágenes cargan al usarse).
 */
export async function preloadImages(): Promise<void> {
  try {
    await Asset.loadAsync([...Object.values(BRAULIO_POSES), ...Object.values(ICONS_3D), ...TAB_ICONS]);
  } catch {
    // Sin precarga, cada imagen se carga cuando aparece.
  }
}
