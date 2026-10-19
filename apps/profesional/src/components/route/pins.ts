/**
 * Pines del mapa con el número ya dibujado (generados desde los íconos 3D del
 * software de rutas). Cada marcador es una sola imagen: el mapa no dibuja
 * marcadores hechos con vistas anidadas.
 * Generado: no editar a mano.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

export const PIN_VISITA = [
  require('../../../assets/rutas/pines/visita-1.png'),
  require('../../../assets/rutas/pines/visita-2.png'),
  require('../../../assets/rutas/pines/visita-3.png'),
  require('../../../assets/rutas/pines/visita-4.png'),
  require('../../../assets/rutas/pines/visita-5.png'),
  require('../../../assets/rutas/pines/visita-6.png'),
  require('../../../assets/rutas/pines/visita-7.png'),
  require('../../../assets/rutas/pines/visita-8.png'),
  require('../../../assets/rutas/pines/visita-9.png'),
  require('../../../assets/rutas/pines/visita-10.png'),
  require('../../../assets/rutas/pines/visita-11.png'),
  require('../../../assets/rutas/pines/visita-12.png'),
  require('../../../assets/rutas/pines/visita-13.png'),
  require('../../../assets/rutas/pines/visita-14.png'),
  require('../../../assets/rutas/pines/visita-15.png'),
  require('../../../assets/rutas/pines/visita-16.png'),
  require('../../../assets/rutas/pines/visita-17.png'),
  require('../../../assets/rutas/pines/visita-18.png'),
  require('../../../assets/rutas/pines/visita-19.png'),
  require('../../../assets/rutas/pines/visita-20.png'),
  require('../../../assets/rutas/pines/visita-21.png'),
  require('../../../assets/rutas/pines/visita-22.png'),
  require('../../../assets/rutas/pines/visita-23.png'),
  require('../../../assets/rutas/pines/visita-24.png'),
  require('../../../assets/rutas/pines/visita-25.png'),
  require('../../../assets/rutas/pines/visita-26.png'),
  require('../../../assets/rutas/pines/visita-27.png'),
  require('../../../assets/rutas/pines/visita-28.png'),
  require('../../../assets/rutas/pines/visita-29.png'),
  require('../../../assets/rutas/pines/visita-30.png'),
  require('../../../assets/rutas/pines/visita-31.png'),
  require('../../../assets/rutas/pines/visita-32.png'),
  require('../../../assets/rutas/pines/visita-33.png'),
  require('../../../assets/rutas/pines/visita-34.png'),
  require('../../../assets/rutas/pines/visita-35.png'),
  require('../../../assets/rutas/pines/visita-36.png'),
  require('../../../assets/rutas/pines/visita-37.png'),
  require('../../../assets/rutas/pines/visita-38.png'),
  require('../../../assets/rutas/pines/visita-39.png'),
  require('../../../assets/rutas/pines/visita-40.png'),
];

export const PIN_LLEGADA = [
  require('../../../assets/rutas/pines/llegada-1.png'),
  require('../../../assets/rutas/pines/llegada-2.png'),
  require('../../../assets/rutas/pines/llegada-3.png'),
  require('../../../assets/rutas/pines/llegada-4.png'),
  require('../../../assets/rutas/pines/llegada-5.png'),
  require('../../../assets/rutas/pines/llegada-6.png'),
  require('../../../assets/rutas/pines/llegada-7.png'),
  require('../../../assets/rutas/pines/llegada-8.png'),
  require('../../../assets/rutas/pines/llegada-9.png'),
  require('../../../assets/rutas/pines/llegada-10.png'),
  require('../../../assets/rutas/pines/llegada-11.png'),
  require('../../../assets/rutas/pines/llegada-12.png'),
  require('../../../assets/rutas/pines/llegada-13.png'),
  require('../../../assets/rutas/pines/llegada-14.png'),
  require('../../../assets/rutas/pines/llegada-15.png'),
  require('../../../assets/rutas/pines/llegada-16.png'),
  require('../../../assets/rutas/pines/llegada-17.png'),
  require('../../../assets/rutas/pines/llegada-18.png'),
  require('../../../assets/rutas/pines/llegada-19.png'),
  require('../../../assets/rutas/pines/llegada-20.png'),
  require('../../../assets/rutas/pines/llegada-21.png'),
  require('../../../assets/rutas/pines/llegada-22.png'),
  require('../../../assets/rutas/pines/llegada-23.png'),
  require('../../../assets/rutas/pines/llegada-24.png'),
  require('../../../assets/rutas/pines/llegada-25.png'),
  require('../../../assets/rutas/pines/llegada-26.png'),
  require('../../../assets/rutas/pines/llegada-27.png'),
  require('../../../assets/rutas/pines/llegada-28.png'),
  require('../../../assets/rutas/pines/llegada-29.png'),
  require('../../../assets/rutas/pines/llegada-30.png'),
  require('../../../assets/rutas/pines/llegada-31.png'),
  require('../../../assets/rutas/pines/llegada-32.png'),
  require('../../../assets/rutas/pines/llegada-33.png'),
  require('../../../assets/rutas/pines/llegada-34.png'),
  require('../../../assets/rutas/pines/llegada-35.png'),
  require('../../../assets/rutas/pines/llegada-36.png'),
  require('../../../assets/rutas/pines/llegada-37.png'),
  require('../../../assets/rutas/pines/llegada-38.png'),
  require('../../../assets/rutas/pines/llegada-39.png'),
  require('../../../assets/rutas/pines/llegada-40.png'),
];

export const PIN_HECHA = require('../../../assets/rutas/pines/hecha.png');

/** Pin de la visita número `n` (1…40); más allá, el pin sin número. */
export function pinFor(n: number, kind: 'visita' | 'llegada', fallback: number) {
  const list = kind === 'llegada' ? PIN_LLEGADA : PIN_VISITA;
  return n >= 1 && n <= list.length ? list[n - 1] : fallback;
}
