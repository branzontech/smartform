import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { addDays, formatLongDay, localDay, today, weekStart } from '@kerhub/core/agenda';
import { addMonths, formatMonth, formatWeekRange, groupByDay, monthWeeks, sameMonth, weekDays } from '@kerhub/core/calendar';
import { agenda, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BraulioEmpty } from '@/components/Braulio';
import { CitaCard } from '@/components/CitaCard';
import { ScreenTitle } from '@/components/ScreenTitle';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { MonthCalendar } from '@/components/agenda/MonthCalendar';
import { PeriodNav } from '@/components/agenda/PeriodNav';
import { PeriodSummary } from '@/components/agenda/PeriodSummary';
import { WeekAgenda } from '@/components/agenda/WeekAgenda';
import { WeekStrip } from '@/components/agenda/WeekStrip';
import { colors } from '@/theme';

type Mode = 'dia' | 'semana' | 'mes';
const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
];

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

export default function MiDia() {
  const { me, environment } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('dia');
  const [day, setDay] = useState(today());

  const weekFrom = weekStart(day);
  const weekTo = addDays(weekFrom, 6);
  const weeks = monthWeeks(day);
  const monthFrom = weeks[0][0];
  const monthTo = weeks[weeks.length - 1][6];

  const dayQuery = useQuery({ queryKey: ['agenda', 'mi-dia', day], queryFn: () => agenda.fetchMyDay(day), enabled: mode === 'dia' });
  const weekQuery = useQuery({
    queryKey: ['agenda', 'mi-agenda', weekFrom, weekTo],
    queryFn: () => agenda.fetchMyAgenda(weekFrom, weekTo),
    enabled: mode !== 'mes',
  });
  const monthQuery = useQuery({
    queryKey: ['agenda', 'mi-agenda', monthFrom, monthTo],
    queryFn: () => agenda.fetchMyAgenda(monthFrom, monthTo),
    enabled: mode === 'mes',
  });
  const active = mode === 'dia' ? dayQuery : mode === 'semana' ? weekQuery : monthQuery;

  const weekCitas = weekQuery.data?.citas ?? [];
  const allMonth = monthQuery.data?.citas ?? [];
  const monthCitas = allMonth.filter((c) => sameMonth(localDay(c.inicio), day));
  const weekByDay = groupByDay(weekCitas);
  const monthByDay = groupByDay(allMonth);
  const dayCitas = dayQuery.data?.citas ?? [];

  const now = today();
  const step = (dir: 1 | -1) => setDay(mode === 'mes' ? addMonths(day, dir) : addDays(day, mode === 'semana' ? 7 * dir : dir));
  const openDay = (d: string) => {
    setDay(d);
    setMode('dia');
  };
  const label = mode === 'dia' ? capitalize(formatLongDay(day)) : mode === 'semana' ? formatWeekRange(day) : capitalize(formatMonth(day));
  const away = mode === 'dia' ? day !== now : mode === 'semana' ? weekStart(day) !== weekStart(now) : !sameMonth(day, now);

  return (
    <ScrollView
      contentContainerStyle={[styles.page, { paddingTop: insets.top + 12 }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={active.isRefetching} onRefresh={() => active.refetch()} tintColor={colors.primary} />}>
      <ScreenTitle title="Mi día" subtitle={me?.empresa ? `${me.empresa.nombre}${environment.id === 'desarrollo' ? ' · Desarrollo' : ''}` : null} />

      <SegmentedTabs options={MODE_OPTIONS} value={mode} onChange={setMode} />

      <PeriodNav label={label} hint={away ? 'Toca para volver a hoy' : undefined} onPrev={() => step(-1)} onNext={() => step(1)} onToday={() => setDay(now)} />

      <Animated.View key={mode} entering={FadeIn.duration(220)} style={{ gap: 12 }}>
        {mode === 'dia' && (
          <>
            <WeekStrip days={weekDays(day)} selected={day} byDay={weekByDay} onSelect={setDay} />
            {dayCitas.map((c, i) => (
              <CitaCard key={c.id} cita={c} index={i} />
            ))}
            {!dayQuery.isLoading && dayCitas.length === 0 && (
              <BraulioEmpty
                pose="maletin"
                title={dayQuery.isError ? 'No se pudo cargar' : 'No tienes citas este día'}
                hint={dayQuery.isError ? errorMessage(dayQuery.error) : 'Toca otro día de la semana o mira tu semana y tu mes.'}
              />
            )}
          </>
        )}

        {mode === 'semana' && (
          <>
            <PeriodSummary citas={weekCitas} label={`Semana del ${formatWeekRange(day)}`} />
            {weekQuery.isError ? (
              <BraulioEmpty pose="maletin" title="No se pudo cargar" hint={errorMessage(weekQuery.error)} />
            ) : (
              <WeekAgenda days={weekDays(day)} byDay={weekByDay} onOpenDay={openDay} />
            )}
          </>
        )}

        {mode === 'mes' && (
          <>
            <PeriodSummary citas={monthCitas} label={capitalize(formatMonth(day))} />
            {monthQuery.isError ? (
              <BraulioEmpty pose="maletin" title="No se pudo cargar" hint={errorMessage(monthQuery.error)} />
            ) : (
              <MonthCalendar weeks={weeks} reference={day} byDay={monthByDay} onSelect={openDay} />
            )}
          </>
        )}
      </Animated.View>
      <View style={{ height: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14, paddingBottom: 40 },
});
