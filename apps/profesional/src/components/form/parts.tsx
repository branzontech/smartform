import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import type { QuestionData } from '@kerhub/core/forms';
import { colors, radius } from '@/theme';

export const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

/** Número escrito con coma (teclado en español) guardado con punto. */
export const decimal = (v: string) => v.replace(',', '.');

export function Label({ q, title }: { q: QuestionData; title?: string }) {
  return (
    <Text style={styles.label}>
      {title ?? q.title}
      {q.required ? <Text style={{ color: colors.primary }}> *</Text> : null}
    </Text>
  );
}

export function Field({ readOnly, style, ...props }: TextInputProps & { readOnly?: boolean }) {
  return (
    <TextInput
      editable={!readOnly}
      placeholderTextColor="#a29fae"
      style={[styles.field, props.multiline && styles.area, props.multiline && !readOnly && styles.areaCap, readOnly && { color: colors.muted }, style]}
      {...props}
    />
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <Text style={styles.notice}>{children}</Text>;
}

/** Fila de opción (radio o casilla), con contenido opcional a la derecha. */
export function OptionRow({
  label,
  selected,
  kind,
  onPress,
  right,
  disabled,
}: {
  label: string;
  selected: boolean;
  kind: 'radio' | 'check';
  onPress: () => void;
  right?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={kind === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected, disabled }}
      style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && { opacity: 0.85 }]}>
      <View style={[kind === 'radio' ? styles.radio : styles.check, selected && styles.markOn]}>
        {selected ? kind === 'radio' ? <View style={styles.radioDot} /> : <Text style={styles.tick}>✓</Text> : null}
      </View>
      <Text style={styles.rowText}>{label}</Text>
      {right}
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: '700', color: colors.ink },
  field: { minHeight: 48, borderRadius: radius.control, backgroundColor: colors.canvas, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.ink },
  area: { minHeight: 110, textAlignVertical: 'top' },
  /** Un texto largo pegado crece hasta ~8 líneas y luego se desplaza dentro de su caja. */
  areaCap: { maxHeight: 200 },
  notice: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, borderRadius: radius.control, backgroundColor: colors.canvas, paddingHorizontal: 12, paddingVertical: 10 },
  rowSelected: { backgroundColor: colors.primarySoft },
  rowText: { flex: 1, fontSize: 15, color: colors.ink },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#b9b5c6', alignItems: 'center', justifyContent: 'center' },
  check: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: '#b9b5c6', alignItems: 'center', justifyContent: 'center' },
  markOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  tick: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: -1 },
});
