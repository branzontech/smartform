import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ORDER_TYPE_LABEL, PRIORITY_LABEL, describeItem, type Order } from '@kerhub/core/ordenes';
import { localDay, localTime } from '@kerhub/core/agenda';
import { errorMessage, orders } from '@/lib/api';
import { Button, Card } from '@/components/ui';
import { colors, radius } from '@/theme';

/** Una orden completa; anularla va en «Más acciones», con motivo obligatorio. */
export function OrderDetail({ order, canCancel, onClose, onChanged }: { order: Order; canCancel: boolean; onClose: () => void; onChanged: () => void }) {
  const insets = useSafeAreaInsets();
  const [asking, setAsking] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const cancelled = order.estadoRegistro !== 'active';

  const cancel = async () => {
    setBusy(true);
    try {
      await orders.cancelOrder(order.id, motivo.trim());
      setAsking(false);
      onChanged();
      Alert.alert('Orden anulada', `${order.numero} quedó anulada con su motivo.`);
    } catch (e) {
      Alert.alert('No se pudo anular', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.head}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.number}>{order.numero}</Text>
            <Text style={styles.title}>{ORDER_TYPE_LABEL[order.tipo]}</Text>
            <Text style={[styles.meta, cancelled && { color: colors.danger }]}>
              {cancelled ? 'Anulada' : PRIORITY_LABEL[order.prioridad]} · {localDay(order.fecha)} {localTime(order.fecha)} · {order.medicoNombre}
            </Text>
          </View>
          {canCancel && !cancelled ? (
            <Pressable
              onPress={() => Alert.alert('Más acciones', undefined, [{ text: 'Anular orden', style: 'destructive', onPress: () => setAsking(true) }, { text: 'Volver', style: 'cancel' }])}
              hitSlop={8}
              accessibilityLabel="Más acciones">
              <Text style={styles.more}>···</Text>
            </Pressable>
          ) : null}
        </View>
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
        {asking && (
          <Card style={{ gap: 10 }}>
            <Text style={styles.label}>Motivo de la anulación (obligatorio)</Text>
            <TextInput value={motivo} onChangeText={setMotivo} multiline placeholder="Ej.: dosis equivocada, se reformula" placeholderTextColor="#a29fae" style={styles.input} />
            <Button title="Anular orden" variant="danger" busy={busy} disabled={motivo.trim().length < 10} onPress={cancel} />
          </Card>
        )}
        <Button title="Cerrar" variant="secondary" onPress={onClose} />
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: colors.canvas, padding: 16, paddingTop: 24, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  number: { fontSize: 13, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  more: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  item: { fontSize: 15, color: colors.ink, lineHeight: 21 },
  input: { minHeight: 80, borderRadius: radius.control, backgroundColor: colors.canvas, padding: 12, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
});
