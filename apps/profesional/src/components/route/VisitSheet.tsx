import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { localTime } from '@kerhub/core/agenda';
import { arrivalAt, formatDistance, formatDuration, trafficDelay, type Camino, type Parada } from '@kerhub/core/rutas';
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
  /** Camino en vivo hasta esta visita y sus alternas (si ya se calculó). */
  leg: { principal: Camino; alternativas: Camino[] } | null;
  selectedAlt: number | null;
  onSelectAlt: (i: number | null) => void;
  /** Las visitas que siguen después de esta, con su hora de cita y de llegada estimada. */
  upcoming: { id: string; paciente: string; hora: string; eta: string | null }[];
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
  const live = props.leg;
  const chosen = live ? (props.selectedAlt != null ? live.alternativas[props.selectedAlt] : undefined) ?? live.principal : null;
  const leg = chosen ? { segundos: chosen.segundos, metros: chosen.metros } : stop.tramo;
  const delay = chosen ? trafficDelay(chosen) : null;
  const options = live ? [live.principal, ...live.alternativas] : [];
  const first = stop.paciente.split(' ').slice(0, 2).join(' ');
  // Minimizada: solo la acción principal, para ver el mapa completo.
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SheetFrame onLayoutHeight={props.onLayoutHeight} collapsed={collapsed} onCollapse={setCollapsed}>
      {!collapsed && (
        <>
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
      {(phase === 'salir' || phase === 'camino') && delay && <Text style={styles.delay}>{delay}</Text>}

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

      {(phase === 'salir' || phase === 'camino') && options.length > 1 && (
        <View style={styles.routes}>
          {options.map((o, i) => {
            const index = i === 0 ? null : i - 1;
            const on = props.selectedAlt === index;
            return (
              <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => props.onSelectAlt(index)} style={[styles.route, on && styles.routeOn]}>
                <Text style={[styles.routeTime, on && { color: colors.primaryDark }]}>{formatDuration(o.segundos)}</Text>
                <Text style={styles.routeName} numberOfLines={1}>{i === 0 ? 'Recomendada' : 'Alterna'}{o.descripcion ? ` · ${o.descripcion}` : ''}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {props.upcoming.length > 0 && (
        <View style={styles.after}>
          <Text style={styles.afterTitle}>Después</Text>
          {props.upcoming.slice(0, 3).map((u) => (
            <View key={u.id} style={styles.afterRow}>
              <Text style={styles.afterName} numberOfLines={1}>{u.paciente}</Text>
              <Text style={styles.afterTime}>cita {u.hora}{u.eta ? ` · llegas ${u.eta}` : ''}</Text>
            </View>
          ))}
          {props.upcoming.length > 3 && <Text style={styles.afterTime}>y {props.upcoming.length - 3} más</Text>}
        </View>
      )}

        </>
      )}

      {phase === 'salir' && <LimeButton title={`Salir hacia ${first}`} onPress={props.onDepart} busy={busy} />}
      {phase === 'camino' && <SlideToConfirm label="Desliza cuando llegues" onConfirm={props.onArrive} busy={busy} />}
      {phase === 'llegada' && (
        <>
          {!withAttention && !collapsed && <Text style={styles.note}>Tu empresa maneja agenda y rutas: marca la visita como hecha y sigue con la próxima.</Text>}
          <LimeButton title={withAttention ? 'Iniciar atención' : 'Terminar visita'} onPress={props.onPrimary} busy={busy} />
        </>
      )}
      {phase === 'atencion' && <LimeButton title="Continuar atención" onPress={props.onPrimary} busy={busy} />}
      {!collapsed && (phase === 'camino' || phase === 'llegada' || phase === 'salir') && <TextButton title="El paciente no estaba" onPress={props.onAbsent} />}
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
  delay: { fontSize: 13, fontWeight: '600', color: '#c2410c', marginTop: -8 },
  routes: { flexDirection: 'row', gap: 6 },
  after: { gap: 4 },
  afterTitle: { fontSize: 12.5, fontWeight: '700', color: colors.muted },
  afterRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  afterName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  afterTime: { fontSize: 12.5, color: colors.muted },
  route: { flex: 1, borderRadius: 14, backgroundColor: colors.canvas, paddingVertical: 8, paddingHorizontal: 10, gap: 1 },
  routeOn: { backgroundColor: colors.primarySoft },
  routeTime: { fontSize: 15, fontWeight: '800', color: colors.ink },
  routeName: { fontSize: 11.5, color: colors.muted },
});
