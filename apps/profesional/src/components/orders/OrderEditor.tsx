import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DOSE_UNITS,
  ORDER_TYPE_LABEL,
  PRIORITY_LABEL,
  ROUTES,
  ROUTE_LABEL,
  type CatalogMedication,
  type CatalogProcedure,
  type MedicationInput,
  type OrderType,
  type Priority,
} from '@kerhub/core/ordenes';
import type { SelectedDiagnosis } from '@kerhub/core/forms';
import { attention, errorMessage, orders } from '@/lib/api';
import { Field, Notice, OptionRow, decimal } from '@/components/form/parts';
import { Button, Card } from '@/components/ui';
import { colors } from '@/theme';
import { CatalogSearch } from './CatalogSearch';
import { SelectField } from './SelectField';

type Draft = Omit<MedicationInput, 'dosis' | 'frecuenciaHoras' | 'duracionDias'> & { dosis: string; frecuenciaHoras: string; duracionDias: string };
type ProcDraft = { item: CatalogProcedure; cantidad: number };

const PRIORITIES: Priority[] = ['routine', 'asap', 'urgent', 'stat'];
const ROUTE_FROM_CATALOG: Record<string, string> = { ORAL: 'oral', INTRAVENOSA: 'IV', INTRAMUSCULAR: 'IM', SUBCUTANEA: 'SC', TOPICA: 'tópica', INHALACION: 'inhalatoria', RECTAL: 'rectal', SUBLINGUAL: 'sublingual', OFTALMICA: 'oftálmica', OTICA: 'ótica' };
const plain = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

const emptyDraft = (nombre = '', productoId: string | null = null): Draft => ({ productoId, nombre, dosis: '', unidad: 'mg', via: 'oral', frecuenciaHoras: '8', duracionDias: '7', indicaciones: null });

function fromCatalog(m: CatalogMedication): Draft {
  const amount = (m.concentracion ?? '').split(' ')[0];
  const unit = DOSE_UNITS.find((u) => u.toLowerCase() === (m.unidad ?? '').toLowerCase()) ?? 'mg';
  return { ...emptyDraft(m.nombre, m.id), dosis: /^\d+(\.\d+)?$/.test(amount) ? amount : '', unidad: unit, via: ROUTE_FROM_CATALOG[plain(m.via ?? '')] ?? 'oral' };
}

/** Editor de una orden nueva, a pantalla completa. Guarda en una sola llamada. */
export function OrderEditor({ admisionId, tipo, onClose, onSaved }: { admisionId: string; tipo: OrderType; onClose: () => void; onSaved: (numero: string) => void }) {
  const insets = useSafeAreaInsets();
  const [prioridad, setPrioridad] = useState<Priority>('routine');
  const [indicaciones, setIndicaciones] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [diagnostico, setDiagnostico] = useState<SelectedDiagnosis | null>(null);
  const [meds, setMeds] = useState<Draft[]>([]);
  const [procs, setProcs] = useState<ProcDraft[]>([]);
  const [searching, setSearching] = useState<'med' | 'proc' | 'dx' | null>(null);
  const [saving, setSaving] = useState(false);

  const setMed = (i: number, patch: Partial<Draft>) => setMeds((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const removeMed = (i: number) =>
    Alert.alert('Quitar medicamento', meds[i]?.nombre, [
      { text: 'Volver', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => setMeds((prev) => prev.filter((_, j) => j !== i)) },
    ]);

  const save = async () => {
    setSaving(true);
    try {
      const base = { admisionId, tipo, prioridad, indicaciones: indicaciones.trim() || null, diagnostico: diagnostico ? { codigo: diagnostico.codigo, descripcion: diagnostico.descripcion } : null };
      const input =
        tipo === 'medicamento'
          ? {
              ...base,
              medicamentos: meds.map((m) => ({
                productoId: m.productoId,
                nombre: m.nombre.trim(),
                dosis: Number(m.dosis),
                unidad: m.unidad,
                via: m.via,
                frecuenciaHoras: Number(m.frecuenciaHoras),
                duracionDias: Number(m.duracionDias),
                indicaciones: m.indicaciones?.trim() || null,
              })),
            }
          : tipo === 'interconsulta'
            ? { ...base, especialidad: especialidad.trim() || null }
            : { ...base, procedimientos: procs.map((p) => ({ procedimientoId: p.item.id, cantidad: p.cantidad, notas: null })) };
      const created = await orders.createOrder(input);
      onSaved(created.numero);
    } catch (e) {
      Alert.alert('No se pudo guardar la orden', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const catalogType = tipo === 'laboratorio' || tipo === 'imagenologia' || tipo === 'procedimiento' ? tipo : null;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          <Text style={styles.title}>{ORDER_TYPE_LABEL[tipo]}</Text>

          {tipo === 'medicamento' && (
            <>
              {meds.map((m, i) => (
                <Card key={i} style={{ gap: 10 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemTitle}>{m.nombre || `Medicamento ${i + 1}`}</Text>
                    <Pressable onPress={() => removeMed(i)} hitSlop={8} accessibilityLabel="Más acciones">
                      <Text style={styles.more}>···</Text>
                    </Pressable>
                  </View>
                  {!m.productoId && <Field value={m.nombre} onChangeText={(t) => setMed(i, { nombre: t })} placeholder="Nombre y concentración" />}
                  <View style={styles.row}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.label}>Dosis</Text>
                      <Field value={m.dosis} onChangeText={(t) => setMed(i, { dosis: decimal(t) })} keyboardType="decimal-pad" placeholder="50" />
                    </View>
                    <SelectField label="Unidad" value={m.unidad} options={DOSE_UNITS.map((u) => ({ value: u, label: u }))} onChange={(u) => setMed(i, { unidad: u })} />
                  </View>
                  <SelectField label="Vía" value={m.via} options={ROUTES.map((r) => ({ value: r, label: ROUTE_LABEL[r] }))} onChange={(v) => setMed(i, { via: v })} />
                  <View style={styles.row}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.label}>Cada (horas)</Text>
                      <Field value={m.frecuenciaHoras} onChangeText={(t) => setMed(i, { frecuenciaHoras: t.replace(/\D/g, '') })} keyboardType="number-pad" />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.label}>Durante (días)</Text>
                      <Field value={m.duracionDias} onChangeText={(t) => setMed(i, { duracionDias: t.replace(/\D/g, '') })} keyboardType="number-pad" />
                    </View>
                  </View>
                  <Field value={m.indicaciones ?? ''} onChangeText={(t) => setMed(i, { indicaciones: t })} placeholder="Indicaciones (opcional)" />
                </Card>
              ))}
              <Button title={meds.length ? 'Agregar otro medicamento' : 'Agregar medicamento'} variant="secondary" onPress={() => setSearching('med')} />
            </>
          )}

          {catalogType && (
            <>
              {procs.map((p, i) => (
                <Card key={p.item.id} style={styles.procRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.code}>{p.item.codigo}</Text>
                    <Text style={styles.itemText}>{p.item.descripcion}</Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() =>
                        p.cantidad > 1
                          ? setProcs((prev) => prev.map((x, j) => (j === i ? { ...x, cantidad: x.cantidad - 1 } : x)))
                          : Alert.alert('Quitar', p.item.descripcion, [
                              { text: 'Volver', style: 'cancel' },
                              { text: 'Quitar', style: 'destructive', onPress: () => setProcs((prev) => prev.filter((_, j) => j !== i)) },
                            ])
                      }
                      style={styles.stepBtn}
                      accessibilityLabel="Menos">
                      <Text style={styles.stepText}>−</Text>
                    </Pressable>
                    <Text style={styles.qty}>{p.cantidad}</Text>
                    <Pressable onPress={() => setProcs((prev) => prev.map((x, j) => (j === i ? { ...x, cantidad: Math.min(99, x.cantidad + 1) } : x)))} style={styles.stepBtn} accessibilityLabel="Más">
                      <Text style={styles.stepText}>+</Text>
                    </Pressable>
                  </View>
                </Card>
              ))}
              <Button title="Buscar en el catálogo CUPS" variant="secondary" onPress={() => setSearching('proc')} />
            </>
          )}

          {tipo === 'interconsulta' && (
            <Card style={{ gap: 8 }}>
              <Text style={styles.label}>Especialidad</Text>
              <Field value={especialidad} onChangeText={setEspecialidad} placeholder="Ej.: Ortopedia, Cardiología, Psiquiatría" />
            </Card>
          )}

          <Card style={{ gap: 8 }}>
            <Text style={styles.label}>Diagnóstico (CIE-10)</Text>
            {diagnostico ? (
              <Pressable onPress={() => setDiagnostico(null)} accessibilityHint="Toca para quitarlo">
                <Text style={styles.itemText}>
                  <Text style={styles.code}>{diagnostico.codigo}</Text> {diagnostico.descripcion}
                </Text>
              </Pressable>
            ) : (
              <Button title="Buscar diagnóstico" variant="secondary" onPress={() => setSearching('dx')} />
            )}
          </Card>

          <Card style={{ gap: 8 }}>
            <Text style={styles.label}>Prioridad</Text>
            {PRIORITIES.map((p) => (
              <OptionRow key={p} label={PRIORITY_LABEL[p]} kind="radio" selected={prioridad === p} onPress={() => setPrioridad(p)} />
            ))}
          </Card>

          <Card style={{ gap: 8 }}>
            <Text style={styles.label}>{tipo === 'interconsulta' ? 'Motivo de la interconsulta' : 'Indicaciones generales (opcional)'}</Text>
            <Field value={indicaciones} onChangeText={setIndicaciones} multiline placeholder={tipo === 'interconsulta' ? 'Qué se pide valorar y por qué' : 'Indicaciones para el paciente o el laboratorio'} />
          </Card>
          {tipo === 'medicamento' && meds.length === 0 ? <Notice>Agrega al menos un medicamento para guardar la fórmula.</Notice> : null}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <View style={{ flex: 1 }}>
            <Button title="Cancelar" variant="secondary" onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Guardar orden" busy={saving} onPress={save} />
          </View>
        </View>

        <CatalogSearch<CatalogMedication>
          open={searching === 'med'}
          title="Agregar medicamento"
          placeholder="Nombre genérico o principio activo"
          queryKey="catalogo-medicamentos"
          search={(t) => orders.searchMedications(t)}
          keyOf={(m) => m.id}
          render={(m) => (
            <>
              <Text style={styles.itemTitle}>{m.nombre}</Text>
              <Text style={styles.meta}>{[m.forma, m.via].filter(Boolean).join(' · ').toLowerCase()}</Text>
            </>
          )}
          onPick={(m) => {
            setMeds((prev) => [...prev, fromCatalog(m)]);
            setSearching(null);
          }}
          footer={(term) =>
            term.length >= 2 ? (
              <Button
                title={`Escribir «${term}» sin catálogo`}
                variant="secondary"
                onPress={() => {
                  setMeds((prev) => [...prev, emptyDraft(term)]);
                  setSearching(null);
                }}
              />
            ) : null
          }
          onClose={() => setSearching(null)}
        />
        {catalogType && (
          <CatalogSearch<CatalogProcedure>
            open={searching === 'proc'}
            title={ORDER_TYPE_LABEL[tipo]}
            placeholder="Código CUPS o nombre"
            queryKey={`cups-${catalogType}`}
            search={(t) => orders.searchProcedures(catalogType, t)}
            keyOf={(p) => p.id}
            render={(p) => (
              <>
                <Text style={styles.code}>{p.codigo}</Text>
                <Text style={styles.itemText}>{p.descripcion}</Text>
              </>
            )}
            onPick={(p) => {
              setProcs((prev) => (prev.some((x) => x.item.id === p.id) ? prev : [...prev, { item: p, cantidad: 1 }]));
              setSearching(null);
            }}
            onClose={() => setSearching(null)}
          />
        )}
        <CatalogSearch<SelectedDiagnosis>
          open={searching === 'dx'}
          title="Diagnóstico"
          placeholder="Código o nombre (CIE-10)"
          queryKey="diagnosticos"
          search={(t) => attention.searchDiagnoses(t)}
          keyOf={(d) => d.codigo}
          render={(d) => (
            <Text style={styles.itemText}>
              <Text style={styles.code}>{d.codigo}</Text> {d.descripcion}
            </Text>
          )}
          onPick={(d) => {
            setDiagnostico(d);
            setSearching(null);
          }}
          onClose={() => setSearching(null)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  row: { flexDirection: 'row', gap: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  itemText: { fontSize: 15, color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  code: { fontSize: 13, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },
  more: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  procRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20, color: colors.primary, fontWeight: '700', marginTop: -2 },
  qty: { minWidth: 22, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
