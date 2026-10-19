import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { formatShortDay, localDay } from '@kerhub/core/agenda';
import { groupByInitial, patientSubtitle, type MyPatient } from '@kerhub/core/pacientes';
import { errorMessage, patients } from '@/lib/api';
import { BraulioEmpty } from '@/components/Braulio';
import { PatientAvatar } from '@/components/PatientAvatar';
import { ScreenTitle } from '@/components/ScreenTitle';
import { colors } from '@/theme';

/** Espera tras la última tecla antes de buscar. */
const SEARCH_DELAY = 250;

function SearchGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Circle cx={7.5} cy={7.5} r={5.5} stroke={colors.muted} strokeWidth={1.8} fill="none" />
      <Line x1={11.6} y1={11.6} x2={16} y2={16} stroke={colors.muted} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** «Próxima mié 22 oct» o «Última …», lo más útil para ubicar al paciente. */
function nextOrLast(p: MyPatient): { text: string; soon: boolean } | null {
  if (p.proxima) return { text: `Próxima ${formatShortDay(localDay(p.proxima))}`, soon: true };
  if (p.ultima) return { text: `Última ${formatShortDay(localDay(p.ultima))}`, soon: false };
  return null;
}

function PatientRow({ patient, first, last }: { patient: MyPatient; first: boolean; last: boolean }) {
  const when = nextOrLast(patient);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/paciente/[id]', params: { id: patient.id } })}
      style={({ pressed }) => [styles.row, first && styles.rowFirst, last && styles.rowLast, pressed && { backgroundColor: colors.primarySoft }]}>
      <PatientAvatar name={patient.nombre} size={44} />
      <View style={[styles.rowBody, !last && styles.rowLine]}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={styles.name} numberOfLines={1}>{patient.nombre}</Text>
          <Text style={styles.meta} numberOfLines={1}>{patientSubtitle(patient)}</Text>
        </View>
        {when && <Text style={[styles.when, when.soon && { color: colors.primary }]}>{when.text}</Text>}
      </View>
    </Pressable>
  );
}

/**
 * Mis pacientes: los que tienen citas conmigo, por orden alfabético con su
 * inicial (como los contactos del teléfono) y un buscador por nombre o
 * documento. Tocar uno abre su ficha.
 */
export default function Pacientes() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(text.trim()), SEARCH_DELAY);
    return () => clearTimeout(t);
  }, [text]);

  const query = useQuery({
    queryKey: ['pacientes', 'mios', search],
    queryFn: () => patients.fetchMyPatients(search),
    placeholderData: keepPreviousData,
  });
  const rows = query.data ?? [];
  const sections = groupByInitial(rows).map((g) => ({ title: g.letra, data: g.pacientes }));
  const subtitle = query.isSuccess && !search ? `${rows.length} ${rows.length === 1 ? 'paciente' : 'pacientes'} con citas contigo` : 'Los que tienen citas contigo';

  const header = (
    <View style={{ gap: 16, paddingBottom: 8 }}>
      <ScreenTitle title="Pacientes" subtitle={subtitle} />
      <View style={styles.search}>
        <SearchGlyph />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Buscar por nombre o documento"
          placeholderTextColor="#a29fae"
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
          maxLength={80}
        />
        {text.length > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" hitSlop={10} onPress={() => setText('')}>
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const empty = query.isLoading ? null : query.isError ? (
    <BraulioEmpty pose="historial" title="No se pudieron cargar tus pacientes" hint={errorMessage(query.error)} />
  ) : search ? (
    <BraulioEmpty pose="historial" title={`Nada con «${search}»`} hint="Prueba con otro nombre o con el número de documento." />
  ) : (
    <BraulioEmpty pose="historial" title="Aún no tienes pacientes" hint="Aparecen aquí cuando te agendan citas con ellos." />
  );

  return (
    <Animated.View entering={FadeIn.duration(220)} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <SectionList
        sections={sections}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 96 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        renderSectionHeader={({ section }) => <Text style={styles.letter}>{section.title}</Text>}
        renderItem={({ item, index, section }) => <PatientRow patient={item} first={index === 0} last={index === section.data.length - 1} />}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, borderRadius: 14, paddingHorizontal: 14, backgroundColor: colors.surface },
  searchInput: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 0 },
  clear: { fontSize: 14, color: colors.muted },
  letter: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 14, marginBottom: 6, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 14, backgroundColor: colors.surface },
  rowFirst: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  rowLast: { borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingRight: 14 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  name: { fontSize: 16, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  when: { fontSize: 12.5, fontWeight: '600', color: colors.muted },
});
