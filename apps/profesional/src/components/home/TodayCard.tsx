import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { MODALITY_LABEL, localTime, today } from '@kerhub/core/agenda';
import { agenda } from '@/lib/api';
import { Braulio } from '@/components/Braulio';
import { CLOSED_STATES } from '@/components/CitaCard';
import { colors } from '@/theme';

/** Tarjeta de hoy: cuántas citas quedan y cuál es la próxima. Lleva a Mi día. */
export function TodayCard() {
  const day = today();
  const query = useQuery({ queryKey: ['agenda', 'mi-dia', day], queryFn: () => agenda.fetchMyDay(day) });
  const citas = (query.data?.citas ?? []).filter((c) => !CLOSED_STATES.includes(c.estado));
  const now = Date.now();
  const pending = citas.filter((c) => c.estado !== 'atendida' && new Date(c.fin).getTime() > now);
  const next = pending[0];

  const title = query.isLoading
    ? 'Cargando tu día…'
    : citas.length === 0
      ? 'Hoy no tienes citas'
      : pending.length === 0
        ? 'Terminaste las citas de hoy'
        : pending.length === 1
          ? 'Te queda 1 cita hoy'
          : `Te quedan ${pending.length} citas hoy`;

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)}>
      <Pressable onPress={() => router.push('/mi-dia')} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]} accessibilityRole="button">
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.title}>{title}</Text>
          {next ? (
            <Text style={styles.next} numberOfLines={2}>
              Próxima: {localTime(next.inicio)} · {next.paciente}
              {'\n'}
              {MODALITY_LABEL[next.modalidad]}
            </Text>
          ) : null}
          <Text style={styles.link}>Ver mi día ›</Text>
        </View>
        <Braulio pose="maletin" height={104} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primary, borderRadius: 22, paddingVertical: 16, paddingLeft: 18, paddingRight: 10 },
  title: { fontSize: 19, fontWeight: '800', color: '#fff' },
  next: { fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 20 },
  link: { fontSize: 14, fontWeight: '700', color: colors.lime, marginTop: 2 },
});
