import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cuenta las filas que quedan por debajo del área visible de la tabla (el
 * cuerpo tiene scroll propio). Sin este aviso, al elegir 50 o 100 filas por
 * página parecía que no cargaban: estaban ahí, pero fuera de la vista.
 * `resetKey` vuelve arriba cuando cambia la página o el tamaño; `rowCount` vuelve a medir.
 */
export function useHiddenRows(resetKey: unknown, rowCount: number) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [hiddenRows, setHiddenRows] = useState(0);

  const measure = useCallback(() => {
    const box = tableRef.current?.parentElement;
    if (!box) return;
    const bottom = box.getBoundingClientRect().bottom;
    let n = 0;
    tableRef.current!.querySelectorAll("tbody > tr").forEach((tr) => { if (tr.getBoundingClientRect().top >= bottom - 8) n++; });
    setHiddenRows(n);
  }, []);

  useEffect(() => {
    const box = tableRef.current?.parentElement;
    if (!box) return;
    box.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(tableRef.current!);
    return () => { box.removeEventListener("scroll", measure); ro.disconnect(); };
  }, [measure]);

  useEffect(() => {
    tableRef.current?.parentElement?.scrollTo({ top: 0 });
    measure();
  }, [resetKey, measure]);

  useEffect(() => { measure(); }, [rowCount, measure]);

  const showMore = useCallback(() => {
    const box = tableRef.current?.parentElement;
    box?.scrollBy({ top: box.clientHeight * 0.8, behavior: "smooth" });
  }, []);

  return { tableRef, hiddenRows, showMore };
}
