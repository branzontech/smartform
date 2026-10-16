import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { agenda, attention, errorMessage, formats } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BraulioEmpty } from '@/components/Braulio';
import { Icon3D } from '@/components/Icon3D';
import { FormatEditor, type FormatHandle, type FormatState } from '@/components/attention/FormatEditor';
import { FormatList } from '@/components/attention/FormatList';
import { OrdersPanel } from '@/components/orders/OrdersPanel';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Button, Card } from '@/components/ui';
import { colors } from '@/theme';

/** Diligenciar la atención de una cita: sus formatos (los de la agenda y los que agregue el profesional). */
export default function Atencion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const citaQuery = useQuery({ queryKey: ['agenda', 'cita', id], queryFn: () => agenda.fetchCita(id) });
  const cita = citaQuery.data;
  const admisionId = cita?.admisionId ?? null;
  const formatsQuery = useQuery({
    queryKey: ['atencion', 'formatos', admisionId],
    enabled: !!admisionId,
    queryFn: () => formats.fetchAdmissionFormats(admisionId!),
  });
  const list = formatsQuery.data ?? [];
  const readOnly = cita?.estado !== 'en_atencion';

  const [active, setActive] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, FormatState>>({});
  const [finishing, setFinishing] = useState(false);
  const [section, setSection] = useState<'formatos' | 'ordenes'>('formatos');
  const handles = useRef<Record<string, FormatHandle>>({});
  const scrollRef = useRef<ScrollView>(null);
  const editorTop = useRef(0);

  useEffect(() => {
    if (!active && list.length > 0) setActive(list[0].formularioId);
  }, [active, list]);

  const onState = useCallback((fid: string, s: FormatState) => setStates((prev) => ({ ...prev, [fid]: s })), []);
  const register = useCallback((fid: string, h: FormatHandle | null) => {
    if (h) handles.current[fid] = h;
    else delete handles.current[fid];
  }, []);
  const scrollTo = useCallback((y: number) => scrollRef.current?.scrollTo({ y: Math.max(editorTop.current + y - 12, 0), animated: true }), []);

  const saveAll = useCallback(async () => {
    const results = await Promise.all(Object.values(handles.current).map((h) => h.save()));
    return results.every(Boolean);
  }, []);

  // Al salir de la pantalla se guarda lo pendiente de todos los formatos.
  useEffect(() => navigation.addListener('beforeRemove', () => void saveAll()), [navigation, saveAll]);

  const addFormat = async (formularioId: string) => {
    if (!admisionId) return;
    try {
      await formats.addAdmissionFormat(admisionId, formularioId);
      await formatsQuery.refetch();
      setActive(formularioId);
    } catch (e) {
      Alert.alert('No se pudo agregar', errorMessage(e));
    }
  };
  const removeFormat = async (formularioId: string) => {
    if (!admisionId) return;
    try {
      await formats.removeAdmissionFormat(admisionId, formularioId);
      if (active === formularioId) setActive(null);
      await formatsQuery.refetch();
    } catch (e) {
      Alert.alert('No se pudo quitar', errorMessage(e));
    }
  };

  const complete = async () => {
    if (!admisionId) return;
    setFinishing(true);
    try {
      if (!(await saveAll())) throw new Error('Algún formato no se pudo guardar. Revisa la conexión e intenta de nuevo.');
      await attention.completeAdmission(admisionId);
      await queryClient.invalidateQueries({ queryKey: ['agenda'] });
      Alert.alert('Atención terminada', 'Los formatos quedaron guardados y la cita, atendida.');
      router.back();
    } catch (e) {
      Alert.alert('No se pudo terminar', errorMessage(e));
    } finally {
      setFinishing(false);
    }
  };

  const finish = () => {
    // Obligatorios: diligenciados y completos. Opcionales: si se empezaron, completos.
    const problems = list.flatMap((f) => {
      const s = states[f.formularioId];
      if (!s?.loaded) return [{ f, why: 'aún está cargando' }];
      if (s.empty) return f.obligatorio ? [{ f, why: 'está sin diligenciar' }] : [];
      return s.missing > 0 ? [{ f, why: s.missing === 1 ? 'le falta 1 campo obligatorio' : `le faltan ${s.missing} campos obligatorios` }] : [];
    });
    if (problems.length > 0) {
      const first = problems[0].f.formularioId;
      setSection('formatos');
      setActive(first);
      setTimeout(() => handles.current[first]?.revealMissing(), 300);
      Alert.alert('Falta completar', problems.map((p) => `«${p.f.titulo}» ${p.why}.`).join('\n'));
      return;
    }
    Alert.alert('Terminar atención', 'Se guardan los formatos y la cita queda como atendida. Después ya no se editan desde la app.', [
      { text: 'Volver', style: 'cancel' },
      { text: 'Terminar', onPress: () => void complete() },
    ]);
  };

  if (citaQuery.isLoading || (admisionId && formatsQuery.isLoading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!cita) return <BraulioEmpty pose="formato" title="No se pudo cargar la cita" hint={errorMessage(citaQuery.error)} />;
  if (!admisionId) return <BraulioEmpty pose="formato" title="Esta cita no tiene atención" hint="La admisión se crea al agendar la cita en Ker Hub web." />;
  if (formatsQuery.isError) return <BraulioEmpty pose="formato" title="No se pudieron cargar los formatos" hint={errorMessage(formatsQuery.error)} />;
  if (!me) return null;

  const activeState = active ? states[active] : undefined;
  const statusLine =
    activeState?.status === 'saving'
      ? 'Guardando…'
      : activeState?.status === 'dirty'
        ? 'Cambios sin guardar'
        : activeState?.status === 'error'
          ? `No se pudo guardar: ${activeState.error ?? ''}`
          : activeState?.savedAt
            ? `Guardado a las ${activeState.savedAt}`
            : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
        <Card style={styles.hero}>
          <Icon3D name="historia-clinica" size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.title}>{cita.paciente}</Text>
            <Text style={styles.meta}>
              {cita.tipoDocumento ?? ''} {cita.documento ?? ''}
            </Text>
            {!readOnly && statusLine ? <Text style={[styles.meta, activeState?.status === 'error' && { color: colors.danger }]}>{statusLine}</Text> : null}
          </View>
        </Card>
        {readOnly && (
          <Text style={styles.notice}>
            {cita.estado === 'atendida' ? 'La atención ya terminó: los formatos son de solo lectura.' : 'Inicia la atención desde la cita para diligenciar los formatos.'}
          </Text>
        )}
        <SegmentedTabs
          options={[
            { value: 'formatos', label: 'Formatos' },
            { value: 'ordenes', label: 'Órdenes' },
          ]}
          value={section}
          onChange={setSection}
        />
        {section === 'ordenes' && (
          <OrdersPanel admisionId={admisionId} canOrder={!readOnly && ['admin', 'doctor'].includes(me.empresa?.rol ?? '')} isAdmin={me.empresa?.rol === 'admin'} />
        )}
        {section === 'formatos' && (
          <FormatList items={list} states={states} active={active} readOnly={readOnly} onSelect={setActive} onAdd={addFormat} onRemove={removeFormat} />
        )}
        <View
          style={section === 'formatos' ? undefined : { display: 'none' }}
          onLayout={(e) => {
            editorTop.current = e.nativeEvent.layout.y;
          }}>
          {list.map((f) => (
            <FormatEditor
              key={f.formularioId}
              cita={cita}
              formularioId={f.formularioId}
              medicoId={me.user.id}
              readOnly={readOnly}
              visible={f.formularioId === active}
              onState={onState}
              register={register}
              onScrollTo={scrollTo}
            />
          ))}
        </View>
      </ScrollView>
      {!readOnly && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <Button title="Terminar atención" busy={finishing} onPress={finish} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { padding: 16, gap: 12, paddingBottom: 32 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontSize: 19, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
  notice: { fontSize: 14, color: colors.muted, paddingHorizontal: 4 },
  footer: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
