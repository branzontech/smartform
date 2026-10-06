import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const PREFIJO = "magnet.vista.";

function leer<T>(clave: string, inicial: T, valido?: (v: unknown) => v is T): T {
  try {
    const raw = window.localStorage.getItem(PREFIJO + clave);
    if (raw === null) return inicial;
    const v = JSON.parse(raw) as unknown;
    return !valido || valido(v) ? (v as T) : inicial;
  } catch {
    return inicial;
  }
}

/**
 * useState que se recuerda en este navegador (filtros, pestaña, orden…), para
 * que el usuario encuentre la vista como la dejó al volver, aun tras cerrar el
 * navegador. Es comodidad del usuario, no dato de negocio: si el almacenamiento
 * no está disponible, funciona como un useState normal.
 */
export function useEstadoPersistente<T>(clave: string, inicial: T, valido?: (v: unknown) => v is T): [T, Dispatch<SetStateAction<T>>] {
  const [valor, setValor] = useState<T>(() => leer(clave, inicial, valido));
  useEffect(() => {
    try {
      window.localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    } catch {
      /* sin almacenamiento: queda en memoria */
    }
  }, [clave, valor]);
  return [valor, setValor];
}

/** Validador para pestañas: el valor guardado debe ser una de las permitidas. */
export const unaDe = <K extends string>(permitidas: readonly K[]) => (v: unknown): v is K =>
  typeof v === "string" && (permitidas as readonly string[]).includes(v);
