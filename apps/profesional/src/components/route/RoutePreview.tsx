import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { arrivalAt, decodePolyline, formatDistance, formatDuration, navigationLinks, trafficDelay } from '@kerhub/core/rutas';
import { errorMessage, rutas } from '@/lib/api';
import { currentPosition } from '@/lib/location';
import { showAlert } from '@/components/overlay/Overlay';
import { Card } from '@/components/ui';
import { colors } from '@/theme';
import { ROUTE_ICONS, TrafficLine } from './RouteMap';
import { callPhone, openDirections, openLink } from '@/lib/links';

interface RoutePreviewProps {
  citaId: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
  telefono: string | null;
  /** La empresa tiene el módulo de rutas: camino con tráfico; sin él, solo el punto en el mapa. */
  withRoutes: boolean;
}

const MAP_HEIGHT = 190;

const openByText = (address: string) => void openDirections(address);

/**
 * Vista previa del camino en la ficha de una visita a domicilio: el mapa con
 * tu posición, el destino y el camino con el tráfico de ahora; el tiempo, la
 * hora de llegada y navegar con la app que prefieras.
 */
export function RoutePreview({ citaId, latitud, longitud, direccion, telefono, withRoutes }: RoutePreviewProps) {
  const map = useRef<MapView>(null);
  const [position, setPosition] = useState<{ latitud: number; longitud: number } | null>(null);
  const located = latitud != null && longitud != null;

  useEffect(() => {
    void currentPosition().then(setPosition);
  }, []);

  const leg = useQuery({
    queryKey: ['rutas', 'camino', citaId],
    enabled: withRoutes && located && !!position,
    queryFn: () => rutas.fetchLegToCita(citaId, position!),
    staleTime: 60_000,
  });

  const fit = () => {
    if (!located) return;
    const points = [
      { latitude: Number(latitud), longitude: Number(longitud) },
      ...(position ? [{ latitude: position.latitud, longitude: position.longitud }] : []),
      ...(leg.data?.polilinea ? decodePolyline(leg.data.polilinea) : []),
    ];
    map.current?.fitToCoordinates(points, { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: false });
  };
  useEffect(fit, [leg.data, position, located]);

  const navigate = () => {
    if (!located) return openByText(direccion ?? '');
    const links = navigationLinks({ latitud: Number(latitud), longitud: Number(longitud) });
    showAlert('Navegar con', direccion ?? undefined, [
      { text: 'Google Maps', onPress: () => void openLink(links.google) },
      { text: 'Waze', onPress: () => void openLink(links.waze) },
      { text: 'Mapas de Apple', onPress: () => void openLink(links.apple) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const delay = leg.data ? trafficDelay(leg.data) : null;

  return (
    <Card style={{ gap: 10 }}>
      <Text style={styles.label}>Cómo llegar</Text>
      {located ? (
        <View style={styles.mapBox} pointerEvents="none">
          <MapView
            ref={map}
            style={styles.map}
            initialRegion={{ latitude: Number(latitud), longitude: Number(longitud), latitudeDelta: 0.03, longitudeDelta: 0.03 }}
            mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
            showsTraffic
            showsPointsOfInterests={false}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            onMapReady={fit}>
            {leg.data && <TrafficLine polilinea={leg.data.polilinea} trafico={leg.data.trafico} width={5} />}
            <Marker coordinate={{ latitude: Number(latitud), longitude: Number(longitud) }} anchor={{ x: 0.5, y: 1 }}>
              <Image source={ROUTE_ICONS.visita} style={{ width: 40, height: 40 }} />
            </Marker>
            {position && (
              <Marker coordinate={{ latitude: position.latitud, longitude: position.longitud }} anchor={{ x: 0.5, y: 0.5 }}>
                <Image source={ROUTE_ICONS.carro} style={{ width: 40, height: 40 }} />
              </Marker>
            )}
          </MapView>
        </View>
      ) : (
        <Text style={styles.meta}>Esta dirección aún no está en el mapa.</Text>
      )}

      {leg.isLoading && withRoutes && located && position ? (
        <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} />
      ) : leg.data ? (
        <View style={{ gap: 2 }}>
          <Text style={styles.eta}>
            {formatDuration(leg.data.segundos)} <Text style={styles.meta}>· {formatDistance(leg.data.metros)} · llegas {arrivalAt(leg.data.segundos)}</Text>
          </Text>
          {leg.data.descripcion && <Text style={styles.meta}>Por {leg.data.descripcion}{leg.data.alternativas.length ? ` · ${leg.data.alternativas.length} ${leg.data.alternativas.length === 1 ? 'ruta alterna' : 'rutas alternas'}` : ''}</Text>}
          {delay && <Text style={styles.delay}>{delay}</Text>}
        </View>
      ) : leg.isError ? (
        <Text style={styles.meta}>{errorMessage(leg.error)}</Text>
      ) : null}

      {direccion && <Text style={styles.body}>{direccion}</Text>}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={navigate} style={({ pressed }) => [styles.action, styles.actionStrong, pressed && { opacity: 0.8 }]}>
          <Text style={[styles.actionText, { color: colors.primaryDark }]}>Navegar</Text>
        </Pressable>
        {telefono && (
          <Pressable accessibilityRole="button" onPress={() => void callPhone(telefono)} style={({ pressed }) => [styles.action, pressed && { opacity: 0.8 }]}>
            <Text style={styles.actionText}>Llamar</Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  mapBox: { height: MAP_HEIGHT, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.canvas },
  map: { flex: 1 },
  eta: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  meta: { fontSize: 14, color: colors.muted, fontWeight: '400', letterSpacing: 0 },
  delay: { fontSize: 13, fontWeight: '600', color: '#c2410c' },
  body: { fontSize: 15, color: colors.ink },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, height: 44, borderRadius: 14, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  actionStrong: { backgroundColor: colors.primarySoft },
  actionText: { fontSize: 14, fontWeight: '700', color: colors.ink },
});
