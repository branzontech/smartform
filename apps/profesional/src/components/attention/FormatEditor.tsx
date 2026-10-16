import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { formHasAnswers, isAnswerable, missingRequired, visibleQuestions, withDerivedValues, type FormAnswers } from '@kerhub/core/forms';
import type { Cita } from '@kerhub/core/agenda';
import { attention, errorMessage } from '@/lib/api';
import { QuestionView } from '@/components/form/QuestionView';
import { colors } from '@/theme';

/** Espera tras el último cambio antes de guardar solo. */
const AUTOSAVE_DELAY_MS = 2500;

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

/** Estado de un formato para la lista y el cierre de la atención. */
export interface FormatState {
  loaded: boolean;
  empty: boolean;
  missing: number;
  status: SaveStatus;
  savedAt: string | null;
  error: string | null;
}

/** Lo que la pantalla de atención le pide a cada formato al terminar. */
export interface FormatHandle {
  save: () => Promise<boolean>;
  revealMissing: () => void;
}

const clock = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

/**
 * Un formato de la atención: carga lo guardado, recalcula lo derivado, se guarda
 * solo unos segundos después de cada cambio y avisa su estado a la pantalla.
 * Se queda montado aunque no se vea, para no perder lo escrito al cambiar de formato.
 */
export function FormatEditor({
  cita,
  formularioId,
  medicoId,
  readOnly,
  visible,
  onState,
  register,
  onScrollTo,
}: {
  cita: Cita;
  formularioId: string;
  medicoId: string;
  readOnly: boolean;
  visible: boolean;
  onState: (id: string, state: FormatState) => void;
  register: (id: string, handle: FormatHandle | null) => void;
  onScrollTo: (y: number) => void;
}) {
  const formQuery = useQuery({
    queryKey: ['atencion', cita.admisionId, formularioId],
    staleTime: Infinity,
    gcTime: 0,
    queryFn: () => attention.loadForm({ formularioId, pacienteId: cita.pacienteId, admisionId: cita.admisionId! }),
  });
  const form = formQuery.data;

  const [data, setData] = useState<FormAnswers>({});
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const responseIdRef = useRef<string | null>(null);
  const versionRef = useRef(0);
  const savingRef = useRef<Promise<boolean> | null>(null);
  const errorRef = useRef<string | null>(null);
  const positions = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!form) return;
    setData(withDerivedValues(form.questions, form.formData));
    responseIdRef.current = form.responseId;
    setStatus('idle');
  }, [form]);

  const save = useCallback((): Promise<boolean> => {
    if (!form || readOnly || !cita.admisionId) return Promise.resolve(true);
    if (!formHasAnswers(form.questions, dataRef.current) && !responseIdRef.current) return Promise.resolve(true);
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
          medicoId,
          formData: dataRef.current,
        });
        errorRef.current = null;
        setSavedAt(clock());
        setStatus(versionRef.current === startVersion ? 'saved' : 'dirty');
        return true;
      } catch (e) {
        errorRef.current = errorMessage(e);
        setStatus('error');
        return false;
      } finally {
        savingRef.current = null;
      }
    })();
    savingRef.current = run;
    return run;
  }, [form, readOnly, cita, medicoId]);

  const set = useCallback(
    (key: string, value: unknown) => {
      if (readOnly || !form) return;
      versionRef.current += 1;
      setData((prev) => withDerivedValues(form.questions, { ...prev, [key]: value }));
      setStatus('dirty');
    },
    [readOnly, form],
  );

  useEffect(() => {
    if (status !== 'dirty') return;
    const t = setTimeout(() => void save(), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [data, status, save]);

  const missingList = form ? missingRequired(form.questions.filter(isAnswerable), data) : [];

  useEffect(() => {
    register(formularioId, {
      save,
      revealMissing: () => {
        setShowMissing(true);
        const first = missingList[0];
        if (first && positions.current[first.id] != null) onScrollTo(positions.current[first.id]);
      },
    });
    return () => register(formularioId, null);
  }, [register, formularioId, save, missingList, onScrollTo]);

  useEffect(() => {
    onState(formularioId, {
      loaded: !!form,
      empty: form ? !formHasAnswers(form.questions, data) : true,
      missing: missingList.length,
      status,
      savedAt,
      error: errorRef.current,
    });
  }, [formularioId, form, data, missingList.length, status, savedAt, onState]);

  if (!visible) return null;
  if (formQuery.isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />;
  if (!form) return <Text style={{ color: colors.danger }}>{errorMessage(formQuery.error)}</Text>;

  const missingIds = new Set(showMissing ? missingList.map((q) => q.id) : []);
  return (
    <View style={{ gap: 12 }}>
      {visibleQuestions(form.questions, data).map((q) => (
        <View
          key={q.id}
          onLayout={(e) => {
            positions.current[q.id] = e.nativeEvent.layout.y;
          }}>
          <QuestionView q={q} data={data} all={form.questions} set={set} readOnly={readOnly} missing={missingIds.has(q.id)} />
        </View>
      ))}
    </View>
  );
}
