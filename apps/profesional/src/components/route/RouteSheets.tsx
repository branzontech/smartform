import type { ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localTime } from '@kerhub/core/agenda';
import { formatDistance, formatDuration, isLocated, isPending, type Parada, type Ruta } from '@kerhub/core/rutas';
import { colors } from '@/theme';
import { ROUTE_ICONS } from './RouteMap';

/** Hoja fija abajo, sobre el mapa (no es una ventana: el mapa sigue a la vista). */
export function SheetFrame({ children, onLayoutHeight }: { children: ReactNode; onLayoutHeight?: (h: number) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      onLayout={(e) => onLayoutHeight?.(e.nativeEvent.layout.height)}
      style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.grip} />
      {children}
    </Animated.View>
  );
}

/** Botón principal de la ruta: lima con texto violeta (acento de acción de la marca). */
export function LimeButton({ title, onPress, busy }: { title: string; onPress: () => void; busy?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.lime, pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }, busy && { opacity: 0.7 }]}>
      {busy ? <ActivityIndicator color={colors.primaryDark} /> : <Text style={styles.limeText}>{title}</Text>}
    </Pressable>
  );
}

export function TextButton({ title, onPress, tone = 'muted' }: { title: string; onPress: () => void; tone?: 'muted' | 'danger' }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.textButton, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.textButtonText, tone === 'danger' && { color: colors.danger }]}>{title}</Text>
    </Pressable>
  );
}

/** Resumen antes de salir: visitas del día en orden, distancia y tiempo, e «Iniciar ruta». */
export function SummarySheet({ paradas, ruta, busy, onStart, onLayoutHeight }: {
  paradas: Parada[];
  ruta: Ruta | null;
  busy: boolean;
  onStart: () => void;
  onLayoutHeight?: (h: number) => void;
}) {
  const pending = paradas.filter(isPending);
  const unlocated = pending.filter((p) => !isLocated(p)).length;
  const stats = [`${pending.length} ${pending.length === 1 ? 'visita' : 'visitas'}`, ruta?.distanciaM ? formatDistance(ruta.distanciaM) : null, ruta?.duracionS ? `${formatDuration(ruta.duracionS)} manejando` : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <SheetFrame onLayoutHeight={onLayoutHeight}>
      <View style={styles.head}>
        <Image source={ROUTE_ICONS.reloj} style={styles.headIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tu ruta de hoy</Text>
          <Text style={styles.sub}>{stats}</Text>
        </View>
      </View>
      <View style={{ gap: 2 }}>
        {pending.slice(0, 5).map((p, i) => (
          <View key={p.id} style={styles.row}>
            <View style={styles.num}><Text style={styles.numText}>{i + 1}</Text></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>{p.paciente}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{localTime(p.inicio)} · {p.direccion ?? 'Sin dirección'}</Text>
            </View>
            {!isLocated(p) && <Text style={styles.warn}>Sin ubicar</Text>}
          </View>
        ))}
        {pending.length > 5 && <Text style={styles.more}>y {pending.length - 5} más</Text>}
      </View>
      <Text style={styles.note}>
        {unlocated > 0
          ? `${unlocated === 1 ? 'Una dirección no está' : `${unlocated} direcciones no están`} en el mapa: esas visitas quedan por fuera del recorrido.`
          : 'En el orden de tus citas, con el tráfico de ahora. Tu IPS ve tu avance mientras la ruta está activa.'}
      </Text>
      <LimeButton title="Iniciar ruta" onPress={onStart} busy={busy} />
    </SheetFrame>
  );
}

/** Todas las visitas resueltas: resumen del día y cerrar la ruta. */
export function FinishedSheet({ paradas, ruta, busy, closed, onFinish, onLayoutHeight }: {
  paradas: Parada[];
  ruta: Ruta | null;
  busy: boolean;
  closed: boolean;
  onFinish: () => void;
  onLayoutHeight?: (h: number) => void;
}) {
  const attended = paradas.filter((p) => p.estado === 'atendida').length;
  const absent = paradas.filter((p) => p.estado === 'no_asistio').length;
  const minutes = ruta ? Math.max(1, Math.round(((ruta.terminadaAt ? Date.parse(ruta.terminadaAt) : Date.now()) - Date.parse(ruta.iniciadaAt)) / 60000)) : 0;
  return (
    <SheetFrame onLayoutHeight={onLayoutHeight}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Image source={ROUTE_ICONS.llegada} style={{ width: 64, height: 64 }} />
        <Text style={styles.title}>{closed ? 'Ruta terminada' : 'Terminaste tus visitas'}</Text>
        <Text style={styles.sub}>{paradas.length} {paradas.length === 1 ? 'visita' : 'visitas'}{ruta?.distanciaM ? ` · ${formatDistance(ruta.distanciaM)}` : ''}{minutes ? ` · ${formatDuration(minutes * 60)} en total` : ''}</Text>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statValue}>{attended}</Text><Text style={styles.statLabel}>Atendidas</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{absent}</Text><Text style={styles.statLabel}>No estaba</Text></View>
      </View>
      {!closed && <LimeButton title="Terminar ruta" onPress={onFinish} busy={busy} />}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 14,
    shadowColor: '#14121c',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 16,
  },
  grip: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIcon: { width: 44, height: 44 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 13, fontWeight: '800', color: colors.primaryDark },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  rowSub: { fontSize: 13, color: colors.muted },
  warn: { fontSize: 12.5, fontWeight: '700', color: colors.warning },
  more: { fontSize: 13, color: colors.muted, paddingLeft: 40 },
  note: { fontSize: 12.5, color: colors.muted, marginTop: -4 },
  lime: { height: 50, borderRadius: 16, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  limeText: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  textButton: { height: 40, alignItems: 'center', justifyContent: 'center' },
  textButtonText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.canvas, borderRadius: 16, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.muted },
});
