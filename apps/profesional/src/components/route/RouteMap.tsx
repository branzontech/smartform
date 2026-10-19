import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type EdgePadding } from 'react-native-maps';
import { decodePolyline, isLocated, isPending, type Parada } from '@kerhub/core/rutas';
import { colors } from '@/theme';

export const ROUTE_ICONS = {
  carro: require('../../../assets/rutas/carro.png'),
  visita: require('../../../assets/rutas/visita.png'),
  llegada: require('../../../assets/rutas/llegada.png'),
  salida: require('../../../assets/rutas/salida.png'),
  reloj: require('../../../assets/rutas/reloj.png'),
  paciente: require('../../../assets/rutas/paciente.png'),
  profesional: require('../../../assets/rutas/profesional.png'),
};

/** Cartagena: donde se centra el mapa mientras llegan los datos. */
const DEFAULT_REGION = { latitude: 10.4, longitude: -75.51, latitudeDelta: 0.12, longitudeDelta: 0.12 };

export interface RouteMapHandle {
  /** Encuadra la ruta completa (o los puntos que se le pasen). */
  fit: (only?: { latitude: number; longitude: number }[]) => void;
}

interface RouteMapProps {
  paradas: Parada[];
  polilinea: string | null;
  position: { latitud: number; longitud: number } | null;
  targetId: string | null;
  /** Espacio que ocupa la hoja de abajo, para no tapar la ruta al encuadrar. */
  bottomInset: number;
}

/**
 * Mapa a pantalla completa, como en las apps de transporte: mapa sobrio, el
 * recorrido en el color de la marca, cada visita con su pin 3D numerado y el
 * profesional con su carro. Las visitas hechas se atenúan.
 */
export const RouteMap = forwardRef<RouteMapHandle, RouteMapProps>(function RouteMap({ paradas, polilinea, position, targetId, bottomInset }, ref) {
  const map = useRef<MapView>(null);
  const line = useMemo(() => (polilinea ? decodePolyline(polilinea) : []), [polilinea]);
  const located = paradas.filter(isLocated);

  const padding: EdgePadding = { top: 120, right: 50, bottom: bottomInset + 30, left: 50 };
  useImperativeHandle(ref, () => ({
    fit: (only) => {
      const points = only ?? [
        ...located.map((p) => ({ latitude: p.latitud!, longitude: p.longitud! })),
        ...(position ? [{ latitude: position.latitud, longitude: position.longitud }] : []),
        ...line,
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
      showsPointsOfInterests={false}
      showsBuildings={false}
      showsTraffic={false}
      showsCompass={false}
      toolbarEnabled={false}
      pitchEnabled={false}>
      {line.length > 1 && <Polyline coordinates={line} strokeColor="#ffffff" strokeWidth={9} />}
      {line.length > 1 && <Polyline coordinates={line} strokeColor={colors.primary} strokeWidth={5} />}
      {located.map((p, i) => {
        const done = !isPending(p);
        const target = p.id === targetId;
        return (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitud!, longitude: p.longitud! }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            zIndex={target ? 10 : done ? 1 : 5}>
            <View style={[styles.pin, done && { opacity: 0.45 }]}>
              <Image source={ROUTE_ICONS.visita} style={target ? styles.pinTarget : styles.pinImage} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{done ? '✓' : String(i + 1)}</Text>
              </View>
            </View>
          </Marker>
        );
      })}
      {position && (
        <Marker coordinate={{ latitude: position.latitud, longitude: position.longitud }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false} zIndex={20}>
          <Image source={ROUTE_ICONS.carro} style={styles.car} accessibilityLabel="Tu ubicación" />
        </Marker>
      )}
    </MapView>
  );
});

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  pin: { alignItems: 'center' },
  pinImage: { width: 40, height: 40 },
  pinTarget: { width: 52, height: 52 },
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
  car: { width: 50, height: 50 },
});
