import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatLongDay, today } from '@kerhub/core/agenda';
import { groupFeed } from '@kerhub/core/contenido';
import { content, errorMessage, institutionLogoUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BraulioEmpty } from '@/components/Braulio';
import { Icon3D } from '@/components/Icon3D';
import { News, Rail, Upcoming } from '@/components/home/ContentLists';
import { Featured } from '@/components/home/Featured';
import { TodayCard } from '@/components/home/TodayCard';
import { capitalize, greeting } from '@/components/home/format';
import { colors } from '@/theme';

/** Inicio: el día del profesional y lo que su IPS publica (destacados, eventos, cultura, noticias, servicios, sedes). */
export default function Inicio() {
  const { me } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const feed = useQuery({ queryKey: ['contenido', 'feed'], queryFn: () => content.fetchFeed(), staleTime: 5 * 60_000 });
  const groups = groupFeed(feed.data?.items ?? []);
  const logo = institutionLogoUrl(feed.data?.institucion?.logoUrl);
  const firstName = (me?.user.name ?? '').trim().split(/\s+/)[0];
  const empty = !feed.isLoading && (feed.data?.items.length ?? 0) === 0;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['agenda', 'mi-dia'] });
    void feed.refetch();
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.page, { paddingTop: insets.top + 12 }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={refresh} tintColor={colors.primary} />}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.hello}>
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </Text>
          <Text style={styles.sub}>{capitalize(formatLongDay(today()))}</Text>
          {feed.data?.institucion?.nombre || me?.empresa?.nombre ? (
            <Text style={styles.sub}>{feed.data?.institucion?.nombre ?? me?.empresa?.nombre}</Text>
          ) : null}
        </View>
        {logo ? (
          <View style={styles.logoBox}>
            <Image source={{ uri: logo }} style={styles.logo} contentFit="contain" cachePolicy="disk" accessibilityLabel="Logo de la institución" />
          </View>
        ) : (
          <Icon3D name="inicio" size={52} />
        )}
      </View>

      <TodayCard />

      {feed.isError ? (
        <BraulioEmpty pose="historial" title="No se pudo cargar el Inicio" hint={errorMessage(feed.error)} />
      ) : empty ? (
        <BraulioEmpty
          pose="historial"
          title="Tu IPS aún no ha publicado contenido"
          hint="Aquí verás sus noticias, eventos, actividades y cultura. Se publican desde Doctor Ker web, en Contenido de la app."
        />
      ) : (
        <>
          <Featured items={groups.destacados} />
          <Upcoming items={groups.agenda} />
          <Rail title="Cultura empresarial" items={groups.cultura} wide />
          <News items={groups.noticias} />
          <Rail title="Servicios" items={groups.servicios} />
          <Rail title="Sedes" items={groups.sedes} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 22, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hello: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: colors.muted },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 6 },
  logo: { width: '100%', height: '100%' },
});
