import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ORDER_TYPE_LABEL, PRIORITY_LABEL, describeItem, type Order } from '@kerhub/core/ordenes';
import { localDay, localTime } from '@kerhub/core/agenda';
import { errorMessage, orders } from '@/lib/api';
import { BottomSheet } from '@/components/overlay/BottomSheet';
import { MoreButton } from '@/components/overlay/MoreButton';
import { showAlert } from '@/components/overlay/Overlay';
import { Button, Card } from '@/components/ui';
import { colors, radius } from '@/theme';

/** Una orden completa en una hoja desde abajo; anularla va en «···», con motivo obligatorio. */
export function OrderDetail({ order, canCancel, onClose, onChanged }: { order: Order | null; canCancel: boolean; onClose: () => void; onChanged: () => void }) {
  const [asking, setAsking] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const cancelled = order ? order.estadoRegistro !== 'active' : false;

  const cancel = async () => {
    if (!order) return;
    setBusy(true);
    try {
      await orders.cancelOrder(order.id, motivo.trim());
      setAsking(false);
      setMotivo('');
      onChanged();
      showAlert('Orden anulada', `${order.numero} quedó anulada con su motivo.`);
    } catch (e) {
      showAlert('No se pudo anular', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      visible={!!order}
      onClose={() => {
        setAsking(false);
        onClose();
      }}>
      {order ? (
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <View style={styles.head}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.number}>{order.numero}</Text>
              <Text style={styles.title}>{ORDER_TYPE_LABEL[order.tipo]}</Text>
              <Text style={[styles.meta, cancelled && { color: colors.danger }]}>
                {cancelled ? 'Anulada' : PRIORITY_LABEL[order.prioridad]} · {localDay(order.fecha)} {localTime(order.fecha)} · {order.medicoNombre}
              </Text>
            </View>
            {canCancel && !cancelled ? <MoreButton actions={[{ label: 'Anular orden', destructive: true, onPress: () => setAsking(true) }]} /> : null}
          </View>
          {asking && (
            <Card style={{ gap: 10 }}>
              <Text style={styles.label}>Motivo de la anulación (obligatorio)</Text>
              <TextInput value={motivo} onChangeText={setMotivo} multiline autoFocus placeholder="Dosis equivocada, se reformula" placeholderTextColor="#a29fae" style={styles.input} />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                <Button title="Volver" variant="secondary" onPress={() => setAsking(false)} />
                <Button title="Anular orden" variant="danger" busy={busy} disabled={motivo.trim().length < 10} onPress={cancel} />
              </View>
            </Card>
          )}
          <Card style={{ gap: 10 }}>
            {order.items.map((i, k) => (
              <Text key={k} style={styles.item}>
                {describeItem(order.tipo, i)}
                {i.indicaciones ? `\n${i.indicaciones}` : ''}
              </Text>
            ))}
          </Card>
          {order.diagnosticoCodigo ? (
            <Card>
              <Text style={styles.label}>Diagnóstico</Text>
              <Text style={styles.item}>
                {order.diagnosticoCodigo} {order.diagnosticoDescripcion}
              </Text>
            </Card>
          ) : null}
          {order.indicaciones && order.tipo !== 'interconsulta' ? (
            <Card>
              <Text style={styles.label}>Indicaciones</Text>
              <Text style={styles.item}>{order.indicaciones}</Text>
            </Card>
          ) : null}
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  number: { fontSize: 13, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  item: { fontSize: 15, color: colors.ink, lineHeight: 21 },
  input: { minHeight: 80, maxHeight: 160, borderRadius: radius.control, backgroundColor: colors.canvas, padding: 12, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
});
