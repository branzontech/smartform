import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { localTime } from '@kerhub/core/agenda';
import { CONTENT_TYPE_LABEL, type ContentItem } from '@kerhub/core/contenido';
import { colors } from '@/theme';
import { ContentImage } from './ContentImage';
import { dateBlock } from './format';
import { FALLBACK_ICON } from './icons';
import { Section } from './Section';

const open = (id: string) => router.push({ pathname: '/contenido/[id]', params: { id } });

/** Eventos y actividades: bloque de fecha, título, hora y lugar. */
export function Upcoming({ items }: { items: ContentItem[] }) {
  if (items.length === 0) return null;
  return (
    <Section title="Eventos y actividades">
      <View style={styles.card}>
        {items.map((item, i) => {
          const d = dateBlock(item.fechaInicio ?? item.creadoEn);
          return (
            <Animated.View key={item.id} entering={FadeInDown.delay(i * 30).duration(220)}>
              <Pressable onPress={() => open(item.id)} style={[styles.eventRow, i > 0 && styles.divider]}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateDay}>{d.day}</Text>
                  <Text style={styles.dateMonth}>{d.month}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {item.titulo}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {CONTENT_TYPE_LABEL[item.tipo]}
                    {item.fechaInicio ? ` · ${localTime(item.fechaInicio)}` : ''}
                    {item.lugar ? ` · ${item.lugar}` : ''}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Section>
  );
}

/** Fila horizontal de tarjetas con imagen (cultura, servicios, sedes). */
export function Rail({ title, items, wide = false }: { title: string; items: ContentItem[]; wide?: boolean }) {
  if (items.length === 0) return null;
  const width = wide ? 240 : 170;
  return (
    <Section title={title}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => open(item.id)} style={[styles.railCard, { width }]}>
            <ContentImage path={item.imagenRuta} fallback={FALLBACK_ICON[item.tipo]} style={{ width: '100%', aspectRatio: wide ? 4 / 3 : 1 }} />
            <View style={{ padding: 12, gap: 2 }}>
              <Text style={styles.railTitle} numberOfLines={2}>
                {item.titulo}
              </Text>
              {item.lugar || item.resumen ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {item.lugar ?? item.resumen}
                </Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </Section>
  );
}

/** Noticias: miniatura, título y resumen. */
export function News({ items }: { items: ContentItem[] }) {
  if (items.length === 0) return null;
  return (
    <Section title="Noticias">
      {items.map((item, i) => (
        <Animated.View key={item.id} entering={FadeInDown.delay(i * 30).duration(220)}>
          <Pressable onPress={() => open(item.id)} style={styles.newsCard}>
            <ContentImage path={item.imagenRuta} fallback={FALLBACK_ICON[item.tipo]} style={styles.thumb} iconSize={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.railTitle} numberOfLines={2}>
                {item.titulo}
              </Text>
              {item.resumen ? (
                <Text style={styles.meta} numberOfLines={2}>
                  {item.resumen}
                </Text>
              ) : null}
            </View>
          </Pressable>
        </Animated.View>
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 14 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  dateBox: { width: 52, height: 56, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 20, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] },
  dateMonth: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: -2 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  chevron: { fontSize: 24, color: colors.muted, marginTop: -3 },
  railCard: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden' },
  railTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  newsCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 18, padding: 10 },
  thumb: { width: 76, height: 76, borderRadius: 14 },
});
