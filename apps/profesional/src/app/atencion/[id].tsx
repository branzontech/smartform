import { useCallback, useEffect, useRef, useState } from 'react';
import { showAlert, showNotice } from '@/components/overlay/Overlay';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { agenda, attention, errorMessage, formats } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BraulioEmpty } from '@/components/Braulio';
import { Icon3D } from '@/components/Icon3D';
import { FormatEditor, type FormatHandle, type FormatState } from '@/components/attention/FormatEditor';
import { FormatList, statusText } from '@/components/attention/FormatList';
import { BottomSheet } from '@/components/overlay/BottomSheet';
import { OrdersPanel } from '@/components/orders/OrdersPanel';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Button, Card } from '@/components/ui';
import { colors, radius } from '@/theme';

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
  const [choosing, setChoosing] = useState(false);
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

  // Si un formato no se pudo guardar solo, se avisa en el centro (una vez por fallo).
  const warnedError = useRef<Record<string, boolean>>({});
  useEffect(() => {
    for (const f of list) {
      const s = states[f.formularioId];
      if (s?.status === 'error' && !warnedError.current[f.formularioId]) {
        warnedError.current[f.formularioId] = true;
        showNotice({ title: 'No se pudo guardar', message: `«${f.titulo}»: ${s.error ?? 'revisa la conexión'}. Lo escrito sigue en pantalla y se reintenta con el próximo cambio.` });
      } else if (s && s.status !== 'error') {
        warnedError.current[f.formularioId] = false;
      }
    }
  }, [list, states]);

  // Al salir de la pantalla se guarda lo pendiente de todos los formatos.
  useEffect(() => navigation.addListener('beforeRemove', () => void saveAll()), [navigation, saveAll]);

  const addFormat = async (formularioId: string) => {
    if (!admisionId) return;
    try {
      await formats.addAdmissionFormat(admisionId, formularioId);
      await formatsQuery.refetch();
      setActive(formularioId);
    } catch (e) {
      showNotice({ title: 'No se pudo agregar el formato', message: errorMessage(e) });
    }
  };
  const removeFormat = async (formularioId: string) => {
    if (!admisionId) return;
    try {
      await formats.removeAdmissionFormat(admisionId, formularioId);
      if (active === formularioId) setActive(null);
      await formatsQuery.refetch();
    } catch (e) {
      showNotice({ title: 'No se pudo quitar el formato', message: errorMessage(e) });
    }
  };

  const complete = async () => {
    if (!admisionId) return;
    setFinishing(true);
    try {
      if (!(await saveAll())) throw new Error('Algún formato no se pudo guardar. Revisa la conexión e intenta de nuevo.');
      await attention.completeAdmission(admisionId);
      await queryClient.invalidateQueries({ queryKey: ['agenda'] });
      router.replace({ pathname: '/atencion/resumen/[id]', params: { id, recien: '1' } });
    } catch (e) {
      showNotice({ title: 'No se pudo terminar la atención', message: errorMessage(e) });
    } finally {
      setFinishing(false);
    }
  };

  // Obligatorios: diligenciados y completos. Opcionales: si se empezaron, completos.
  const problems = list.flatMap((f) => {
    const s = states[f.formularioId];
    if (!s?.loaded) return [{ f, why: 'aún está cargando' }];
    if (s.empty) return f.obligatorio ? [{ f, why: 'está sin diligenciar' }] : [];
    return s.missing > 0 ? [{ f, why: s.missing === 1 ? 'le falta 1 campo obligatorio' : `le faltan ${s.missing} campos obligatorios` }] : [];
  });

  /** Abre un formato desde su comienzo, esté donde esté el profesional. */
  const goToFormat = (formularioId: string) => {
    setSection('formatos');
    setActive(formularioId);
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(editorTop.current - 12, 0), animated: true }), 60);
  };

  /** Lleva a lo primero que falta: el formato pendiente y, si ya se empezó, su primer campo obligatorio vacío. */
  const goToPending = () => {
    const first = problems[0];
    if (!first) return;
    goToFormat(first.f.formularioId);
    if (!states[first.f.formularioId]?.empty) setTimeout(() => handles.current[first.f.formularioId]?.revealMissing(), 260);
    const rest = problems.length - 1;
    showAlert(`«${first.f.titulo}» ${first.why}`, rest > 0 ? `Y ${rest} formato${rest > 1 ? 's' : ''} más por completar.` : undefined);
  };

  const finish = () => {
    if (problems.length > 0) {
      goToPending();
      return;
    }
    showAlert('Terminar atención', 'Se guardan los formatos y la cita queda como atendida. Después ya no se editan desde la app.', [
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
  const saveTone =
    activeState?.status === 'error' ? colors.danger : activeState?.status === 'saving' || activeState?.status === 'dirty' ? colors.muted : colors.success;
  const activeIndex = list.findIndex((f) => f.formularioId === active);
  const activeFormat = list[activeIndex];
  const nextFormat = activeIndex >= 0 ? list[activeIndex + 1] : undefined;
  const pendingCount = new Set(problems.map((p) => p.f.formularioId)).size;

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
        {/* Al final del formato: seguir con el siguiente sin volver arriba. */}
        {section === 'formatos' && activeFormat && (nextFormat || !readOnly) && (
          <Card style={styles.next}>
            {nextFormat ? (
              <>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.nextHint}>Siguiente formato</Text>
                  <Text style={styles.nextTitle} numberOfLines={2}>
                    {nextFormat.titulo}
                  </Text>
                </View>
                <Button size="sm" title="Continuar" onPress={() => goToFormat(nextFormat.formularioId)} />
              </>
            ) : (
              <>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.nextHint}>Último formato</Text>
                  <Text style={styles.nextTitle}>{pendingCount > 0 ? 'Aún hay formatos por completar' : 'Todo listo para terminar'}</Text>
                </View>
                <Button size="sm" variant={pendingCount > 0 ? 'secondary' : 'primary'} title={pendingCount > 0 ? 'Ir a lo que falta' : 'Terminar atención'} busy={finishing} onPress={finish} />
              </>
            )}
          </Card>
        )}
      </ScrollView>
      {!readOnly && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <Pressable style={styles.current} onPress={() => setChoosing(true)} accessibilityRole="button" accessibilityHint="Cambiar de formato">
            <Text style={styles.currentHint} numberOfLines={1}>
              {activeFormat ? `Formato ${activeIndex + 1} de ${list.length} · cambiar` : 'Formatos'}
            </Text>
            <Text style={styles.currentTitle} numberOfLines={1}>
              {activeFormat?.titulo ?? '—'}
            </Text>
            <Text style={[styles.saveText, { color: saveTone }]} numberOfLines={1}>
              {statusLine ?? 'Se guarda solo mientras escribes'}
            </Text>
          </Pressable>
          {pendingCount > 0 ? (
            <Button title="Ir a lo que falta" size="sm" variant="secondary" onPress={goToPending} />
          ) : (
            <Button title="Terminar atención" size="sm" busy={finishing} onPress={finish} />
          )}
        </View>
      )}
      <BottomSheet visible={choosing} onClose={() => setChoosing(false)} size="auto" title="Formatos de la atención">
        <View style={styles.sheet}>
          {list.map((f, i) => {
            const st = statusText(f, states[f.formularioId]);
            const selected = f.formularioId === active;
            return (
              <Pressable
                key={f.formularioId}
                style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  setChoosing(false);
                  goToFormat(f.formularioId);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}>
                <Text style={[styles.nextTitle, selected && { color: colors.primary }]} numberOfLines={2}>
                  {i + 1}. {f.titulo}
                </Text>
                <Text style={[styles.currentHint, { color: st.color }]}>
                  {st.label}
                  {f.obligatorio ? ' · obligatorio' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  saveText: { fontSize: 12, fontWeight: '600' },
  current: { flex: 1, gap: 1 },
  currentHint: { fontSize: 12, color: colors.muted },
  currentTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  next: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextHint: { fontSize: 13, fontWeight: '600', color: colors.muted },
  nextTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  sheet: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  choice: { borderRadius: radius.control, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 12, gap: 2 },
  choiceSelected: { backgroundColor: colors.primarySoft },
});
