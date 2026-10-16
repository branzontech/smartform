import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

/** Título grande de cada pestaña, con una línea opcional debajo. */
export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  title: { fontSize: 32, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.muted },
})
