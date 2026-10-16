import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OptionRow } from '@/components/form/parts';
import { Button } from '@/components/ui';
import { colors, radius } from '@/theme';

/** Campo que se elige de una lista (en una hoja con filas de opción, sin chips). */
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
  const insets = useSafeAreaInsets();
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
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.title}>{label}</Text>
          <ScrollView contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
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
          <Button title="Cerrar" variant="secondary" onPress={() => setOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  field: { minHeight: 48, borderRadius: radius.control, backgroundColor: colors.canvas, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { flex: 1, fontSize: 16, color: colors.ink },
  chevron: { fontSize: 20, color: colors.muted, marginTop: -2 },
  sheet: { flex: 1, backgroundColor: colors.canvas, padding: 16, paddingTop: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
});
