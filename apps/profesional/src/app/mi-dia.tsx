import { useLayoutEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MODALITY_LABEL, STATE_LABEL, STATE_TONE, addDays, formatLongDay, localTime, today, type Cita } from '@kerhub/core/agenda';
import { agenda, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CitaActions } from '@/components/CitaActions';
import { Card } from '@/components/ui';
import { colors, toneColor } from '@/theme';

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

export default function MiDia() {
  const { me, signOut } = useAuth();
  const navigation = useNavigation();
  const [day, setDay] = useState(today());
  const query = useQuery({ queryKey: ['agenda', 'mi-dia', day], queryFn: () => agenda.fetchMyDay(day) });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}>
          <Text style={{ color: colors.primary, fontSize: 15 }}>Salir</Text>
        </Pressable>
      ),
    });
  }, [navigation, signOut]);

  const citas = query.data?.citas ?? [];

  return (
    <FlatList
      data={citas}
      keyExtractor={(c) => c.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={styles.header}>
          {me?.empresa && <Text style={styles.company}>{me.empresa.nombre}</Text>}
          <View style={styles.dayRow}>
            <Pressable accessibilityLabel="Día anterior" onPress={() => setDay(addDays(day, -1))} style={styles.navBtn}>
              <Text style={styles.navText}>‹</Text>
            </Pressable>
            <Pressable onPress={() => setDay(today())} style={{ flex: 1 }}>
              <Text style={styles.day}>{capitalize(formatLongDay(day))}</Text>
              <Text style={styles.count}>
                {query.isLoading ? 'Cargando…' : citas.length === 1 ? '1 cita' : `${citas.length} citas`}
                {day !== today() ? ' · toca para volver a hoy' : ''}
              </Text>
            </Pressable>
            <Pressable accessibilityLabel="Día siguiente" onPress={() => setDay(addDays(day, 1))} style={styles.navBtn}>
              <Text style={styles.navText}>›</Text>
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        query.isLoading ? null : (
          <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={styles.emptyTitle}>{query.isError ? 'No se pudo cargar' : 'No tienes citas para este día'}</Text>
            <Text style={styles.emptyHint}>
              {query.isError ? errorMessage(query.error) : 'Aquí aparecen las citas asignadas a tu usuario como profesional.'}
            </Text>
          </Card>
        )
      }
      renderItem={({ item }) => <CitaCard cita={item} />}
    />
  );
}

function CitaCard({ cita }: { cita: Cita }) {
  const faded = ['cancelada_paciente', 'cancelada_ips', 'no_asistio'].includes(cita.estado);
  return (
    <Pressable onPress={() => router.push({ pathname: '/cita/[id]', params: { id: cita.id } })}>
      <Card style={faded && { opacity: 0.6 }}>
        <View style={styles.cardTop}>
          <Text style={styles.time}>
            {localTime(cita.inicio)} – {localTime(cita.fin)}
          </Text>
          <Text style={[styles.state, { color: toneColor[STATE_TONE[cita.estado]] }]}>{STATE_LABEL[cita.estado]}</Text>
        </View>
        <Text style={styles.patient}>{cita.paciente}</Text>
        <Text style={styles.meta}>
          {MODALITY_LABEL[cita.modalidad]}
          {cita.servicio ? ` · ${cita.servicio}` : ''}
        </Text>
        {cita.modalidad === 'domicilio' && cita.direccion && <Text style={styles.meta}>{cita.direccion}</Text>}
        <CitaActions cita={cita} compact />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  header: { gap: 10, marginBottom: 4 },
  company: { fontSize: 13, color: colors.muted },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 24, color: colors.primary, marginTop: -3 },
  day: { fontSize: 18, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  count: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 15, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  state: { fontSize: 13, fontWeight: '600' },
  patient: { fontSize: 17, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  emptyHint: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 4 },
});
