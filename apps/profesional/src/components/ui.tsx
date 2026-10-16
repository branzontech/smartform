import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type Variant = 'primary' | 'secondary' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  busy = false,
  disabled = false,
  size = 'md',
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  busy?: boolean;
  disabled?: boolean;
  /** md: botones de pantalla; sm: acciones dentro de una tarjeta. */
  size?: 'sm' | 'md';
}) {
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [styles.button, size === 'sm' && styles.small, styles[variant], pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }, off && { opacity: 0.55 }]}>
      {busy ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} />
      ) : (
        <Text style={[styles.buttonText, size === 'sm' && { fontSize: 14 }, variant !== 'primary' && { color: variant === 'danger' ? colors.danger : colors.primary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 8 },
  button: { minHeight: 42, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  small: { minHeight: 36, borderRadius: 10, paddingHorizontal: 14 },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  danger: { backgroundColor: '#fbeceb' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
