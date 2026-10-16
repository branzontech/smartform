import { useState } from 'react';
import { showAlert } from '@/components/overlay/Overlay';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LOCATION_STATES, REASON_REQUIRED, SUCCESS_LABEL, fieldLabel, fieldPrimary, fieldSecondary } from '@kerhub/core/cita-actions';
import type { Cita, CitaState } from '@kerhub/core/agenda';
import { agenda, errorMessage } from '@/lib/api';
import { currentPosition } from '@/lib/location';
import { colors, radius } from '@/theme';
import { Button } from './ui';

/**
 * Acciones del profesional sobre su cita: salir, llegar e iniciar la atención (desde ahí
 * se diligencia todo y se termina). Las novedades van en «Más acciones».
 */
export function CitaActions({ cita, compact = false }: { cita: Pick<Cita, 'id' | 'estado' | 'modalidad'>; compact?: boolean }) {
  const queryClient = useQueryClient();
  const [reasonFor, setReasonFor] = useState<CitaState | null>(null);
  const [reason, setReason] = useState('');
  const primary = fieldPrimary(cita);
  const others = fieldSecondary(cita);
  const openAttention = () => router.push({ pathname: '/atencion/[id]', params: { id: cita.id } });

  const change = useMutation({
    mutationFn: async ({ estado, motivo }: { estado: CitaState; motivo?: string }) => {
      const position = LOCATION_STATES.includes(estado) ? await currentPosition() : null;
      await agenda.changeCitaState(cita.id, { estado, motivo: motivo ?? null, ...(position ?? {}) });
      return estado;
    },
    onSuccess: (estado) => {
      void queryClient.invalidateQueries({ queryKey: ['agenda'] });
      setReasonFor(null);
      setReason('');
      // Al iniciar la atención se abre el formato, como en la web.
      if (estado === 'en_atencion') openAttention();
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

  const more = () =>
    showAlert('Más acciones', 'Qué pasó con esta cita', [
      ...others.map((estado) => ({
        text: fieldLabel(cita, estado),
        style: (REASON_REQUIRED.includes(estado) ? 'destructive' : 'default') as 'destructive' | 'default',
        onPress: () => run(estado),
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);

  const inAttention = cita.estado === 'en_atencion';
  const attended = cita.estado === 'atendida';
  if (!primary && others.length === 0 && !inAttention && !attended) return null;
  const required = reasonFor ? REASON_REQUIRED.includes(reasonFor) : false;

  return (
    <View style={[styles.row, compact && { marginTop: 4 }]}>
      {others.length > 0 && (
        <Pressable accessibilityRole="button" accessibilityLabel="Más acciones" onPress={more} hitSlop={6} style={({ pressed }) => [styles.more, pressed && { opacity: 0.7 }]}>
          <Text style={styles.moreText}>···</Text>
        </Pressable>
      )}
      {primary && <Button size="sm" title={fieldLabel(cita, primary)} busy={change.isPending} onPress={() => run(primary)} />}
      {inAttention && <Button size="sm" title="Continuar atención" onPress={openAttention} />}
      {attended && <Button size="sm" variant="secondary" title="Ver atención" onPress={openAttention} />}

      <Modal transparent animationType="fade" visible={!!reasonFor} onRequestClose={() => setReasonFor(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{reasonFor ? fieldLabel(cita, reasonFor) : ''}</Text>
            <Text style={styles.sheetHint}>{required ? 'Escribe el motivo (obligatorio).' : 'Puedes dejar una nota (opcional).'}</Text>
            <TextInput value={reason} onChangeText={setReason} placeholder="Motivo" multiline style={styles.input} maxLength={500} />
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
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
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'flex-end' },
  more: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  moreText: { color: colors.muted, fontSize: 20, fontWeight: '700', marginTop: -6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,22,28,0.38)', justifyContent: 'flex-end', padding: 10 },
  sheet: { backgroundColor: colors.surface, padding: 20, gap: 12, borderRadius: 24 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  sheetHint: { fontSize: 13, color: colors.muted },
  input: { minHeight: 90, borderRadius: radius.control, backgroundColor: colors.canvas, padding: 12, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
});
