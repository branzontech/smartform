import { useState } from 'react';
import { showAlert } from '@/components/overlay/Overlay';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ORDER_TYPES, ORDER_TYPE_LABEL, PRIORITY_LABEL, describeItem, type Order, type OrderType } from '@kerhub/core/ordenes';
import { errorMessage, orders } from '@/lib/api';
import { Icon3D, type Icon3DName } from '@/components/Icon3D';
import { Notice } from '@/components/form/parts';
import { Button, Card } from '@/components/ui';
import { colors, radius } from '@/theme';
import { OrderDetail } from './OrderDetail';
import { OrderEditor } from './OrderEditor';

const ORDER_ICON: Record<OrderType, Icon3DName> = {
  medicamento: 'farmacia',
  laboratorio: 'laboratorio',
  imagenologia: 'imagenologia',
  procedimiento: 'cirugia',
  interconsulta: 'especialidades',
};

/** Órdenes de la atención: lista, nueva orden por tipo y detalle con anulación. */
export function OrdersPanel({ admisionId, canOrder, isAdmin }: { admisionId: string; canOrder: boolean; isAdmin: boolean }) {
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: ['ordenes', admisionId], queryFn: () => orders.fetchAdmissionOrders(admisionId) });
  const [choosing, setChoosing] = useState(false);
  const [editing, setEditing] = useState<OrderType | null>(null);
  const [viewing, setViewing] = useState<Order | null>(null);
  const list = query.data ?? [];

  return (
    <View style={{ gap: 12 }}>
      {query.isError ? <Notice>{errorMessage(query.error)}</Notice> : null}
      {!query.isLoading && list.length === 0 ? <Notice>Esta atención aún no tiene órdenes.</Notice> : null}
      {list.map((o) => {
        const cancelled = o.estadoRegistro !== 'active';
        return (
          <Pressable key={o.id} onPress={() => setViewing(o)}>
            <Card style={[styles.order, cancelled && { opacity: 0.55 }]}>
              <Icon3D name={ORDER_ICON[o.tipo]} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.number}>
                  {o.numero} · <Text style={{ color: cancelled ? colors.danger : colors.muted }}>{cancelled ? 'Anulada' : PRIORITY_LABEL[o.prioridad]}</Text>
                </Text>
                <Text style={styles.title}>{ORDER_TYPE_LABEL[o.tipo]}</Text>
                <Text style={styles.meta} numberOfLines={2}>
                  {o.items.map((i) => describeItem(o.tipo, i)).join('\n')}
                </Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
      {canOrder ? (
        <Button title="Nueva orden" onPress={() => setChoosing(true)} />
      ) : (
        <Notice>Las órdenes las hace el médico o el administrador.</Notice>
      )}

      <Modal visible={choosing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setChoosing(false)}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.sheetTitle}>Nueva orden</Text>
          {ORDER_TYPES.map((t) => (
            <Pressable
              key={t}
              style={styles.choice}
              onPress={() => {
                setChoosing(false);
                setEditing(t);
              }}>
              <Icon3D name={ORDER_ICON[t]} size={40} />
              <Text style={styles.title}>{ORDER_TYPE_LABEL[t]}</Text>
            </Pressable>
          ))}
          <View style={{ flex: 1 }} />
          <Button title="Cerrar" variant="secondary" onPress={() => setChoosing(false)} />
        </View>
      </Modal>

      {editing && (
        <OrderEditor
          admisionId={admisionId}
          tipo={editing}
          onClose={() => setEditing(null)}
          onSaved={(numero) => {
            setEditing(null);
            void query.refetch();
            showAlert('Orden guardada', `Quedó con el número ${numero}.`);
          }}
        />
      )}
      {viewing && (
        <OrderDetail
          order={viewing}
          canCancel={canOrder && (viewing.propia || isAdmin)}
          onClose={() => setViewing(null)}
          onChanged={() => {
            setViewing(null);
            void query.refetch();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  order: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  number: { fontSize: 13, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  sheet: { flex: 1, backgroundColor: colors.canvas, padding: 16, paddingTop: 24, gap: 10 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: colors.ink },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.control, backgroundColor: colors.surface, padding: 12 },
});
