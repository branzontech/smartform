import { useState } from 'react';
import { showAlert } from '@/components/overlay/Overlay';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { AttentionFormat } from '@kerhub/core/forms';
import { formats as formatsApi } from '@/lib/api';
import { Button, Card } from '@/components/ui';
import { colors, radius } from '@/theme';
import type { FormatState } from './FormatEditor';

/** Estado de un formato en texto (sin puntos ni cápsulas). */
function statusText(f: AttentionFormat, s: FormatState | undefined): { label: string; color: string } {
  if (!s?.loaded) return { label: 'Cargando…', color: colors.muted };
  if (s.status === 'error') return { label: 'No se pudo guardar', color: colors.danger };
  if (s.status === 'saving') return { label: 'Guardando…', color: colors.muted };
  if (s.empty) return f.obligatorio ? { label: 'Pendiente', color: colors.warning } : { label: 'Opcional', color: colors.muted };
  if (s.missing > 0) return { label: s.missing === 1 ? 'Falta 1 campo' : `Faltan ${s.missing} campos`, color: colors.warning };
  return { label: 'Completo', color: colors.success };
}

/** Formatos de la atención: elegir cuál diligenciar, agregar otros y quitar los agregados. */
export function FormatList({
  items,
  states,
  active,
  readOnly,
  onSelect,
  onAdd,
  onRemove,
}: {
  items: AttentionFormat[];
  states: Record<string, FormatState>;
  active: string | null;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onAdd: (formularioId: string) => Promise<void>;
  onRemove: (formularioId: string) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [picking, setPicking] = useState(false);
  const available = useQuery({ queryKey: ['atencion', 'formularios'], queryFn: () => formatsApi.fetchAvailableForms(), enabled: picking, staleTime: 5 * 60_000 });
  const choices = (available.data ?? []).filter((f) => !items.some((i) => i.formularioId === f.id));

  const more = (f: AttentionFormat) =>
    showAlert(f.titulo, undefined, [
      {
        text: 'Quitar formato',
        style: 'destructive',
        onPress: () =>
          showAlert('Quitar formato', `Se quita «${f.titulo}» de esta atención.`, [
            { text: 'Volver', style: 'cancel' },
            { text: 'Quitar', style: 'destructive', onPress: () => void onRemove(f.formularioId) },
          ]),
      },
      { text: 'Volver', style: 'cancel' },
    ]);

  return (
    <Card style={{ gap: 6 }}>
      <Text style={styles.heading}>{items.length === 1 ? 'Formato de la atención' : `Formatos de la atención (${items.length})`}</Text>
      {items.map((f) => {
        const s = statusText(f, states[f.formularioId]);
        const selected = f.formularioId === active;
        const removable = !readOnly && f.origen === 'profesional' && !f.tieneRespuesta && (states[f.formularioId]?.empty ?? true);
        return (
          <View key={f.formularioId} style={[styles.row, selected && styles.rowSelected]}>
            <Pressable style={{ flex: 1, gap: 2 }} onPress={() => onSelect(f.formularioId)} accessibilityRole="button" accessibilityState={{ selected }}>
              <Text style={[styles.title, selected && { color: colors.primary }]} numberOfLines={2}>
                {f.titulo}
              </Text>
              <Text style={[styles.status, { color: s.color }]}>
                {s.label}
                {f.obligatorio ? ' · obligatorio' : ''}
              </Text>
            </Pressable>
            {removable ? (
              <Pressable onPress={() => more(f)} accessibilityLabel="Más acciones" hitSlop={8} style={styles.more}>
                <Text style={styles.moreText}>···</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
      {!readOnly && <Button title="Agregar formato" variant="secondary" onPress={() => setPicking(true)} />}

      <Modal visible={picking} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPicking(false)}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.sheetTitle}>Agregar formato</Text>
          <Text style={styles.status}>Escalas, notas y valoraciones que quieras diligenciar en esta visita.</Text>
          <ScrollView contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
            {available.isLoading ? <Text style={styles.status}>Cargando…</Text> : null}
            {choices.map((f) => (
              <Pressable
                key={f.id}
                style={styles.choice}
                onPress={async () => {
                  setPicking(false);
                  await onAdd(f.id);
                }}>
                <Text style={styles.title}>{f.titulo}</Text>
                <Text style={styles.status}>{f.tipo === 'historia_clinica' ? 'Historia clínica' : 'Formato'}</Text>
              </Pressable>
            ))}
            {!available.isLoading && choices.length === 0 ? <Text style={styles.status}>No hay más formatos activos para agregar.</Text> : null}
          </ScrollView>
          <Button title="Cerrar" variant="secondary" onPress={() => setPicking(false)} />
        </View>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 13, fontWeight: '700', color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.control, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.canvas },
  rowSelected: { backgroundColor: colors.primarySoft },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  status: { fontSize: 13, color: colors.muted },
  more: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  moreText: { color: colors.primary, fontSize: 18, fontWeight: '700', marginTop: -6 },
  sheet: { flex: 1, backgroundColor: colors.canvas, padding: 16, paddingTop: 24, gap: 8 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: colors.ink },
  choice: { borderRadius: radius.control, backgroundColor: colors.surface, padding: 14, gap: 2 },
});
