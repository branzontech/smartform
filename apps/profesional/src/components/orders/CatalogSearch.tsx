import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Field, Notice } from '@/components/form/parts';
import { Button } from '@/components/ui';
import { colors, radius } from '@/theme';

const SEARCH_DELAY_MS = 300;

/** Hoja de búsqueda en un catálogo (CUPS, medicamentos, diagnósticos): escribe, toca un resultado. */
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
  const insets = useSafeAreaInsets();
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
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.title}>{title}</Text>
        <Field value={term} onChangeText={setTerm} placeholder={placeholder} autoFocus autoCorrect={false} />
        <ScrollView contentContainerStyle={{ gap: 8, paddingVertical: 8 }} keyboardShouldPersistTaps="handled">
          {results.isFetching ? <ActivityIndicator color={colors.primary} /> : null}
          {(results.data ?? []).map((item) => (
            <Pressable key={keyOf(item)} style={styles.result} onPress={() => onPick(item, term.trim())}>
              {render(item)}
            </Pressable>
          ))}
          {debounced.length >= 2 && !results.isFetching && results.data?.length === 0 ? <Notice>Sin resultados para «{debounced}».</Notice> : null}
          {debounced.length < 2 ? <Notice>Escribe al menos 2 letras o el código.</Notice> : null}
          {footer?.(term.trim())}
        </ScrollView>
        <Button title="Cerrar" variant="secondary" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.canvas, padding: 16, paddingTop: 24, gap: 10 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  result: { borderRadius: radius.control, backgroundColor: colors.surface, padding: 14, gap: 2 },
});
