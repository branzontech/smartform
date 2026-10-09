/**
 * Ambientes de Ker Hub. El ambiente se elige en el login y decide a qué API
 * (y por tanto a qué base de datos) habla la web, sin cambiar de dirección.
 *
 *   · Desarrollo: la API de este computador (localhost:5340), base dev de Neon.
 *   · Producción: datos reales. En local se llega por el proxy de Vite
 *     /env/produccion/api → la web de Railway, que reenvía a su API privada.
 *
 * Cada ambiente usa su propio prefijo de ruta: la cookie de sesión de uno no
 * viaja al otro, así no se mezclan sesiones ni datos.
 *
 * La web publicada solo conoce su propio ambiente (producción): no muestra selector.
 */

export type EnvironmentId = "desarrollo" | "produccion";

export interface EnvironmentInfo {
  id: EnvironmentId;
  label: string;
  description: string;
  /** Prefijo de ruta de la API, relativo al origen de la web ("" = /api). */
  apiBase: string;
}

const DESARROLLO: EnvironmentInfo = {
  id: "desarrollo",
  label: "Desarrollo",
  description: "API de este computador, con datos de prueba. Aquí está lo más nuevo.",
  apiBase: "",
};

const PRODUCCION_LOCAL: EnvironmentInfo = {
  id: "produccion",
  label: "Producción",
  description: "Datos reales de la operación. Lo que aún no se ha desplegado puede fallar.",
  apiBase: "/env/produccion",
};

const PRODUCCION: EnvironmentInfo = { ...PRODUCCION_LOCAL, description: "Datos reales de la operación.", apiBase: "" };

/** Ambientes que se pueden elegir en esta compilación. */
export const ENVIRONMENTS: EnvironmentInfo[] = import.meta.env.DEV ? [DESARROLLO, PRODUCCION_LOCAL] : [PRODUCCION];

const STORAGE_KEY = "kerhub.environment";

/** Ambiente activo: el elegido en el login o, si no hay, el primero. */
export function currentEnvironment(): EnvironmentInfo {
  let saved: string | null = null;
  try {
    saved = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Sin almacenamiento (ventana privada, bloqueo): se usa el predeterminado.
  }
  return ENVIRONMENTS.find((e) => e.id === saved) ?? ENVIRONMENTS[0];
}

export function selectEnvironment(id: EnvironmentId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Si no se puede guardar, el ambiente vuelve al predeterminado al recargar.
  }
}
