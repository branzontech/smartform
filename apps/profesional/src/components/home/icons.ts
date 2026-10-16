import type { ContentType } from '@kerhub/core/contenido';
import type { Icon3DName } from '@/components/Icon3D';

/** Ícono 3D de cada tipo de publicación cuando no tiene imagen. */
export const FALLBACK_ICON: Record<ContentType, Icon3DName> = {
  noticia: 'notificaciones',
  evento: 'citas',
  actividad: 'citas',
  cultura: 'medicos',
  servicio: 'atencion',
  sede: 'sedes',
};
