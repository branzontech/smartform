import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { CONTENT_TYPE_LABEL, type ContentItem } from '@kerhub/core/contenido';
import { colors } from '@/theme';
import { ContentImage } from './ContentImage';
import { FALLBACK_ICON } from './icons';
import { Section } from './Section';

const GAP = 12;
const SIDE = 16;

/** Carrusel de destacados: tarjetas grandes con imagen que se deslizan de a una. */
export function Featured({ items }: { items: ContentItem[] }) {
  const { width } = useWindowDimensions();
  const cardWidth = width - SIDE * 2 - 28;
  const [index, setIndex] = useState(0);
  if (items.length === 0) return null;
  return (
    <Section title="Destacados" right={items.length > 1 ? <Text style={styles.counter}>{`${index + 1} de ${items.length}`}</Text> : null}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        style={{ marginHorizontal: -SIDE }}
        contentContainerStyle={{ paddingHorizontal: SIDE, gap: GAP }}
        onScroll={(e) => setIndex(Math.min(items.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP)))))}
        scrollEventThrottle={32}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/contenido/[id]', params: { id: item.id } })} style={[styles.card, { width: cardWidth }]}>
            <ContentImage path={item.imagenRuta} fallback={FALLBACK_ICON[item.tipo]} style={styles.image} iconSize={84} />
            <View style={styles.body}>
              <Text style={styles.type}>{CONTENT_TYPE_LABEL[item.tipo]}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {item.titulo}
              </Text>
              {item.resumen ? (
                <Text style={styles.summary} numberOfLines={2}>
                  {item.resumen}
                </Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  counter: { fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  card: { backgroundColor: colors.surface, borderRadius: 22, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 16 / 10 },
  body: { padding: 14, gap: 4 },
  type: { fontSize: 12, fontWeight: '700', color: colors.primary },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  summary: { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
