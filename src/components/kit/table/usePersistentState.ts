import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const PREFIX = "kerhub.view.";

function read<T>(key: string, initial: T, isValid?: (v: unknown) => v is T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return initial;
    const v = JSON.parse(raw) as unknown;
    return !isValid || isValid(v) ? (v as T) : initial;
  } catch {
    return initial;
  }
}

/**
 * useState que se recuerda en este navegador (filtros, pestaña, orden…), para
 * que el usuario encuentre la vista como la dejó al volver, aun tras cerrar el
 * navegador. Es comodidad del usuario, no dato de negocio: si el almacenamiento
 * no está disponible, funciona como un useState normal.
 */
export function usePersistentState<T>(key: string, initial: T, isValid?: (v: unknown) => v is T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => read(key, initial, isValid));
  useEffect(() => {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* sin almacenamiento: queda en memoria */
    }
  }, [key, value]);
  return [value, setValue];
}

/** Validador para pestañas: el valor guardado debe ser una de las permitidas. */
export const oneOf = <K extends string>(allowed: readonly K[]) => (v: unknown): v is K =>
  typeof v === "string" && (allowed as readonly string[]).includes(v);
