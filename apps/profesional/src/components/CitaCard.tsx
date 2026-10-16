import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MODALITY_LABEL, STATE_LABEL, STATE_TONE, localTime, type Cita } from '@kerhub/core/agenda';
import { CitaActions } from './CitaActions';
import { Icon3D, MODALITY_ICON } from './Icon3D';
import { Card } from './ui';
import { colors, toneColor } from '@/theme';

export const CLOSED_STATES = ['cancelada_paciente', 'cancelada_ips', 'no_asistio'];

/** Tarjeta de una cita en Mi día: hora, paciente, modalidad y la acción siguiente. */
export function CitaCard({ cita, index = 0 }: { cita: Cita; index?: number }) {
  const faded = CLOSED_STATES.includes(cita.estado);
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 30).duration(220)}>
      <Pressable onPress={() => router.push({ pathname: '/cita/[id]', params: { id: cita.id } })}>
        <Card style={faded && { opacity: 0.6 }}>
          <View style={styles.top}>
            <Text style={styles.time}>
              {localTime(cita.inicio)} – {localTime(cita.fin)}
            </Text>
            <Text style={[styles.state, { color: toneColor[STATE_TONE[cita.estado]] }]}>{STATE_LABEL[cita.estado]}</Text>
          </View>
          <View style={styles.who}>
            <Icon3D name={MODALITY_ICON[cita.modalidad] ?? 'citas'} size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.patient}>{cita.paciente}</Text>
              <Text style={styles.meta} numberOfLines={2}>
                {MODALITY_LABEL[cita.modalidad]}
                {cita.servicio ? ` · ${cita.servicio}` : ''}
                {cita.modalidad === 'domicilio' && cita.direccion ? `\n${cita.direccion}` : ''}
              </Text>
            </View>
          </View>
          <CitaActions cita={cita} compact />
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 15, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  state: { fontSize: 13, fontWeight: '600' },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  patient: { fontSize: 17, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
});
