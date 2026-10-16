import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { errorMessage } from '@/lib/api';
import { Field, Notice } from '@/components/form/parts';
import { BottomSheet } from '@/components/overlay/BottomSheet';
import { colors, radius } from '@/theme';

const SEARCH_DELAY_MS = 300;

/** Búsqueda en un catálogo (CUPS, medicamentos, diagnósticos) en una hoja grande desde abajo. */
export function CatalogSearch<T>({
  open,
  title,
  placeholder,
  queryKey,
  search,
  render,
  keyOf,
  onPick,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  placeholder: string;
  queryKey: string;
  search: (term: string) => Promise<T[]>;
  render: (item: T) => ReactNode;
  keyOf: (item: T) => string;
  onPick: (item: T, term: string) => void;
  onClose: () => void;
  footer?: (term: string) => ReactNode;
}) {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [term]);
  useEffect(() => {
    if (!open) setTerm('');
  }, [open]);
  const results = useQuery({ queryKey: [queryKey, debounced], queryFn: () => search(debounced), enabled: open && debounced.length >= 2, staleTime: 5 * 60_000 });

  return (
    <BottomSheet visible={open} onClose={onClose} title={title}>
      <View style={styles.body}>
        <Field value={term} onChangeText={setTerm} placeholder={placeholder} autoFocus autoCorrect={false} />
        <ScrollView contentContainerStyle={{ gap: 8, paddingVertical: 8 }} keyboardShouldPersistTaps="handled">
          {results.isFetching ? <ActivityIndicator color={colors.primary} /> : null}
          {results.isError ? <Notice>No se pudo buscar: {errorMessage(results.error)}</Notice> : null}
          {(results.data ?? []).map((item) => (
            <Pressable key={keyOf(item)} style={({ pressed }) => [styles.result, pressed && { opacity: 0.8 }]} onPress={() => onPick(item, term.trim())}>
              {render(item)}
            </Pressable>
          ))}
          {debounced.length >= 2 && !results.isFetching && !results.isError && results.data?.length === 0 ? <Notice>Sin resultados para «{debounced}».</Notice> : null}
          {debounced.length < 2 ? <Notice>Escribe al menos 2 letras o el código.</Notice> : null}
          {footer?.(term.trim())}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 16, gap: 10 },
  result: { borderRadius: radius.control, backgroundColor: colors.surface, padding: 14, gap: 2 },
});
