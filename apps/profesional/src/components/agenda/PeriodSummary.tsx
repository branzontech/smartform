import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { Cita } from '@kerhub/core/agenda';
import { LoadRing } from '@/components/LoadRing';
import { Icon3D } from '@/components/Icon3D';
import { colors } from '@/theme';
import { activeCitas } from './load';

/** Resumen de la semana o el mes: cuántas citas, cuántas atendidas y dónde. */
export function PeriodSummary({ citas, label }: { citas: Cita[]; label: string }) {
  const active = activeCitas(citas);
  const done = active.filter((c) => c.estado === 'atendida').length;
  const home = active.filter((c) => c.modalidad === 'domicilio').length;
  const site = active.filter((c) => c.modalidad === 'sede').length;
  const remote = active.filter((c) => c.modalidad === 'telemedicina').length;
  const where = [home && `${home} a domicilio`, site && `${site} en sede`, remote && `${remote} por telemedicina`].filter(Boolean).join(' · ');
  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.card}>
      <LoadRing size={76} stroke={5} progress={active.length ? done / active.length : 0} color={colors.success} track={colors.line}>
        <Text style={styles.ringValue}>
          {done}/{active.length}
        </Text>
        <Text style={styles.ringLabel}>atendidas</Text>
      </LoadRing>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.total}>{active.length === 1 ? '1 cita' : `${active.length} citas`}</Text>
        <Text style={styles.meta}>{label}</Text>
        {where ? <Text style={styles.meta}>{where}</Text> : null}
      </View>
      <Icon3D name="citas" size={52} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 14 },
  ringValue: { fontSize: 16, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  ringLabel: { fontSize: 9, color: colors.muted, marginTop: -2 },
  total: { fontSize: 22, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
});
