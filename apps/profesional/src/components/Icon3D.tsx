import { Image } from 'expo-image';

/**
 * Íconos 3D de Doctor Ker. Son los mismos archivos de la web (public/iconos):
 * si allá cambia un ícono, la app lo toma sin copiar nada.
 */
export const ICONS_3D = {
  inicio: require('../../../../public/iconos/inicio.webp'),
  citas: require('../../../../public/iconos/citas.webp'),
  atencion: require('../../../../public/iconos/atencion.webp'),
  'atencion-domiciliaria': require('../../../../public/iconos/atencion-domiciliaria.webp'),
  sedes: require('../../../../public/iconos/sedes.webp'),
  telemedicina: require('../../../../public/iconos/telemedicina.webp'),
  'historia-clinica': require('../../../../public/iconos/historia-clinica.webp'),
  formularios: require('../../../../public/iconos/formularios.webp'),
  pacientes: require('../../../../public/iconos/pacientes.webp'),
  medicos: require('../../../../public/iconos/medicos.webp'),
  zonas: require('../../../../public/iconos/zonas.webp'),
  notificaciones: require('../../../../public/iconos/notificaciones.webp'),
  seguridad: require('../../../../public/iconos/seguridad.webp'),
  farmacia: require('../../../../public/iconos/farmacia.webp'),
  laboratorio: require('../../../../public/iconos/laboratorio.webp'),
  imagenologia: require('../../../../public/iconos/imagenologia.webp'),
  especialidades: require('../../../../public/iconos/especialidades.webp'),
  cirugia: require('../../../../public/iconos/cirugia.webp'),
} as const;

export type Icon3DName = keyof typeof ICONS_3D;

export function Icon3D({ name, size = 40 }: { name: Icon3DName; size?: number }) {
  return <Image source={ICONS_3D[name]} style={{ width: size, height: size }} contentFit="contain" cachePolicy="memory" accessible={false} />;
}

/** Ícono de cada modalidad de atención. */
export const MODALITY_ICON: Record<string, Icon3DName> = {
  domicilio: 'atencion-domiciliaria',
  sede: 'sedes',
  telemedicina: 'telemedicina',
};
