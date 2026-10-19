import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LOCATION_STATES, REASON_REQUIRED, SUCCESS_LABEL, fieldLabel, fieldPrimary, fieldSecondary } from '@kerhub/core/cita-actions';
import type { Cita, CitaState } from '@kerhub/core/agenda';
import { agenda, errorMessage, hasModule, rutas } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { currentPosition } from '@/lib/location';
import { BottomSheet } from '@/components/overlay/BottomSheet';
import { MoreButton } from '@/components/overlay/MoreButton';
import { showAlert } from '@/components/overlay/Overlay';
import { colors, radius } from '@/theme';
import { Button } from './ui';

/**
 * Acciones del profesional sobre su cita: salir, llegar e iniciar la atención (desde ahí
 * se diligencia todo y se termina). Las novedades van en «···».
 */
export function CitaActions({ cita, compact = false }: { cita: Pick<Cita, 'id' | 'estado' | 'modalidad'>; compact?: boolean }) {
  const queryClient = useQueryClient();
  const { me } = useAuth();
  // Visita a domicilio con el módulo de rutas: salir hacia el paciente inicia la ruta y abre el mapa.
  const withRoute = cita.modalidad === 'domicilio' && hasModule(me, 'rutas');
  const [reasonFor, setReasonFor] = useState<CitaState | null>(null);
  const [reason, setReason] = useState('');
  const primary = fieldPrimary(cita);
  const others = fieldSecondary(cita);
  const openAttention = () => router.push({ pathname: '/atencion/[id]', params: { id: cita.id } });
  const openSummary = () => router.push({ pathname: '/atencion/resumen/[id]', params: { id: cita.id } });

  const change = useMutation({
    mutationFn: async ({ estado, motivo }: { estado: CitaState; motivo?: string }) => {
      const position = LOCATION_STATES.includes(estado) ? await currentPosition() : null;
      await agenda.changeCitaState(cita.id, { estado, motivo: motivo ?? null, ...(position ?? {}) });
      if (estado === 'en_camino' && withRoute && position) await rutas.computeMyRoute(position).catch(() => undefined);
      return estado;
    },
    onSuccess: (estado) => {
      void queryClient.invalidateQueries({ queryKey: ['agenda'] });
      void queryClient.invalidateQueries({ queryKey: ['rutas'] });
      setReasonFor(null);
      setReason('');
      // Al iniciar la atención se abre la atención: ahí se diligencia todo.
      if (estado === 'en_atencion') openAttention();
      // En camino a un domicilio: el mapa con el tiempo de llegada y el camino.
      else if (estado === 'en_camino' && withRoute) router.navigate('/ruta');
      else showAlert(SUCCESS_LABEL[estado] ?? 'Listo');
    },
    onError: (e) => showAlert('No se pudo', errorMessage(e)),
  });

  const run = (estado: CitaState) => {
    if (REASON_REQUIRED.includes(estado) || estado === 'no_asistio') {
      setReasonFor(estado);
      return;
    }
    change.mutate({ estado });
  };

  const inAttention = cita.estado === 'en_atencion';
  const attended = cita.estado === 'atendida';
  if (!primary && others.length === 0 && !inAttention && !attended) return null;
  const required = reasonFor ? REASON_REQUIRED.includes(reasonFor) : false;

  return (
    <View style={[styles.row, compact && { marginTop: 4 }]}>
      <MoreButton actions={others.map((estado) => ({ label: fieldLabel(cita, estado), destructive: REASON_REQUIRED.includes(estado), onPress: () => run(estado) }))} />
      {primary && <Button size="sm" title={fieldLabel(cita, primary)} busy={change.isPending} onPress={() => run(primary)} />}
      {inAttention && <Button size="sm" title="Continuar atención" onPress={openAttention} />}
      {attended && <Button size="sm" variant="secondary" title="Ver atención" onPress={openSummary} />}

      <BottomSheet visible={!!reasonFor} onClose={() => setReasonFor(null)} size="auto" title={reasonFor ? fieldLabel(cita, reasonFor) : ''}>
        <View style={styles.sheet}>
          <Text style={styles.hint}>{required ? 'Escribe el motivo. Queda en la bitácora de la cita.' : 'Puedes dejar una nota (opcional).'}</Text>
          <TextInput value={reason} onChangeText={setReason} placeholder="Motivo" placeholderTextColor="#a29fae" multiline style={styles.input} maxLength={500} autoFocus />
          <View style={styles.actions}>
            <Button title="Volver" variant="secondary" onPress={() => setReasonFor(null)} />
            <Button
              title="Confirmar"
              variant={required ? 'danger' : 'primary'}
              busy={change.isPending}
              disabled={required && reason.trim().length < 3}
              onPress={() => reasonFor && change.mutate({ estado: reasonFor, motivo: reason.trim() || undefined })}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  hint: { fontSize: 14, color: colors.muted },
  input: { minHeight: 110, maxHeight: 180, borderRadius: radius.control, backgroundColor: colors.surface, padding: 12, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
});
