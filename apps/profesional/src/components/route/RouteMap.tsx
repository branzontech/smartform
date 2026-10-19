import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type EdgePadding } from 'react-native-maps';
import { decodePolyline, isLocated, isPending, trafficSegments, type Camino, type Parada, type TraficoTramo, type Velocidad } from '@kerhub/core/rutas';
import { colors } from '@/theme';

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
  const { paradas, route, leg, selectedAlt, onSelectAlt, etas, targetLabel, position, targetId, bottomInset } = props;
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
      showsTraffic
      showsPointsOfInterests={false}
      showsBuildings={false}
      showsCompass={false}
      toolbarEnabled={false}
      pitchEnabled={false}>
      {/* El resto del recorrido, tenue cuando hay un camino resaltado a la próxima visita. */}
      {route && <TrafficLine polilinea={route.polilinea} trafico={route.trafico} faded={!!leg} width={5} />}
      {leg?.alternativas.map((alt, i) =>
        i === selectedAlt ? null : (
          <Polyline key={`alt-${i}`} coordinates={alt.polilinea ? decodePolyline(alt.polilinea) : []} strokeColor={ALT_COLOR} strokeWidth={5} lineCap="round" tappable onPress={() => onSelectAlt(i)} />
        ),
      )}
      {selectedAlt != null && leg && (
        <Polyline coordinates={leg.principal.polilinea ? decodePolyline(leg.principal.polilinea) : []} strokeColor={ALT_COLOR} strokeWidth={5} lineCap="round" tappable onPress={() => onSelectAlt(null)} />
      )}
      {shown && <TrafficLine polilinea={shown.polilinea} trafico={shown.trafico} width={6} />}

      {located.map((p, i) => {
        const done = !isPending(p);
        const target = p.id === targetId;
        return (
          <Marker key={p.id} coordinate={{ latitude: p.latitud!, longitude: p.longitud! }} anchor={{ x: 0.5, y: 1 }} zIndex={target ? 10 : done ? 1 : 5}>
            <View style={[styles.pin, done && { opacity: 0.45 }]}>
              {target && targetLabel ? (
                <View style={styles.bubble}>
                  <Text style={styles.bubbleText}>{targetLabel}</Text>
                </View>
              ) : etas[p.id] && !done ? (
                <View style={styles.eta}>
                  <Text style={styles.etaText}>{etas[p.id]}</Text>
                </View>
              ) : null}
              <View>
                <Image source={ROUTE_ICONS.visita} style={target ? styles.pinTarget : styles.pinImage} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{done ? '✓' : String(i + 1)}</Text>
                </View>
              </View>
            </View>
          </Marker>
        );
      })}
      {position && (
        <Marker coordinate={{ latitude: position.latitud, longitude: position.longitud }} anchor={{ x: 0.5, y: 0.5 }} zIndex={20}>
          <Image source={ROUTE_ICONS.carro} style={styles.car} accessibilityLabel="Tu ubicación" />
        </Marker>
      )}
    </MapView>
  );
});

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  pin: { alignItems: 'center', gap: 2 },
  pinImage: { width: 42, height: 42 },
  pinTarget: { width: 54, height: 54 },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
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
