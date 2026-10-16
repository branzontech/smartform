import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formHasAnswers, isAnswerable, missingRequired, visibleQuestions, withDerivedValues, type FormAnswers } from '@kerhub/core/forms';
import { agenda, attention, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BraulioEmpty } from '@/components/Braulio';
import { Icon3D } from '@/components/Icon3D';
import { QuestionView } from '@/components/form/QuestionView';
import { Button, Card } from '@/components/ui';
import { colors } from '@/theme';

/** Espera tras el último cambio antes de guardar solo. */
const AUTOSAVE_DELAY_MS = 2500;

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const clock = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

/** Diligenciar la atención de una cita con su formato (historia clínica). */
export default function Atencion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const citaQuery = useQuery({ queryKey: ['agenda', 'cita', id], queryFn: () => agenda.fetchCita(id) });
  const cita = citaQuery.data;
  const ready = !!cita?.admisionId && !!cita?.formularioId;
  const formQuery = useQuery({
    queryKey: ['atencion', id, cita?.admisionId],
    enabled: ready,
    staleTime: Infinity,
    gcTime: 0,
    queryFn: () => attention.loadForm({ formularioId: cita!.formularioId!, pacienteId: cita!.pacienteId, admisionId: cita!.admisionId! }),
  });
  const form = formQuery.data;
  const readOnly = cita?.estado !== 'en_atencion';

  const [data, setData] = useState<FormAnswers>({});
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const dataRef = useRef(data);
  dataRef.current = data;
  const statusRef = useRef(status);
  statusRef.current = status;
  const responseIdRef = useRef<string | null>(null);
  const versionRef = useRef(0);
  const savingRef = useRef<Promise<boolean> | null>(null);
  const lastErrorRef = useRef('');
  const positions = useRef<Record<string, number>>({});
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!form) return;
    setData(withDerivedValues(form.questions, form.formData));
    responseIdRef.current = form.responseId;
    setStatus('idle');
  }, [form]);

  const save = useCallback((): Promise<boolean> => {
    if (!form || !cita?.admisionId || !me || readOnly) return Promise.resolve(true);
    if (savingRef.current) return savingRef.current;
    const startVersion = versionRef.current;
    const run = (async () => {
      setStatus('saving');
      try {
        responseIdRef.current = await attention.saveResponse({
          form,
          responseId: responseIdRef.current,
          pacienteId: cita.pacienteId,
          admisionId: cita.admisionId!,
          medicoId: me.user.id,
          formData: dataRef.current,
        });
        setSavedAt(clock());
        setStatus(versionRef.current === startVersion ? 'saved' : 'dirty');
        return true;
      } catch (e) {
        lastErrorRef.current = errorMessage(e);
        setStatus('error');
        return false;
      } finally {
        savingRef.current = null;
      }
    })();
    savingRef.current = run;
    return run;
  }, [form, cita, me, readOnly]);

  const set = useCallback(
    (key: string, value: unknown) => {
      if (readOnly || !form) return;
      versionRef.current += 1;
      setData((prev) => withDerivedValues(form.questions, { ...prev, [key]: value }));
      setStatus('dirty');
    },
    [readOnly, form],
  );

  // Autoguardado: unos segundos después del último cambio.
  useEffect(() => {
    if (status !== 'dirty' || !form) return;
    const t = setTimeout(() => {
      if (formHasAnswers(form.questions, dataRef.current)) void save();
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [data, status, form, save]);

  // Al salir de la pantalla se guarda lo pendiente.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', () => {
        if (statusRef.current === 'dirty' || statusRef.current === 'error') void save();
      }),
    [navigation, save],
  );

  const missingIds = useMemo(
    () => new Set(showMissing && form ? missingRequired(form.questions.filter(isAnswerable), data).map((q) => q.id) : []),
    [showMissing, form, data],
  );

  const complete = async () => {
    if (!cita?.admisionId) return;
    setFinishing(true);
    try {
      if (!(await save())) throw new Error(lastErrorRef.current || 'No se pudo guardar el formato.');
      await attention.completeAdmission(cita.admisionId);
      await queryClient.invalidateQueries({ queryKey: ['agenda'] });
      Alert.alert('Atención terminada', 'El formato quedó guardado y la cita, atendida.');
      router.back();
    } catch (e) {
      Alert.alert('No se pudo terminar', errorMessage(e));
    } finally {
      setFinishing(false);
    }
  };

  const finish = () => {
    if (!form) return;
    if (!formHasAnswers(form.questions, data)) {
      Alert.alert('El formato está vacío', 'Diligencia la atención antes de terminarla.');
      return;
    }
    const missing = missingRequired(form.questions.filter(isAnswerable), data);
    if (missing.length > 0) {
      setShowMissing(true);
      const y = positions.current[missing[0].id];
      if (y != null) scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
      Alert.alert(missing.length === 1 ? 'Falta 1 campo obligatorio' : `Faltan ${missing.length} campos obligatorios`, 'Están marcados en rojo.');
      return;
    }
    Alert.alert('Terminar atención', 'Se guarda el formato y la cita queda como atendida. Después ya no se edita desde la app.', [
      { text: 'Volver', style: 'cancel' },
      { text: 'Terminar', onPress: () => void complete() },
    ]);
  };

  if (citaQuery.isLoading || (ready && formQuery.isLoading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!cita) {
    return <BraulioEmpty pose="formato" title="No se pudo cargar la cita" hint={errorMessage(citaQuery.error)} />;
  }
  if (!ready) {
    return <BraulioEmpty pose="formato" title="Esta cita no tiene formato" hint="Asigna la historia clínica al agendar la cita en Ker Hub web." />;
  }
  if (!form) {
    return <BraulioEmpty pose="formato" title="No se pudo cargar el formato" hint={errorMessage(formQuery.error)} />;
  }

  const statusText =
    status === 'saving'
      ? 'Guardando…'
      : status === 'dirty'
        ? 'Cambios sin guardar'
        : status === 'error'
          ? `No se pudo guardar: ${lastErrorRef.current}`
          : savedAt
            ? `Guardado a las ${savedAt}`
            : form.responseId
              ? 'Guardado'
              : 'Aún sin guardar';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets>
        <Card style={styles.hero}>
          <Icon3D name="historia-clinica" size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.title}>{form.title}</Text>
            <Text style={styles.meta}>
              {cita.paciente}
              {cita.documento ? ` · ${cita.tipoDocumento ?? ''} ${cita.documento}` : ''}
            </Text>
            {!readOnly && <Text style={[styles.meta, status === 'error' && { color: colors.danger }]}>{statusText}</Text>}
          </View>
        </Card>
        {readOnly && (
          <Text style={styles.notice}>
            {cita.estado === 'atendida' ? 'La atención ya terminó: el formato es de solo lectura.' : 'Inicia la atención desde la cita para diligenciar el formato.'}
          </Text>
        )}
        {visibleQuestions(form.questions, data).map((q) => (
          <View
            key={q.id}
            onLayout={(e) => {
              positions.current[q.id] = e.nativeEvent.layout.y;
            }}>
            <QuestionView q={q} data={data} all={form.questions} set={set} readOnly={readOnly} missing={missingIds.has(q.id)} />
          </View>
        ))}
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
