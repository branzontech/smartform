import { Pressable, StyleSheet, Text, View } from 'react-native';
import { today, type Cita } from '@kerhub/core/agenda';
import { WEEKDAY_INITIALS, dayOfMonth, formatWeekday } from '@kerhub/core/calendar';
import { LoadRing } from '@/components/LoadRing';
import { colors } from '@/theme';
import { DAY_FULL, activeCount } from './load';

/** Franja de la semana: cada día con un anillo que se llena según sus citas. */
export function WeekStrip({ days, selected, byDay, onSelect }: { days: string[]; selected: string; byDay: Record<string, Cita[]>; onSelect: (day: string) => void }) {
  const now = today();
  return (
    <View style={styles.row}>
      {days.map((d, i) => {
        const count = activeCount(byDay[d]);
        const isSelected = d === selected;
        const isToday = d === now;
        return (
          <Pressable
            key={d}
            onPress={() => onSelect(d)}
            style={styles.cell}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${formatWeekday(d)} ${dayOfMonth(d)}, ${count === 1 ? '1 cita' : `${count} citas`}`}>
            <Text style={[styles.weekday, isSelected && { color: colors.primary }]}>{WEEKDAY_INITIALS[i]}</Text>
            <LoadRing size={42} progress={count / DAY_FULL} color={colors.primary} track={colors.line}>
              <View style={[styles.num, isSelected && styles.numSelected]}>
                <Text style={[styles.numText, isToday && !isSelected && styles.today, isSelected && { color: '#fff' }]}>{dayOfMonth(d)}</Text>
              </View>
            </LoadRing>
            <Text style={styles.count}>{count > 0 ? count : ' '}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 6 },
  cell: { flex: 1, alignItems: 'center', gap: 4 },
  weekday: { fontSize: 12, fontWeight: '600', color: colors.muted },
  num: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  numSelected: { backgroundColor: colors.primary },
  numText: { fontSize: 15, fontWeight: '600', color: colors.ink, fontVariant: ['tabular-nums'] },
  today: { color: colors.primary, fontWeight: '800' },
  count: { fontSize: 11, color: colors.muted, fontVariant: ['tabular-nums'] },
});
