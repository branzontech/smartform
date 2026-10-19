import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STATE_LABEL, localTime } from '@kerhub/core/agenda';
import { arrivalAt, formatDuration, isLocated, isPending, lateMinutes, nextStop, type Parada } from '@kerhub/core/rutas';
import { errorMessage, hasModule } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BraulioEmpty } from '@/components/Braulio';
import { RouteMap, ROUTE_ICONS, type RouteMapHandle } from '@/components/route/RouteMap';
import { FinishedSheet, SummarySheet } from '@/components/route/RouteSheets';
import { VisitSheet, type VisitPhase } from '@/components/route/VisitSheet';
import { VisitsPanel, type VisitRow } from '@/components/route/VisitsPanel';
import { useMyRoute } from '@/components/route/useMyRoute';
import { colors } from '@/theme';

/** Qué ve el profesional según el estado de su próxima visita. */
function phaseOf(stop: Parada, arrivedId: string | null, withAttention: boolean): VisitPhase {
  if (stop.estado === 'en_atencion') return withAttention ? 'atencion' : 'llegada';
  if (stop.id === arrivedId) return 'llegada';
  return stop.estado === 'en_camino' ? 'camino' : 'salir';
}

/** Las visitas en el orden propuesto (las resueltas y las que no están en él, al final por hora). */
function inOrder(paradas: Parada[], ids: string[]): Parada[] {
  const at = new Map(ids.map((id, i) => [id, i]));
  return [...paradas].sort((a, b) => (at.get(a.id) ?? 1e6) - (at.get(b.id) ?? 1e6) || Date.parse(a.inicio) - Date.parse(b.inicio));
}

/**
 * Ruta del día (módulo «rutas»), como en el software de rutas y las apps de
 * transporte: el mapa con la salida, las visitas numeradas en el orden que
 * menos recorre (o el de las citas) y la llegada; el listado vive en el botón
 * de arriba; abajo, lo que toca ahora. El tráfico en vivo se enciende a pedido.
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
  const [panelOpen, setPanelOpen] = useState(false);

  const data = route.query.data;
  const live = route.view.data;
  const vista = live?.vista ?? null;
  const ruta = data?.ruta ?? null;
  // Tramos desde donde está ahora (cuando la vista ya llegó) y orden propuesto.
  const legs = new Map((vista?.tramos ?? []).map((t) => [t.citaId, t]));
  const paradas = inOrder((data?.paradas ?? []).map((p) => ({ ...p, tramo: legs.get(p.id) ?? p.tramo })), vista?.orden ?? []);
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
  const rows: VisitRow[] = paradas.map((p, i) => ({
    id: p.id,
    num: i + 1,
    paciente: p.paciente,
    hora: localTime(p.inicio),
    eta: etas[p.id] ?? null,
    tarde: etas[p.id] ? lateMinutes(etas[p.id], p.inicio) : 0,
    hecha: !isPending(p),
    estado: STATE_LABEL[p.estado],
  }));
  const lateCount = rows.filter((r) => r.tarde > 0 && !r.hecha).length;

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

  const focus = (id: string) => {
    const p = paradas.find((x) => x.id === id);
    if (!p || !isLocated(p)) return;
    setPanelOpen(false);
    map.current?.fit([
      { latitude: Number(p.latitud), longitude: Number(p.longitud) },
      ...(route.position ? [{ latitude: route.position.latitud, longitude: route.position.longitud }] : []),
    ]);
  };

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
        started={active}
        liveTraffic={route.liveTraffic}
        position={route.position}
        targetId={active ? next?.id ?? null : null}
        bottomInset={sheetHeight}
      />

      <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <VisitsPanel title={title} subtitle={subtitle} rows={rows} open={panelOpen} onToggle={() => setPanelOpen((v) => !v)} onSelect={focus} />
        <View style={styles.tools}>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: route.liveTraffic }}
            accessibilityLabel="Tráfico en tiempo real"
            onPress={() => route.setLiveTraffic(!route.liveTraffic)}
            style={({ pressed }) => [styles.round, route.liveTraffic && styles.roundOn, pressed && { opacity: 0.8 }]}>
            <Image source={ROUTE_ICONS.trafico} style={{ width: 26, height: 26, opacity: route.liveTraffic ? 1 : 0.55 }} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Ver toda la ruta" onPress={() => map.current?.fit()} style={({ pressed }) => [styles.round, pressed && { opacity: 0.8 }]}>
            <Text style={styles.roundIcon}>◎</Text>
          </Pressable>
        </View>
      </View>

      {!active && next ? (
        <SummarySheet
          paradas={paradas}
          totals={vista}
          etas={etas}
          lateCount={lateCount}
          mode={route.mode}
          onMode={route.setMode}
          busy={route.busy}
          onStart={route.start}
          onLayoutHeight={setSheetHeight}
        />
      ) : next ? (
        <VisitSheet
          stop={next}
          number={number}
          total={paradas.length}
          phase={phaseOf(next, route.arrivedId, withAttention)}
          withAttention={withAttention}
          busy={route.busy}
          leg={legView}
          upcoming={[]}
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

const shadow = { shadowColor: '#14121c', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 };

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tools: { gap: 8 },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  roundOn: { backgroundColor: colors.primarySoft },
  roundIcon: { fontSize: 20, color: colors.ink, marginTop: -2 },
});
