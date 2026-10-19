import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { ACTIVE_STATES, STATE_LABEL, STATE_TONE, formatLongDay, formatShortDay, localDay, localTime, type Cita } from '@kerhub/core/agenda';
import { ageFrom, patientSubtitle } from '@kerhub/core/pacientes';
import { agenda, errorMessage, patients } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BraulioEmpty } from '@/components/Braulio';
import { CitaCard } from '@/components/CitaCard';
import { PatientAvatar } from '@/components/PatientAvatar';
import { Card } from '@/components/ui';
import { colors, toneColor } from '@/theme';

/** Citas del historial que se muestran antes de «Ver todas». */
const HISTORY_PREVIEW = 8;

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

function openAddress(address: string) {
  const q = encodeURIComponent(address);
  void Linking.openURL(Platform.OS === 'ios' ? `maps://?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`);
}

function Action({ label, onPress, strong }: { label: string; onPress: () => void; strong?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.action, strong && styles.actionStrong, pressed && { opacity: 0.8 }]}>
      <Text style={[styles.actionText, strong && { color: colors.primaryDark }]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function HistoryRow({ cita, mine }: { cita: Cita; mine: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/cita/[id]', params: { id: cita.id } })}
      style={({ pressed }) => [styles.history, pressed && { opacity: 0.7 }]}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={styles.historyWhen}>
          {capitalize(formatShortDay(localDay(cita.inicio)))} · {localTime(cita.inicio)}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[cita.servicio, mine ? null : cita.profesional].filter(Boolean).join(' · ') || 'Cita'}
        </Text>
      </View>
      <Text style={[styles.historyState, { color: toneColor[STATE_TONE[cita.estado]] }]}>{STATE_LABEL[cita.estado]}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

/**
 * Ficha del paciente en la app: quién es, cómo contactarlo, su próxima cita
 * contigo y el historial de citas (de la más reciente a la más antigua).
 */
export default function Paciente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const [allHistory, setAllHistory] = useState(false);

  const patient = useQuery({ queryKey: ['pacientes', 'ficha', id], queryFn: () => patients.fetchMyPatient(id) });
  const citas = useQuery({ queryKey: ['agenda', 'paciente', id], queryFn: () => agenda.fetchPatientCitas(id) });

  if (patient.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (patient.isError || !patient.data) {
    return <BraulioEmpty pose="historial" title="No se pudo abrir la ficha" hint={errorMessage(patient.error)} />;
  }

  const p = patient.data;
  const now = Date.now();
  const list = citas.data ?? [];
  // La próxima cita activa conmigo (la lista viene de la más reciente a la más antigua).
  const next = [...list].reverse().find((c) => c.profesionalUserId === me?.user.id && ACTIVE_STATES.includes(c.estado) && Date.parse(c.fin) >= now) ?? null;
  const history = list.filter((c) => c.id !== next?.id);
  const shown = allHistory ? history : history.slice(0, HISTORY_PREVIEW);
  const age = ageFrom(p.fechaNacimiento);
  const birth = p.fechaNacimiento ? `${capitalize(formatLongDay(p.fechaNacimiento))}${age != null ? ` · ${age} ${age === 1 ? 'año' : 'años'}` : ''}` : null;
  const place = [p.direccion, p.ciudad].filter(Boolean).join(', ');

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      refreshControl={
        <RefreshControl
          refreshing={patient.isRefetching || citas.isRefetching}
          onRefresh={() => void Promise.all([patient.refetch(), citas.refetch()])}
          tintColor={colors.primary}
        />
      }>
      <Animated.View entering={FadeIn.duration(220)} style={{ gap: 16 }}>
        <Card style={{ gap: 14 }}>
          <View style={styles.head}>
            <PatientAvatar name={p.nombre} size={64} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={styles.name}>{p.nombre}</Text>
              <Text style={styles.meta}>{patientSubtitle(p)}</Text>
            </View>
          </View>
          {(p.telefono || place) && (
            <View style={styles.actions}>
              {p.telefono && <Action label="Llamar" strong onPress={() => void Linking.openURL(`tel:${p.telefono!.replace(/\s+/g, '')}`)} />}
              {place && <Action label="Ver dirección" onPress={() => openAddress(place)} />}
            </View>
          )}
        </Card>

        {next && (
          <View style={{ gap: 8 }}>
            <Text style={styles.section}>Próxima cita</Text>
            <CitaCard cita={next} />
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text style={styles.section}>Datos</Text>
          <Card style={{ gap: 12 }}>
            <Field label="Historia" value={p.numeroHistoria} />
            <Field label="Documento" value={[p.tipoDocumento, p.documento].filter(Boolean).join(' ')} />
            <Field label="Nacimiento" value={birth} />
            <Field label="Género" value={p.genero} />
            <Field label="Teléfono" value={[p.telefono, p.telefonoSecundario].filter(Boolean).join(' · ')} />
            <Field label="Correo" value={p.email} />
            <Field label="Dirección" value={place} />
            <Field label="Zona" value={p.zona} />
            <Field label="Régimen" value={[p.regimen, p.tipoAfiliacion].filter(Boolean).join(' · ')} />
            <Field label="Ocupación" value={p.ocupacion} />
          </Card>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={styles.section}>Historial de citas</Text>
          <Card style={{ gap: 0, paddingVertical: 4 }}>
            {citas.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} />
            ) : citas.isError ? (
              <Text style={[styles.meta, { paddingVertical: 12 }]}>{errorMessage(citas.error)}</Text>
            ) : history.length === 0 ? (
              <Text style={[styles.meta, { paddingVertical: 12 }]}>Aún no hay otras citas.</Text>
            ) : (
              shown.map((c, i) => (
                <View key={c.id} style={i < shown.length - 1 && styles.line}>
                  <HistoryRow cita={c} mine={c.profesionalUserId === me?.user.id} />
                </View>
              ))
            )}
          </Card>
          {!allHistory && history.length > HISTORY_PREVIEW && (
            <Pressable accessibilityRole="button" onPress={() => setAllHistory(true)} style={({ pressed }) => [styles.more, pressed && { opacity: 0.6 }]}>
              <Text style={styles.moreText}>Ver todas ({history.length})</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  meta: { fontSize: 14, color: colors.muted },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, height: 44, borderRadius: 14, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  actionStrong: { backgroundColor: colors.primarySoft },
  actionText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, marginLeft: 4 },
  field: { gap: 2 },
  fieldLabel: { fontSize: 12.5, color: colors.muted },
  fieldValue: { fontSize: 15, color: colors.ink },
  history: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  historyWhen: { fontSize: 15, fontWeight: '600', color: colors.ink, fontVariant: ['tabular-nums'] },
  historyState: { fontSize: 13, fontWeight: '600' },
  chevron: { fontSize: 20, color: colors.muted, marginTop: -2 },
  line: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  more: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  moreText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
