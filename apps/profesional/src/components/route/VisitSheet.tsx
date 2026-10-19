import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { localTime } from '@kerhub/core/agenda';
import { arrivalAt, formatDistance, formatDuration, type Parada } from '@kerhub/core/rutas';
import { colors } from '@/theme';
import { ROUTE_ICONS } from './RouteMap';
import { LimeButton, SheetFrame, TextButton } from './RouteSheets';
import { SlideToConfirm } from './SlideToConfirm';

/**
 * salir:    la próxima visita aún no empieza: «Salir hacia…» (avisa que va en camino).
 * camino:   va en camino: tiempo con tráfico, navegar, llamar y deslizar al llegar.
 * llegada:  llegó: iniciar la atención (o terminar la visita si la empresa no tiene Atención).
 * atencion: la atención ya empezó: continuarla.
 */
export type VisitPhase = 'salir' | 'camino' | 'llegada' | 'atencion';

interface VisitSheetProps {
  stop: Parada;
  number: number;
  total: number;
  phase: VisitPhase;
  /** La empresa tiene el módulo de Atención (formatos y órdenes). */
  withAttention: boolean;
  busy: boolean;
  onDepart: () => void;
  onArrive: () => void;
  onPrimary: () => void;
  onAbsent: () => void;
  onNavigate: () => void;
  onCall: () => void;
  onLayoutHeight?: (h: number) => void;
}

function Action({ label, onPress, strong }: { label: string; onPress: () => void; strong?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.action, strong && styles.actionStrong, pressed && { opacity: 0.8 }]}>
      <Text style={[styles.actionText, strong && { color: colors.primaryDark }]}>{label}</Text>
    </Pressable>
  );
}

export function VisitSheet(props: VisitSheetProps) {
  const { stop, number, total, phase, withAttention, busy } = props;
  const leg = stop.tramo;
  const first = stop.paciente.split(' ').slice(0, 2).join(' ');

  return (
    <SheetFrame onLayoutHeight={props.onLayoutHeight}>
      {phase === 'llegada' || phase === 'atencion' ? (
        <View style={styles.head}>
          <Image source={ROUTE_ICONS.salida} style={{ width: 52, height: 52 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{phase === 'atencion' ? `Atendiendo a ${first}` : `Llegaste donde ${first}`}</Text>
            <Text style={styles.sub}>{phase === 'atencion' ? 'La atención está abierta.' : 'Llegada registrada con tu ubicación.'}</Text>
          </View>
        </View>
      ) : (
        leg && (
          <View style={styles.eta}>
            <Text>
              <Text style={styles.etaBig}>{formatDuration(leg.segundos)}</Text>
              <Text style={styles.sub}> · {formatDistance(leg.metros)}</Text>
            </Text>
            <Text style={styles.sub}>Llegas {arrivalAt(leg.segundos)}</Text>
          </View>
        )
      )}

      <View style={styles.card}>
        <Image source={ROUTE_ICONS.paciente} style={{ width: 48, height: 48 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{stop.paciente}</Text>
          <Text style={styles.sub} numberOfLines={2}>{stop.direccion ?? 'Sin dirección'}</Text>
          <Text style={styles.meta}>Visita {number} de {total} · cita {localTime(stop.inicio)}{stop.servicio ? ` · ${stop.servicio}` : ''}</Text>
        </View>
      </View>

      {(phase === 'salir' || phase === 'camino') && (
        <View style={styles.actions}>
          <Action label="Navegar" onPress={props.onNavigate} strong />
          <Action label="Llamar" onPress={props.onCall} />
        </View>
      )}

      {phase === 'salir' && <LimeButton title={`Salir hacia ${first}`} onPress={props.onDepart} busy={busy} />}
      {phase === 'camino' && <SlideToConfirm label="Desliza cuando llegues" onConfirm={props.onArrive} busy={busy} />}
      {phase === 'llegada' && (
        <>
          {!withAttention && <Text style={styles.note}>Tu empresa maneja agenda y rutas: marca la visita como hecha y sigue con la próxima.</Text>}
          <LimeButton title={withAttention ? 'Iniciar atención' : 'Terminar visita'} onPress={props.onPrimary} busy={busy} />
        </>
      )}
      {phase === 'atencion' && <LimeButton title="Continuar atención" onPress={props.onPrimary} busy={busy} />}
      {(phase === 'camino' || phase === 'llegada' || phase === 'salir') && <TextButton title="El paciente no estaba" onPress={props.onAbsent} />}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: colors.muted },
  meta: { fontSize: 12.5, color: colors.muted, marginTop: 1 },
  eta: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  etaBig: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.canvas, borderRadius: 18, padding: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, height: 44, borderRadius: 14, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  actionStrong: { backgroundColor: colors.primarySoft },
  actionText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  note: { fontSize: 13, color: colors.muted },
});
