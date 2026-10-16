import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ACTION_LABEL, LOCATION_STATES, REASON_REQUIRED, SUCCESS_LABEL, primaryNext, secondaryNext } from '@kerhub/core/cita-actions';
import type { Cita, CitaState } from '@kerhub/core/agenda';
import { agenda, errorMessage } from '@/lib/api';
import { currentPosition } from '@/lib/location';
import { colors, radius } from '@/theme';
import { Button } from './ui';

/** Acción siguiente a la vista y el resto bajo «Más acciones» (mismas reglas que Ker Hub web). */
export function CitaActions({ cita, compact = false }: { cita: Pick<Cita, 'id' | 'estado' | 'modalidad'>; compact?: boolean }) {
  const queryClient = useQueryClient();
  const [reasonFor, setReasonFor] = useState<CitaState | null>(null);
  const [reason, setReason] = useState('');
  const primary = primaryNext(cita);
  const others = secondaryNext(cita);

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
      if (estado === 'en_atencion') router.push({ pathname: '/atencion/[id]', params: { id: cita.id } });
      else Alert.alert(SUCCESS_LABEL[estado] ?? 'Listo');
    },
    onError: (e) => Alert.alert('No se pudo', errorMessage(e)),
  });

  const run = (estado: CitaState) => {
    if (REASON_REQUIRED.includes(estado) || estado === 'no_asistio') {
      setReasonFor(estado);
      return;
    }
    change.mutate({ estado });
  };

  const more = () =>
    Alert.alert('Más acciones', undefined, [
      ...others.map((estado) => ({
        text: ACTION_LABEL[estado] ?? estado,
        style: (REASON_REQUIRED.includes(estado) ? 'destructive' : 'default') as 'destructive' | 'default',
        onPress: () => run(estado),
      })),
      { text: 'Volver', style: 'cancel' as const },
    ]);

  if (!primary && others.length === 0) return null;
  const required = reasonFor ? REASON_REQUIRED.includes(reasonFor) : false;

  return (
    <View style={[styles.row, compact && { marginTop: 4 }]}>
      {primary && (
        <View style={{ flex: 1 }}>
          <Button title={ACTION_LABEL[primary] ?? primary} busy={change.isPending} onPress={() => run(primary)} />
        </View>
      )}
      {others.length > 0 && (
        <Pressable accessibilityRole="button" accessibilityLabel="Más acciones" onPress={more} style={styles.more}>
          <Text style={styles.moreText}>···</Text>
        </Pressable>
      )}

      <Modal transparent animationType="fade" visible={!!reasonFor} onRequestClose={() => setReasonFor(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{reasonFor ? ACTION_LABEL[reasonFor] : ''}</Text>
            <Text style={styles.sheetHint}>{required ? 'Escribe el motivo (obligatorio).' : 'Puedes dejar una nota (opcional).'}</Text>
            <TextInput value={reason} onChangeText={setReason} placeholder="Motivo" multiline style={styles.input} maxLength={500} />
            <View style={{ gap: 8 }}>
              <Button
                title="Confirmar"
                variant={required ? 'danger' : 'primary'}
                busy={change.isPending}
                disabled={required && reason.trim().length < 3}
                onPress={() => reasonFor && change.mutate({ estado: reasonFor, motivo: reason.trim() || undefined })}
              />
              <Button title="Volver" variant="secondary" onPress={() => setReasonFor(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  more: { width: 46, height: 46, borderRadius: radius.control, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  moreText: { color: colors.primary, fontSize: 20, fontWeight: '700', marginTop: -6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,22,28,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, padding: 20, gap: 12, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  sheetHint: { fontSize: 13, color: colors.muted },
  input: { minHeight: 90, borderRadius: radius.control, backgroundColor: colors.canvas, padding: 12, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
});
