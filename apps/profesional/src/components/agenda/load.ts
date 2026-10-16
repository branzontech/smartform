import type { Cita } from '@kerhub/core/agenda';
import { CLOSED_STATES } from '@/components/CitaCard';

/** Citas con las que un día se considera lleno (el anillo se completa). */
export const DAY_FULL = 6;

/** Citas que cuentan como carga: sin las canceladas ni las inasistencias. */
export const activeCitas = (citas: Cita[] | undefined) => (citas ?? []).filter((c) => !CLOSED_STATES.includes(c.estado));
export const activeCount = (citas: Cita[] | undefined) => activeCitas(citas).length;
