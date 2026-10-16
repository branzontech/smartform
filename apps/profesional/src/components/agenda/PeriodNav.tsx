import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

/** Título del periodo con flechas; tocar el título vuelve a hoy. */
export function PeriodNav({ label, hint, onPrev, onNext, onToday }: { label: string; hint?: string; onPrev: () => void; onNext: () => void; onToday: () => void }) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityLabel="Anterior" onPress={onPrev} style={styles.btn} hitSlop={8}>
        <Text style={styles.arrow}>‹</Text>
      </Pressable>
      <Pressable onPress={onToday} style={{ flex: 1 }} accessibilityRole="button" accessibilityHint="Vuelve a hoy">
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </Pressable>
      <Pressable accessibilityLabel="Siguiente" onPress={onNext} style={styles.btn} hitSlop={8}>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 24, color: colors.primary, marginTop: -3 },
  label: { fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  hint: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
