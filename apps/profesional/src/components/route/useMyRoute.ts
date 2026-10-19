import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { navigationLinks, type MiRuta, type ModoRuta, type Parada } from '@kerhub/core/rutas';
import { agenda, errorMessage, rutas } from '@/lib/api';
import { currentPosition } from '@/lib/location';
import { showAlert, showNotice } from '@/components/overlay/Overlay';

export const ROUTE_KEY = ['rutas', 'mi-ruta'] as const;
export const VIEW_KEY = ['rutas', 'vista'] as const;
type Pos = { latitud: number; longitud: number };

/** Cada cuánto se reporta el avance mientras la ruta está activa (con la app abierta). */
const TRACK = { timeInterval: 60_000, distanceInterval: 100 };

/**
 * La ruta del día del profesional y lo que hace con ella. Llegar y atender son
 * cambios de estado de la cita, con la ubicación como constancia de la visita.
 */
export function useMyRoute(withAttention: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ROUTE_KEY, queryFn: () => rutas.fetchMyRoute(), refetchInterval: 60_000 });
  const [position, setPositionState] = useState<Pos | null>(null);
  const positionRef = useRef<Pos | null>(null);
  const setPosition = useCallback((p: Pos) => {
    positionRef.current = p;
    setPositionState(p);
  }, []);
  /** Orden de las visitas: el más corto (por defecto) o el de las horas de cita. */
  const [mode, setMode] = useState<ModoRuta>('optimo');
  /** Tráfico en tiempo real: apagado no se consulta a Google cada minuto (solo al abrir y tras cada acción). */
  const [liveTraffic, setLiveTraffic] = useState(false);
  // Vista desde donde está: recorrido, orden propuesto, hora de llegada a cada visita y caminos a la próxima.
  const view = useQuery({
    queryKey: [...VIEW_KEY, mode],
    enabled: !!position,
    queryFn: () => rutas.viewMyRoute(positionRef.current!, mode),
    refetchInterval: liveTraffic ? 60_000 : false,
    staleTime: liveTraffic ? 30_000 : Infinity,
  });
  const [arrivedId, setArrivedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const active = query.data?.ruta?.estado === 'en_curso';
  const { refetch } = query;

  // Al volver a la pestaña (p. ej. tras terminar una atención) se refresca la ruta.
  const refetchView = view.refetch;
  useFocusEffect(
    useCallback(() => {
      void refetch();
      if (positionRef.current) void refetchView();
    }, [refetch, refetchView]),
  );

  useEffect(() => {
    void currentPosition().then((p) => p && setPosition(p));
  }, [setPosition]);

  // Mientras la ruta está activa: la posición en el mapa y el avance para la IPS.
  useEffect(() => {
    if (!active) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    void Location.getForegroundPermissionsAsync().then(async ({ status }) => {
      if (status !== 'granted' || cancelled) return;
      sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, ...TRACK }, (loc) => {
        const p = { latitud: loc.coords.latitude, longitud: loc.coords.longitude };
        setPosition(p);
        rutas.sendPosition({ ...p, precision: loc.coords.accuracy }).catch(() => undefined);
      });
      if (cancelled) sub.remove();
    });
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [active, setPosition]);

  const set = (data: MiRuta) => queryClient.setQueryData(ROUTE_KEY, data);
  const refresh = async () => {
    await Promise.all([refetch(), refetchView(), queryClient.invalidateQueries({ queryKey: ['agenda'] })]);
  };

  /** Pide la ubicación; sin ella no se puede trazar la ruta ni constatar la visita. */
  const locate = async (): Promise<Pos | null> => {
    const p = await currentPosition();
    if (!p) showNotice({ title: 'Activa tu ubicación', tone: 'warning', message: 'La ruta y la constancia de la visita usan tu ubicación. Actívala para Expo Go en Ajustes.' });
    else setPosition(p);
    return p;
  };

  const run = async (title: string, work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
    } catch (e) {
      showNotice({ title, message: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const start = () => run('No se pudo iniciar la ruta', async () => {
    const p = await locate();
    if (!p) return;
    set(await rutas.computeMyRoute(p, mode));
    await refetchView();
  });

  const depart = (stop: Parada) => run('No se pudo salir hacia el paciente', async () => {
    const p = await locate();
    if (!p) return;
    await agenda.changeCitaState(stop.id, { estado: 'en_camino', ...p });
    // Tiempos frescos desde donde está ahora.
    set(await rutas.computeMyRoute(p, mode));
    await Promise.all([refetchView(), queryClient.invalidateQueries({ queryKey: ['agenda'] })]);
  });

  const arrive = (stop: Parada) => run('No se pudo registrar la llegada', async () => {
    const p = await locate();
    if (!p) return;
    setArrivedId(stop.id);
    rutas.sendPosition(p).catch(() => undefined);
  });

  const primary = (stop: Parada) => run(withAttention ? 'No se pudo iniciar la atención' : 'No se pudo terminar la visita', async () => {
    if (stop.estado === 'en_atencion' && withAttention) {
      router.push({ pathname: '/atencion/[id]', params: { id: stop.id } });
      return;
    }
    const p = await locate();
    if (!p) return;
    if (stop.estado !== 'en_atencion') await agenda.changeCitaState(stop.id, { estado: 'en_atencion', ...p });
    if (withAttention) {
      setArrivedId(null);
      await refresh();
      router.push({ pathname: '/atencion/[id]', params: { id: stop.id } });
      return;
    }
    await agenda.changeCitaState(stop.id, { estado: 'atendida' });
    setArrivedId(null);
    await refresh();
  });

  const absent = (stop: Parada) =>
    showAlert('El paciente no estaba', `La visita a ${stop.paciente} queda como «No asistió», con tu ubicación como constancia.`, [
      {
        text: 'Marcar «No asistió»',
        style: 'destructive',
        onPress: () => void run('No se pudo registrar', async () => {
          const p = await locate();
          await agenda.changeCitaState(stop.id, { estado: 'no_asistio', motivo: 'El paciente no estaba en el domicilio.', ...(p ?? {}) });
          setArrivedId(null);
          await refresh();
        }),
      },
      { text: 'Volver', style: 'cancel' },
    ]);

  const finish = () => run('No se pudo terminar la ruta', async () => {
    set(await rutas.finishMyRoute());
  });

  const navigate = (stop: Parada) => {
    if (stop.latitud == null || stop.longitud == null) {
      showNotice({ title: 'Dirección sin ubicar', tone: 'warning', message: 'Esta dirección no está en el mapa. Revisa la dirección del paciente en Doctor Ker web.' });
      return;
    }
    const links = navigationLinks({ latitud: stop.latitud, longitud: stop.longitud });
    showAlert('Navegar con', stop.direccion ?? undefined, [
      { text: 'Google Maps', onPress: () => void Linking.openURL(links.google) },
      { text: 'Waze', onPress: () => void Linking.openURL(links.waze) },
      { text: 'Mapas de Apple', onPress: () => void Linking.openURL(links.apple) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const call = (stop: Parada) => {
    if (!stop.telefono) showNotice({ title: 'Sin teléfono', tone: 'warning', message: 'El paciente no tiene teléfono registrado.' });
    else void Linking.openURL(`tel:${stop.telefono.replace(/\s+/g, '')}`);
  };

  return { query, view, position, mode, setMode, liveTraffic, setLiveTraffic, arrivedId, busy, start, depart, arrive, primary, absent, finish, navigate, call };
}
