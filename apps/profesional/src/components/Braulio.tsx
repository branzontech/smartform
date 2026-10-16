import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

/** Braulio, la mascota de Ker Hub, recortado sin fondo en cuatro poses. */
const POSES = {
  formato: require('../../assets/braulio/formato.png'),
  maletin: require('../../assets/braulio/maletin.png'),
  medicamento: require('../../assets/braulio/medicamento.png'),
  historial: require('../../assets/braulio/historial.png'),
} as const;

/** Relación ancho / alto de cada recorte, para reservar el espacio exacto. */
const RATIO: Record<BraulioPose, number> = { formato: 0.62, maletin: 0.62, medicamento: 0.65, historial: 0.86 };

export type BraulioPose = keyof typeof POSES;

export function Braulio({ pose, height }: { pose: BraulioPose; height: number }) {
  return (
    <Image
      source={POSES[pose]}
      style={{ height, width: height * RATIO[pose] }}
      contentFit="contain"
      transition={250}
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}

/** Pantalla o bloque vacío con Braulio, un título y una línea de ayuda. */
export function BraulioEmpty({ pose, title, hint, height = 150 }: { pose: BraulioPose; title: string; hint?: string; height?: number }) {
  return (
    <View style={styles.empty}>
      <Braulio pose={pose} height={height} />
      <Text style={styles.title}>{title}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 6, paddingVertical: 24, paddingHorizontal: 24 },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center', marginTop: 8 },
  hint: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
