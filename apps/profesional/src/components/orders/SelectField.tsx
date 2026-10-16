import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OptionRow } from '@/components/form/parts';
import { BottomSheet } from '@/components/overlay/BottomSheet';
import { colors, radius } from '@/theme';

/** Campo que se elige de una lista (en una hoja desde abajo, con filas de opción). */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Elegir',
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 4, flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={styles.field} accessibilityRole="button" accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}>
        <Text style={[styles.value, !current && { color: '#a29fae' }]} numberOfLines={1}>
          {current?.label ?? placeholder}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label} size={options.length > 8 ? 'large' : 'auto'}>
        <ScrollView contentContainerStyle={styles.list}>
          {options.map((o) => (
            <OptionRow
              key={o.value}
              label={o.label}
              kind="radio"
              selected={o.value === value}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
            />
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  field: { minHeight: 46, borderRadius: radius.control, backgroundColor: colors.canvas, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { flex: 1, fontSize: 16, color: colors.ink },
  chevron: { fontSize: 20, color: colors.muted, marginTop: -2 },
  list: { gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
});
