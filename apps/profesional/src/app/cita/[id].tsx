import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MODALITY_LABEL, STATE_LABEL, STATE_TONE, formatLongDay, localDay, localTime } from '@kerhub/core/agenda';
import { agenda, errorMessage, hasModule } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { RoutePreview } from '@/components/route/RoutePreview';
import { showsClinicalRecord } from '@kerhub/core/cita-actions';
import { CitaActions } from '@/components/CitaActions';
import { Icon3D, MODALITY_ICON } from '@/components/Icon3D';
import { Button, Card } from '@/components/ui';
import { colors, toneColor } from '@/theme';
import { callPhone, openDirections } from '@/lib/links';

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

export default function CitaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ['agenda', 'cita', id], queryFn: () => agenda.fetchCita(id) });
  const { me } = useAuth();

  if (query.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!query.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>{errorMessage(query.error)}</Text>
      </View>
    );
  }
  const c = query.data;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Card>
        <View style={styles.headRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.state, { color: toneColor[STATE_TONE[c.estado]] }]}>{STATE_LABEL[c.estado]}</Text>
            <Text style={styles.patient}>{c.paciente}</Text>
          </View>
          <Icon3D name={MODALITY_ICON[c.modalidad] ?? 'citas'} size={56} />
        </View>
        <View style={styles.docRow}>
          <Text style={styles.meta}>
            {c.tipoDocumento} {c.documento}
          </Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push({ pathname: '/paciente/[id]', params: { id: c.pacienteId } })}>
            <Text style={styles.link}>Ver ficha</Text>
          </Pressable>
        </View>
        <Text style={styles.when}>
          {capitalize(formatLongDay(localDay(c.inicio)))}, {localTime(c.inicio)} – {localTime(c.fin)}
        </Text>
        <Text style={styles.meta}>
          {MODALITY_LABEL[c.modalidad]}
          {c.servicio ? ` · ${c.servicio}` : ''}
          {c.convenio ? ` · ${c.convenio}` : ''}
        </Text>
        {c.motivo && <Text style={styles.body}>Motivo: {c.motivo}</Text>}
        {c.notas && <Text style={styles.body}>Notas: {c.notas}</Text>}
        {c.motivoCancelacion && <Text style={styles.body}>Motivo de cierre: {c.motivoCancelacion}</Text>}
        <CitaActions cita={c} />
      </Card>

      {showsClinicalRecord(c.estado) && (
        <Pressable onPress={() => router.push({ pathname: '/atencion/[id]', params: { id: c.id } })} accessibilityRole="button">
          <Card style={styles.attention}>
            <Icon3D name="formularios" size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.attentionTitle}>{c.estado === 'atendida' ? 'Ver atención' : 'Diligenciar atención'}</Text>
              <Text style={styles.meta}>Historia clínica de esta cita</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Card>
        </Pressable>
      )}

      {/* Visita a domicilio: vista previa del camino con tráfico, navegar y llamar. */}
      {c.modalidad === 'domicilio' && (
        <RoutePreview citaId={c.id} latitud={c.latitud} longitud={c.longitud} direccion={c.direccion} telefono={c.telefono} withRoutes={hasModule(me, 'rutas')} />
      )}

      {c.modalidad !== 'domicilio' && (c.direccion || c.telefono) && (
        <Card>
          {c.direccion && (
            <>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.body}>{c.direccion}</Text>
              <Button title="Cómo llegar" variant="secondary" onPress={() => openDirections(c.direccion ?? '')} />
            </>
          )}
          {c.telefono && <Button title={`Llamar · ${c.telefono}`} variant="secondary" onPress={() => void callPhone(c.telefono!)} />}
        </Card>
      )}

      <Card>
        <Text style={styles.label}>Bitácora</Text>
        {c.eventos.map((e) => (
          <View key={e.id} style={styles.event}>
            <Text style={styles.body}>
              {e.evento === 'creada' ? 'Cita creada' : e.estadoNuevo ? `Pasó a ${STATE_LABEL[e.estadoNuevo].toLowerCase()}` : e.evento}
            </Text>
            <Text style={styles.meta}>
              {capitalize(formatLongDay(localDay(e.fecha)))}, {localTime(e.fecha)} · {e.actor}
              {e.latitud !== null ? ' · con ubicación' : ''}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  docRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  link: { fontSize: 14, fontWeight: '700', color: colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  page: { padding: 16, gap: 12, paddingBottom: 40 },
  state: { fontSize: 13, fontWeight: '600' },
  patient: { fontSize: 22, fontWeight: '700', color: colors.ink },
  when: { fontSize: 16, fontWeight: '600', color: colors.ink, marginTop: 4 },
  meta: { fontSize: 14, color: colors.muted },
  body: { fontSize: 15, color: colors.ink },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  event: { gap: 2, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  attention: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  attentionTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  chevron: { fontSize: 26, color: colors.primary, marginTop: -3 },
});
