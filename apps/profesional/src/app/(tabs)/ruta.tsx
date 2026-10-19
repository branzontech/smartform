import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localTime } from '@kerhub/core/agenda';
import { arrivalAt, formatDuration, isPending, nextStop, type Parada } from '@kerhub/core/rutas';
import { errorMessage, hasModule } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BraulioEmpty } from '@/components/Braulio';
import { RouteMap, ROUTE_ICONS, type RouteMapHandle } from '@/components/route/RouteMap';
import { FinishedSheet, SummarySheet } from '@/components/route/RouteSheets';
import { VisitSheet, type VisitPhase } from '@/components/route/VisitSheet';
import { useMyRoute } from '@/components/route/useMyRoute';
import { colors } from '@/theme';

/** Qué ve el profesional según el estado de su próxima visita. */
function phaseOf(stop: Parada, arrivedId: string | null, withAttention: boolean): VisitPhase {
  if (stop.estado === 'en_atencion') return withAttention ? 'atencion' : 'llegada';
  if (stop.id === arrivedId) return 'llegada';
  return stop.estado === 'en_camino' ? 'camino' : 'salir';
}

/**
 * Ruta del día (módulo «rutas»), al estilo de las apps de transporte: el mapa
 * a pantalla completa con las visitas en orden y una hoja abajo con lo que toca
 * ahora: iniciar la ruta, salir hacia el paciente, llegar (deslizando), atender
 * y seguir con la próxima.
 */
export default function Ruta() {
  const { me } = useAuth();
  const insets = useSafeAreaInsets();
  const withRoutes = hasModule(me, 'rutas');
  const withAttention = hasModule(me, 'atencion');
  const route = useMyRoute(withAttention);
  const map = useRef<RouteMapHandle>(null);
  const [sheetHeight, setSheetHeight] = useState(320);
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null);

  const data = route.query.data;
  const live = route.view.data;
  const vista = live?.vista ?? null;
  const ruta = data?.ruta ?? null;
  // Tramos en vivo (desde donde está ahora) cuando la vista ya llegó.
  const legs = new Map((vista?.tramos ?? []).map((t) => [t.citaId, t]));
  const paradas = (data?.paradas ?? []).map((p) => ({ ...p, tramo: legs.get(p.id) ?? p.tramo }));
  const next = nextStop(paradas);
  // En ruta: la ruta del día está en curso, o ya salió hacia un paciente (p. ej. desde Mi día).
  const active = ruta?.estado === 'en_curso' || paradas.some((p) => p.estado === 'en_camino' || p.estado === 'en_atencion');
  const siguiente = live?.siguiente && next && live.siguiente.citaId === next.id ? live.siguiente : null;
  const legView = siguiente ? { principal: siguiente, alternativas: siguiente.alternativas } : null;

  // Hora estimada de llegada a cada visita pendiente: tramos acumulados desde ahora.
  const etas: Record<string, string> = {};
  let acc = 0;
  for (const t of vista?.tramos ?? []) {
    acc += t.segundos;
    etas[t.citaId] = arrivalAt(acc);
  }
  const chosen = legView ? (selectedAlt != null ? legView.alternativas[selectedAlt] : undefined) ?? legView.principal : null;
  const targetLabel = active && next && chosen ? formatDuration(chosen.segundos) : null;
  const upcoming = paradas
    .filter((p) => isPending(p) && p.id !== next?.id)
    .map((p) => ({ id: p.id, paciente: p.paciente, hora: localTime(p.inicio), eta: etas[p.id] ?? null }));

  // Encuadra la ruta cuando cambian las paradas o el trazado.
  const fitKey = `${paradas.length}-${vista?.polilinea?.length ?? 0}-${next?.id ?? ''}`;
  useEffect(() => {
    const t = setTimeout(() => map.current?.fit(), 350);
    return () => clearTimeout(t);
  }, [fitKey]);

  // Al pasar a otra visita, vuelve a la ruta recomendada.
  const nextId = next?.id;
  useEffect(() => setSelectedAlt(null), [nextId]);

  if (!withRoutes) {
    return <BraulioEmpty pose="maletin" title="Tu empresa no tiene el módulo de rutas" hint="Pídele al administrador que lo active para ver tus visitas a domicilio en el mapa." />;
  }
  if (route.query.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (route.query.isError) return <BraulioEmpty pose="maletin" title="No se pudo cargar tu ruta" hint={errorMessage(route.query.error)} />;
  if (paradas.length === 0) return <BraulioEmpty pose="maletin" title="Hoy no tienes visitas a domicilio" hint="Cuando te agenden visitas, aquí verás el recorrido del día en el mapa." />;

  const number = next ? paradas.indexOf(next) + 1 : paradas.length;
  const title = !active ? 'Hoy' : next ? 'En ruta' : 'Ruta del día';
  const subtitle = !active ? `${paradas.length} ${paradas.length === 1 ? 'visita' : 'visitas'}` : next ? `visita ${number} de ${paradas.length}` : 'todas resueltas';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <RouteMap
        ref={map}
        paradas={paradas}
        route={vista ? { polilinea: vista.polilinea, trafico: vista.trafico } : ruta ? { polilinea: ruta.polilinea, trafico: [] } : null}
        leg={active ? legView : null}
        selectedAlt={selectedAlt}
        onSelectAlt={setSelectedAlt}
        etas={etas}
        targetLabel={targetLabel}
        position={route.position}
        targetId={active ? next?.id ?? null : null}
        bottomInset={sheetHeight}
      />

      <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.pill}>
          <Image source={ROUTE_ICONS.profesional} style={{ width: 28, height: 28 }} />
          <Text style={styles.pillTitle}>{title}</Text>
          <Text style={styles.pillSub}>{subtitle}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ver toda la ruta" onPress={() => map.current?.fit()} style={({ pressed }) => [styles.round, pressed && { opacity: 0.8 }]}>
          <Text style={styles.roundIcon}>◎</Text>
        </Pressable>
      </View>

      {!active && next ? (
        <SummarySheet paradas={paradas} totals={vista} etas={etas} busy={route.busy} onStart={route.start} onLayoutHeight={setSheetHeight} />
      ) : next ? (
        <VisitSheet
          stop={next}
          number={number}
          total={paradas.length}
          phase={phaseOf(next, route.arrivedId, withAttention)}
          withAttention={withAttention}
          busy={route.busy}
          leg={legView}
          upcoming={upcoming}
          selectedAlt={selectedAlt}
          onSelectAlt={setSelectedAlt}
          onDepart={() => route.depart(next)}
          onArrive={() => route.arrive(next)}
          onPrimary={() => route.primary(next)}
          onAbsent={() => route.absent(next)}
          onNavigate={() => route.navigate(next)}
          onCall={() => route.call(next)}
          onLayoutHeight={setSheetHeight}
        />
      ) : (
        <FinishedSheet paradas={paradas} ruta={ruta} busy={route.busy} closed={!active} onFinish={route.finish} onLayoutHeight={setSheetHeight} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    shadowColor: '#14121c',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  pillTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  pillSub: { fontSize: 13, color: colors.muted },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14121c',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  roundIcon: { fontSize: 20, color: colors.ink, marginTop: -2 },
});
