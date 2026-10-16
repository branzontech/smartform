import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatLongDay, localDay, localTime } from '@kerhub/core/agenda';
import { summaryItems, type SummaryItem } from '@kerhub/core/forms';
import { ORDER_TYPE_LABEL, describeItem, type Order } from '@kerhub/core/ordenes';
import { agenda, attention, errorMessage, formats, orders } from '@/lib/api';
import { BraulioEmpty } from '@/components/Braulio';
import { Icon3D } from '@/components/Icon3D';
import { Button, Card } from '@/components/ui';
import { colors } from '@/theme';

/**
 * Resumen de la atención: lo que quedó guardado en cada formato y las órdenes.
 * Se abre al terminar la atención (para corroborar lo guardado) y desde «Ver atención».
 */
export default function ResumenAtencion() {
  const { id, recien } = useLocalSearchParams<{ id: string; recien?: string }>();
  const insets = useSafeAreaInsets();

  const citaQuery = useQuery({ queryKey: ['agenda', 'cita', id], queryFn: () => agenda.fetchCita(id) });
  const cita = citaQuery.data;
  const admisionId = cita?.admisionId ?? null;
  const formatsQuery = useQuery({
    queryKey: ['atencion', 'formatos', admisionId],
    enabled: !!admisionId,
    queryFn: () => formats.fetchAdmissionFormats(admisionId!),
  });
  const ordersQuery = useQuery({
    queryKey: ['ordenes', admisionId],
    enabled: !!admisionId,
    queryFn: () => orders.fetchAdmissionOrders(admisionId!),
  });
  const list = formatsQuery.data ?? [];
  const forms = useQueries({
    queries: list.map((f) => ({
      queryKey: ['atencion', 'resumen', admisionId, f.formularioId],
      queryFn: () => attention.loadForm({ formularioId: f.formularioId, pacienteId: cita!.pacienteId, admisionId: admisionId! }),
      enabled: !!cita && !!admisionId,
    })),
  });

  const goHome = () => {
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/mi-dia');
  };

  if (citaQuery.isLoading || formatsQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!cita) return <BraulioEmpty pose="formato" title="No se pudo cargar la cita" hint={errorMessage(citaQuery.error)} />;
  if (!admisionId) return <BraulioEmpty pose="formato" title="Esta cita no tiene atención" hint="La admisión se crea al agendar la cita en Doctor Ker web." />;

  const justFinished = recien === '1';
  const activeOrders = (ordersQuery.data ?? []).filter((o) => o.estadoRegistro === 'active');
  const cancelledOrders = (ordersQuery.data ?? []).filter((o) => o.estadoRegistro !== 'active');

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={styles.page}>
        <Card style={styles.hero}>
          <Icon3D name="historia-clinica" size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            {justFinished && <Text style={styles.done}>Atención terminada y guardada</Text>}
            <Text style={styles.title}>{cita.paciente}</Text>
            <Text style={styles.meta}>
              {cita.tipoDocumento ?? ''} {cita.documento ?? ''}
            </Text>
            <Text style={styles.meta}>
              {formatLongDay(localDay(cita.inicio))} · {localTime(cita.inicio)}
              {cita.servicio ? ` · ${cita.servicio}` : ''}
            </Text>
          </View>
        </Card>

        {list.map((f, i) => {
          const q = forms[i];
          const items = q?.data ? summaryItems(q.data.questions, q.data.formData) : [];
          return (
            <Card key={f.formularioId} style={styles.block}>
              <Text style={styles.blockTitle}>{f.titulo}</Text>
              {q?.isLoading ? (
                <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} />
              ) : q?.isError ? (
                <Text style={styles.error}>No se pudo cargar: {errorMessage(q.error)}</Text>
              ) : items.length === 0 ? (
                <Text style={styles.empty}>Sin diligenciar</Text>
              ) : (
                items.map((it, j) => <SummaryRow key={it.id} item={it} first={j === 0 || items[j - 1].kind === 'section'} />)
              )}
            </Card>
          );
        })}

        <Card style={styles.block}>
          <Text style={styles.blockTitle}>Órdenes</Text>
          {ordersQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} />
          ) : ordersQuery.isError ? (
            <Text style={styles.error}>No se pudieron cargar: {errorMessage(ordersQuery.error)}</Text>
          ) : activeOrders.length === 0 && cancelledOrders.length === 0 ? (
            <Text style={styles.empty}>No se dieron órdenes en esta atención</Text>
          ) : (
            [...activeOrders, ...cancelledOrders].map((o, j) => <OrderLines key={o.id} order={o} first={j === 0} />)
          )}
        </Card>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Button title="Volver a Mi día" size="sm" onPress={goHome} />
      </View>
    </View>
  );
}

/** Una pieza del formato tal como se diligenció: sección, respuesta o signos vitales en baldosas. */
function SummaryRow({ item, first }: { item: SummaryItem; first: boolean }) {
  if (item.kind === 'section') return <Text style={styles.section}>{item.title}</Text>;
  if (item.kind === 'vitals') {
    return (
      <View style={[styles.lineLong, !first && styles.divider]}>
        <Text style={styles.lineLabel}>{item.label}</Text>
        <View style={styles.vitals}>
          {item.readings.map((r) => (
            <View key={r.key} style={styles.vital}>
              <Text style={styles.vitalLabel}>{r.label}</Text>
              <Text style={styles.vitalValue}>
                {r.value} <Text style={styles.vitalUnit}>{r.unit}</Text>
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.lineLong, !first && styles.divider]}>
      <Text style={styles.lineLabel}>{item.label}</Text>
      <Text style={styles.lineValue}>{item.value}</Text>
    </View>
  );
}

function OrderLines({ order, first }: { order: Order; first: boolean }) {
  const cancelled = order.estadoRegistro !== 'active';
  return (
    <View style={[styles.lineLong, !first && styles.divider]}>
      <Text style={styles.lineLabel}>
        {ORDER_TYPE_LABEL[order.tipo]} · {order.numero}
        {cancelled ? ' · Anulada' : ''}
      </Text>
      {order.items.map((it, k) => (
        <Text key={k} style={[styles.lineValue, cancelled && { color: colors.muted }]}>
          {describeItem(order.tipo, it)}
        </Text>
      ))}
      {order.indicaciones ? <Text style={styles.meta}>{order.indicaciones}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { padding: 16, gap: 12, paddingBottom: 32 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  done: { fontSize: 14, fontWeight: '700', color: colors.success },
  title: { fontSize: 19, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
  block: { gap: 0 },
  blockTitle: { fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  section: { fontSize: 16, fontWeight: '800', color: colors.primary, marginTop: 14, marginBottom: 2, letterSpacing: -0.2 },
  vitals: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  vital: { width: '48%', flexGrow: 1, borderRadius: 12, backgroundColor: colors.canvas, paddingHorizontal: 12, paddingVertical: 9, gap: 1 },
  vitalLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },
  vitalValue: { fontSize: 19, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  vitalUnit: { fontSize: 12, fontWeight: '500', color: colors.muted },
  lineLong: { gap: 4, paddingVertical: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  lineLabel: { fontSize: 13, fontWeight: '600', color: colors.muted },
  lineValue: { fontSize: 15, color: colors.ink, lineHeight: 21 },
  empty: { fontSize: 14, color: colors.muted },
  error: { fontSize: 14, color: colors.danger },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
