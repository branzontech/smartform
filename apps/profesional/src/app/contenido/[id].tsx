import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CONTENT_TYPE_LABEL } from '@kerhub/core/contenido';
import { content } from '@/lib/api';
import { BraulioEmpty } from '@/components/Braulio';
import { ContentImage } from '@/components/home/ContentImage';
import { capitalize, formatWhen } from '@/components/home/format';
import { FALLBACK_ICON } from '@/components/home/icons';
import { Button } from '@/components/ui';
import { colors } from '@/theme';
import { openLink } from '@/lib/links';

/** Una publicación de la IPS completa: imagen, fecha, lugar, texto y enlace. */
export default function ContenidoDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const feed = useQuery({ queryKey: ['contenido', 'feed'], queryFn: () => content.fetchFeed(), staleTime: 5 * 60_000 });
  const item = feed.data?.items.find((i) => i.id === id);

  if (!item) {
    return feed.isLoading ? null : <BraulioEmpty pose="historial" title="Esta publicación ya no está disponible" />;
  }
  const when = formatWhen(item.fechaInicio, item.fechaFin);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <ContentImage path={item.imagenRuta} fallback={FALLBACK_ICON[item.tipo]} style={styles.image} iconSize={120} />
      <View style={styles.body}>
        <Text style={styles.type}>{CONTENT_TYPE_LABEL[item.tipo]}</Text>
        <Text style={styles.title}>{item.titulo}</Text>
        {when ? <Text style={styles.meta}>{capitalize(when)}</Text> : null}
        {item.lugar ? <Text style={styles.meta}>{item.lugar}</Text> : null}
        {item.resumen ? <Text style={styles.summary}>{item.resumen}</Text> : null}
        {item.cuerpo ? <Text style={styles.text}>{item.cuerpo}</Text> : null}
        {item.enlace?.startsWith('https://') ? (
          <View style={{ marginTop: 8 }}>
            <Button title="Abrir enlace" variant="secondary" onPress={() => void openLink(item.enlace!)} />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 16 / 10 },
  body: { padding: 18, gap: 8 },
  type: { fontSize: 13, fontWeight: '700', color: colors.primary },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  meta: { fontSize: 14, color: colors.muted },
  summary: { fontSize: 17, fontWeight: '600', color: colors.ink, lineHeight: 24, marginTop: 6 },
  text: { fontSize: 16, color: colors.ink, lineHeight: 24 },
});
