import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type EdgePadding } from 'react-native-maps';
import { decodePolyline, isLocated, isPending, trafficSegments, type Camino, type Parada, type TraficoTramo, type Velocidad } from '@kerhub/core/rutas';
import { colors } from '@/theme';
import { PIN_HECHA, pinFor } from './pins';

export const ROUTE_ICONS = {
  carro: require('../../../assets/rutas/carro.png'),
  visita: require('../../../assets/rutas/visita.png'),
  llegada: require('../../../assets/rutas/llegada.png'),
  salida: require('../../../assets/rutas/salida.png'),
  reloj: require('../../../assets/rutas/reloj.png'),
  paciente: require('../../../assets/rutas/paciente.png'),
  profesional: require('../../../assets/rutas/profesional.png'),
  trafico: require('../../../assets/rutas/trafico.png'),
};

/** Color del trazado según el tráfico: fluido en el color de la marca, lento en naranja, trancón en rojo. */
const SPEED_COLOR: Record<Velocidad, string> = { NORMAL: colors.primary, SLOW: '#f08c00', TRAFFIC_JAM: '#d92d20' };
const FADED = 'rgba(139,53,233,0.35)';
const ALT_COLOR = '#9aa3b2';
/** Sin tráfico en vivo, el trazado va de un solo color. */
const NO_TRAFFIC: TraficoTramo[] = [];

/** Cartagena: donde se centra el mapa mientras llegan los datos. */
const DEFAULT_REGION = { latitude: 10.4, longitude: -75.51, latitudeDelta: 0.12, longitudeDelta: 0.12 };

export interface RouteMapHandle {
  /** Encuadra la ruta completa (o los puntos que se le pasen). */
  fit: (only?: { latitude: number; longitude: number }[]) => void;
}

interface RouteMapProps {
  paradas: Parada[];
  /** Recorrido de las visitas pendientes con su tráfico. */
  route: { polilinea: string | null; trafico: TraficoTramo[] } | null;
  /** Camino a la próxima visita (resaltado) y sus alternas en gris. */
  leg: { principal: Camino; alternativas: Camino[] } | null;
  selectedAlt: number | null;
  onSelectAlt: (i: number | null) => void;
  /** Hora de llegada estimada a cada visita pendiente. */
  etas: Record<string, string>;
  /** Burbuja sobre la próxima visita («8 min»). */
  targetLabel: string | null;
  /** Ya va en ruta: el profesional se ve como un carro; antes, como el punto de salida. */
  started: boolean;
  /** Tráfico en tiempo real: capa del mapa y trazado coloreado (verde, naranja, rojo). */
  liveTraffic: boolean;
  position: { latitud: number; longitud: number } | null;
  targetId: string | null;
  /** Espacio que ocupa la hoja de abajo, para no tapar la ruta al encuadrar. */
  bottomInset: number;
}

export function TrafficLine({ polilinea, trafico, faded, width }: { polilinea: string | null; trafico: TraficoTramo[]; faded?: boolean; width: number }) {
  const segments = useMemo(() => trafficSegments(polilinea ? decodePolyline(polilinea) : [], trafico), [polilinea, trafico]);
  return (
    <>
      {segments.map((s, i) => (
        <Polyline key={`${i}-c`} coordinates={s.coords} strokeColor="#ffffff" strokeWidth={width + 4} lineCap="round" lineJoin="round" />
      ))}
      {segments.map((s, i) => (
        <Polyline key={`${i}-l`} coordinates={s.coords} strokeColor={faded ? FADED : SPEED_COLOR[s.velocidad]} strokeWidth={width} lineCap="round" lineJoin="round" />
      ))}
    </>
  );
}

/**
 * Mapa a pantalla completa, como en las apps de transporte: el recorrido del
 * día con el tráfico de ahora, el camino a la próxima visita resaltado con sus
 * alternas en gris, cada visita con su pin 3D, número y hora de llegada, y el
 * profesional con su carro.
 */
export const RouteMap = forwardRef<RouteMapHandle, RouteMapProps>(function RouteMap(props, ref) {
  const { paradas, route, leg, selectedAlt, onSelectAlt, etas, targetLabel, started, liveTraffic, position, targetId, bottomInset } = props;
  const map = useRef<MapView>(null);
  const located = paradas.filter(isLocated);
  const routePoints = useMemo(() => (route?.polilinea ? decodePolyline(route.polilinea) : []), [route?.polilinea]);
  const shown = selectedAlt != null && leg?.alternativas[selectedAlt] ? leg.alternativas[selectedAlt] : leg?.principal ?? null;

  const padding: EdgePadding = { top: 130, right: 50, bottom: bottomInset + 30, left: 50 };
  useImperativeHandle(ref, () => ({
    fit: (only) => {
      const points = only ?? [
        ...located.map((p) => ({ latitude: p.latitud!, longitude: p.longitud! })),
        ...(position ? [{ latitude: position.latitud, longitude: position.longitud }] : []),
        ...routePoints,
      ];
      if (points.length) map.current?.fitToCoordinates(points, { edgePadding: padding, animated: true });
    },
  }));

  return (
    <MapView
      ref={map}
      style={styles.fill}
      initialRegion={DEFAULT_REGION}
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
      showsTraffic={liveTraffic}
      showsPointsOfInterests={false}
      showsBuildings={false}
      showsCompass={false}
      toolbarEnabled={false}
      pitchEnabled={false}>
      {/* El resto del recorrido, tenue cuando hay un camino resaltado a la próxima visita. */}
      {route && <TrafficLine polilinea={route.polilinea} trafico={liveTraffic ? route.trafico : NO_TRAFFIC} faded={!!leg} width={5} />}
      {leg?.alternativas.map((alt, i) =>
        i === selectedAlt ? null : (
          <Polyline key={`alt-${i}`} coordinates={alt.polilinea ? decodePolyline(alt.polilinea) : []} strokeColor={ALT_COLOR} strokeWidth={5} lineCap="round" tappable onPress={() => onSelectAlt(i)} />
        ),
      )}
      {selectedAlt != null && leg && (
        <Polyline coordinates={leg.principal.polilinea ? decodePolyline(leg.principal.polilinea) : []} strokeColor={ALT_COLOR} strokeWidth={5} lineCap="round" tappable onPress={() => onSelectAlt(null)} />
      )}
      {shown && <TrafficLine polilinea={shown.polilinea} trafico={liveTraffic ? shown.trafico : NO_TRAFFIC} width={6} />}

      {located.map((p, i) => {
        const done = !isPending(p);
        const target = p.id === targetId;
        const pendingLeft = located.filter(isPending);
        const last = !done && pendingLeft.length > 1 && pendingLeft[pendingLeft.length - 1].id === p.id;
        const source = done ? PIN_HECHA : pinFor(i + 1, last ? 'llegada' : 'visita', last ? ROUTE_ICONS.llegada : ROUTE_ICONS.visita);
        const when = target && targetLabel ? `a ${targetLabel}` : etas[p.id] ? `llegas ${etas[p.id]}` : null;
        return (
          // Una sola imagen por marcador (como el carro): el mapa no dibuja marcadores con vistas anidadas.
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitud!, longitude: p.longitud! }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={target ? 10 : done ? 1 : 5}
            title={`${i + 1}. ${p.paciente}`}
            description={[when, p.direccion].filter(Boolean).join(' · ')}>
            <Image source={source} style={target ? styles.pinTarget : styles.pinImage} fadeDuration={0} />
          </Marker>
        );
      })}
      {position && (
        <Marker
          coordinate={{ latitude: position.latitud, longitude: position.longitud }}
          anchor={{ x: 0.5, y: started ? 0.5 : 1 }}
          zIndex={20}
          title={started ? 'Tu ubicación' : 'Salida'}
          description={started ? undefined : 'Desde aquí se calcula la ruta'}>
          <Image source={started ? ROUTE_ICONS.carro : ROUTE_ICONS.salida} style={started ? styles.car : styles.pinImage} fadeDuration={0} />
        </Marker>
      )}
    </MapView>
  );
});

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  marker: { width: 92, height: 96, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  pinWrap: { width: 58, height: 58, alignItems: 'center', justifyContent: 'flex-end' },
  startLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  pinImage: { width: 52, height: 52 },
  pinTarget: { width: 64, height: 64 },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.primaryDark },
  bubble: { backgroundColor: colors.ink, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  bubbleText: { color: '#fff', fontSize: 12.5, fontWeight: '800' },
  eta: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  etaText: { color: colors.ink, fontSize: 11.5, fontWeight: '700' },
  car: { width: 50, height: 50 },
});
