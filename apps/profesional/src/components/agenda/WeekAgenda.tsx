import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { STATE_LABEL, STATE_TONE, localTime, today, type Cita } from '@kerhub/core/agenda';
import { dayOfMonth, formatWeekday } from '@kerhub/core/calendar';
import { Icon3D, MODALITY_ICON } from '@/components/Icon3D';
import { colors, toneColor } from '@/theme';
import { activeCount } from './load';

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

/** La semana día por día: las citas en filas compactas; los días libres en una sola línea. */
export function WeekAgenda({ days, byDay, onOpenDay }: { days: string[]; byDay: Record<string, Cita[]>; onOpenDay: (day: string) => void }) {
  const now = today();
  return (
    <View style={{ gap: 10 }}>
      {days.map((d, i) => {
        const citas = byDay[d] ?? [];
        const isToday = d === now;
        return (
          <Animated.View key={d} entering={FadeInDown.delay(i * 30).duration(220)} style={[styles.day, citas.length === 0 && styles.free]}>
            <Pressable onPress={() => onOpenDay(d)} style={styles.head} accessibilityRole="button">
              <Text style={[styles.dayName, isToday && { color: colors.primary }]}>
                {capitalize(formatWeekday(d))} {dayOfMonth(d)}
                {isToday ? ' · hoy' : ''}
              </Text>
              <Text style={styles.count}>{citas.length === 0 ? 'Libre' : activeCount(citas) === 1 ? '1 cita' : `${activeCount(citas)} citas`}</Text>
            </Pressable>
            {citas.map((c) => (
              <Pressable key={c.id} onPress={() => router.push({ pathname: '/cita/[id]', params: { id: c.id } })} style={styles.row}>
                <Text style={styles.time}>{localTime(c.inicio)}</Text>
                <Icon3D name={MODALITY_ICON[c.modalidad] ?? 'citas'} size={28} />
                <Text style={styles.patient} numberOfLines={1}>
                  {c.paciente}
                </Text>
                <Text style={[styles.state, { color: toneColor[STATE_TONE[c.estado]] }]}>{STATE_LABEL[c.estado]}</Text>
              </Pressable>
            ))}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  day: { backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, gap: 4 },
  free: { backgroundColor: 'transparent', paddingVertical: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  dayName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  count: { fontSize: 13, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  time: { width: 46, fontSize: 14, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  patient: { flex: 1, fontSize: 15, color: colors.ink },
  state: { fontSize: 12, fontWeight: '600' },
});
