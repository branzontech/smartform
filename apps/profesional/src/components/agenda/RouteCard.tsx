import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { Cita } from '@kerhub/core/agenda';
import { Icon3D } from '@/components/Icon3D';
import { Button } from '@/components/ui';
import { colors } from '@/theme';
import { CLOSED_STATES } from '@/components/CitaCard';

/** Barrio de una dirección «Calle 66 # 3-44, Crespo, Cartagena» → «Crespo». */
const barrio = (direccion: string | null) => {
  const parts = (direccion ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length >= 3 ? parts[parts.length - 2] : null;
};

/**
 * Ruta del día: las visitas a domicilio que faltan. «Iniciar ruta» abrirá el
 * recorrido en el mapa (pestaña Ruta).
 */
export function RouteCard({ citas, isToday }: { citas: Cita[]; isToday: boolean }) {
  const visits = citas.filter((c) => c.modalidad === 'domicilio' && !CLOSED_STATES.includes(c.estado) && c.estado !== 'atendida');
  if (visits.length === 0) return null;
  const places = [...new Set(visits.map((c) => barrio(c.direccion)).filter(Boolean))].join(' · ');
  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.card}>
      <Icon3D name="zonas" size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title}>{visits.length === 1 ? '1 visita a domicilio' : `${visits.length} visitas a domicilio`}</Text>
        {places ? (
          <Text style={styles.meta} numberOfLines={2}>
            {places}
          </Text>
        ) : null}
      </View>
      <Button size="sm" variant={isToday ? 'primary' : 'secondary'} title={isToday ? 'Iniciar ruta' : 'Ver ruta'} onPress={() => router.push('/ruta')} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 18, padding: 14 },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
});
