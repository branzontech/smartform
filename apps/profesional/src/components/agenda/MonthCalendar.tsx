import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { today, type Cita } from '@kerhub/core/agenda';
import { WEEKDAY_INITIALS, dayOfMonth, formatWeekday, monthStart, sameMonth } from '@kerhub/core/calendar';
import { LoadRing } from '@/components/LoadRing';
import { colors } from '@/theme';
import { DAY_FULL, activeCount } from './load';

/** Calendario del mes: cada día con su anillo de carga; al tocarlo se abre ese día. */
export function MonthCalendar({ weeks, reference, byDay, onSelect }: { weeks: string[][]; reference: string; byDay: Record<string, Cita[]>; onSelect: (day: string) => void }) {
  const now = today();
  return (
    <Animated.View key={monthStart(reference)} entering={FadeIn.duration(260)} style={styles.card}>
      <View style={styles.row}>
        {WEEKDAY_INITIALS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0]} style={styles.row}>
          {week.map((d) => {
            const count = activeCount(byDay[d]);
            const inMonth = sameMonth(d, reference);
            const isToday = d === now;
            return (
              <Pressable
                key={d}
                onPress={() => onSelect(d)}
                style={[styles.cell, !inMonth && { opacity: 0.3 }]}
                accessibilityRole="button"
                accessibilityLabel={`${formatWeekday(d)} ${dayOfMonth(d)}, ${count === 1 ? '1 cita' : `${count} citas`}`}>
                <LoadRing size={38} progress={count / DAY_FULL} color={colors.primary} track={count ? colors.line : 'transparent'}>
                  <View style={[styles.num, isToday && styles.todayBg]}>
                    <Text style={[styles.numText, isToday && { color: '#fff' }]}>{dayOfMonth(d)}</Text>
                  </View>
                </LoadRing>
                <Text style={styles.count}>{count > 0 ? count : ' '}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 10, gap: 4 },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: colors.muted, paddingVertical: 4 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  num: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  todayBg: { backgroundColor: colors.primary },
  numText: { fontSize: 14, fontWeight: '600', color: colors.ink, fontVariant: ['tabular-nums'] },
  count: { fontSize: 10, color: colors.muted, fontVariant: ['tabular-nums'] },
});
