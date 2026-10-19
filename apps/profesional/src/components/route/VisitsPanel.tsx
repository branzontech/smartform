import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { colors } from '@/theme';
import { ROUTE_ICONS } from './RouteMap';

export interface VisitRow {
  id: string;
  num: number;
  paciente: string;
  /** Hora de la cita. */
  hora: string;
  /** Hora estimada de llegada, si la ruta ya se calculó. */
  eta: string | null;
  /** Minutos que llegaría tarde a la cita (0 si a tiempo). */
  tarde: number;
  hecha: boolean;
  estado: string;
}

/** Alto máximo del panel: con muchas visitas se desplaza por dentro, el mapa no se tapa. */
const PANEL_MAX = 380;

/**
 * El botón de arriba («Hoy · 3 visitas») despliega todas las visitas del día
 * en el orden de la ruta: número, paciente, hora de cita y de llegada. Así
 * caben 3 o 30 sin ocupar la pantalla; tocar una centra el mapa en ella.
 */
export function VisitsPanel({ title, subtitle, rows, open, onToggle, onSelect }: {
  title: string;
  subtitle: string;
  rows: VisitRow[];
  open: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={{ flex: 1, gap: 8 }} pointerEvents="box-none">
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={({ pressed }) => [styles.pill, pressed && { opacity: 0.9 }]}>
        <Image source={ROUTE_ICONS.profesional} style={{ width: 28, height: 28 }} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>
        <Text style={[styles.chevron, open && { transform: [{ rotate: '180deg' }] }]}>⌄</Text>
      </Pressable>
      {open && (
        <Animated.View entering={FadeInUp.duration(180)} exiting={FadeOutUp.duration(140)} style={styles.panel}>
          <ScrollView style={{ maxHeight: PANEL_MAX }} contentContainerStyle={{ paddingVertical: 6 }}>
            {rows.map((r) => (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                onPress={() => onSelect(r.id)}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.canvas }, r.hecha && { opacity: 0.5 }]}>
                <View style={styles.num}>
                  <Text style={styles.numText}>{r.hecha ? '✓' : r.num}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name} numberOfLines={1}>{r.paciente}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    cita {r.hora}
                    {r.hecha ? ` · ${r.estado}` : r.eta ? ` · llegas ${r.eta}` : ''}
                  </Text>
                </View>
                {r.tarde > 0 && !r.hecha && <Text style={styles.late}>{r.tarde} min tarde</Text>}
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const shadow = { shadowColor: '#14121c', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 };

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 22, paddingVertical: 8, paddingLeft: 8, paddingRight: 12, maxWidth: '100%', ...shadow },
  title: { fontSize: 14, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, flexShrink: 1 },
  chevron: { fontSize: 16, color: colors.muted, marginTop: -6 },
  panel: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 6, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 9, borderRadius: 14 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 12.5, fontWeight: '800', color: colors.primaryDark },
  name: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 12.5, color: colors.muted },
  late: { fontSize: 12, fontWeight: '700', color: '#c2410c' },
});
