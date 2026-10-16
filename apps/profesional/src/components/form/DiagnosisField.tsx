import { useEffect, useState } from 'react';
import { showAlert } from '@/components/overlay/Overlay';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ICD10_URI, type FormAnswers, type QuestionData, type SelectedDiagnosis } from '@kerhub/core/forms';
import { attention } from '@/lib/api';
import { colors, radius } from '@/theme';
import { Field, Notice } from './parts';

const MAX_DIAGNOSES = 4;
const ROLE_LABELS = ['Principal', 'Relacionado 1', 'Relacionado 2', 'Relacionado 3'];
const SEARCH_DELAY_MS = 300;

/** Diagnósticos CIE-10: búsqueda en el catálogo y sugerencias del formato. */
export function DiagnosisField({ q, data, set, readOnly }: { q: QuestionData; data: FormAnswers; set: (key: string, value: unknown) => void; readOnly: boolean }) {
  const selected: SelectedDiagnosis[] = Array.isArray(data[q.id]) ? data[q.id] : [];
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [term]);
  const search = useQuery({
    queryKey: ['diagnosticos', debounced],
    queryFn: () => attention.searchDiagnoses(debounced),
    enabled: !readOnly && debounced.length >= 2,
    staleTime: 5 * 60_000,
  });

  const full = selected.length >= MAX_DIAGNOSES;
  const add = (d: SelectedDiagnosis) => {
    if (full || selected.some((s) => s.codigo === d.codigo)) return;
    set(q.id, [...selected, d]);
    setTerm('');
  };
  const remove = (d: SelectedDiagnosis) =>
    showAlert('Quitar diagnóstico', `${d.codigo} · ${d.descripcion}`, [
      { text: 'Volver', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => set(q.id, selected.filter((s) => s.codigo !== d.codigo)) },
    ]);
  const suggestions = (q.diagnoses ?? []).filter((d) => !selected.some((s) => s.codigo === d.code));

  return (
    <View style={{ gap: 8 }}>
      {selected.map((d, i) => (
        <Pressable key={d.codigo} onPress={() => !readOnly && remove(d)} style={styles.selected} accessibilityHint={readOnly ? undefined : 'Toca para quitarlo'}>
          <Text style={styles.role}>{ROLE_LABELS[i] ?? 'Relacionado'}</Text>
          <Text style={styles.code}>
            {d.codigo} <Text style={styles.desc}>{d.descripcion}</Text>
          </Text>
        </Pressable>
      ))}
      {!readOnly && !full && (
        <>
          <Field value={term} onChangeText={setTerm} placeholder="Busca por código o nombre (CIE-10)" autoCorrect={false} />
          {search.isFetching && <ActivityIndicator color={colors.primary} />}
          {(search.data ?? []).map((d) => (
            <Pressable key={d.codigo} onPress={() => add(d)} style={styles.result}>
              <Text style={styles.code}>
                {d.codigo} <Text style={styles.desc}>{d.descripcion}</Text>
              </Text>
            </Pressable>
          ))}
          {debounced.length >= 2 && !search.isFetching && search.data?.length === 0 && <Notice>Sin resultados para «{debounced}».</Notice>}
          {suggestions.length > 0 && term.length === 0 && (
            <View style={{ gap: 6 }}>
              <Notice>Sugeridos por el formato</Notice>
              {suggestions.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => add({ codigo: d.code, descripcion: d.name, sistema: 'CIE-10', fhir_system_uri: ICD10_URI })}
                  style={styles.result}>
                  <Text style={styles.code}>
                    + {d.code} <Text style={styles.desc}>{d.name}</Text>
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
      {selected.length === 0 && readOnly && <Notice>Sin diagnósticos.</Notice>}
    </View>
  );
}

const styles = StyleSheet.create({
  selected: { borderRadius: radius.control, backgroundColor: colors.primarySoft, padding: 12, gap: 2 },
  role: { fontSize: 12, fontWeight: '600', color: colors.primary },
  result: { borderRadius: radius.control, backgroundColor: colors.canvas, padding: 12 },
  code: { fontSize: 15, fontWeight: '700', color: colors.ink },
  desc: { fontWeight: '400', color: colors.ink },
});
