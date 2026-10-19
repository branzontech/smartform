import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleTable, type SimpleColumn } from "@/components/kit/table/SimpleTable";
import { RowActions } from "@/components/kit/RowActions";
import { TableSkeleton } from "@/components/kit/TableSkeleton";
import { capitalizeFirst, errorMessage } from "@/components/agenda/agenda-ui";
import { addHoliday, fetchHolidays, formatLongDay, removeHoliday, today } from "@/components/agenda/agenda-api";

interface HolidayRow {
  id: string | null;
  fecha: string;
  nombre: string;
}

/**
 * Festivos: los nacionales de Colombia se calculan solos (Ley 51 de 1983);
 * la institución agrega los suyos. Ese día no se ofrecen cupos, salvo a quien
 * tenga marcado «Atiende festivos».
 */
export function HolidaysSettings() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(Number(today().slice(0, 4)));
  const [fecha, setFecha] = useState("");
  const [nombre, setNombre] = useState("");
  const query = useQuery({ queryKey: ["agenda", "festivos", year], queryFn: () => fetchHolidays(year) });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["agenda", "festivos"] });
  const add = useMutation({
    mutationFn: () => addHoliday({ fecha, nombre: nombre.trim() }),
    onSuccess: () => {
      toast.success("Festivo agregado");
      setFecha("");
      setNombre("");
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = async (id: string) => {
    try {
      await removeHoliday(id);
      toast.success("Festivo quitado");
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const rows: HolidayRow[] = [
    ...(query.data?.nacionales ?? []).map((h) => ({ id: null, ...h })),
    ...(query.data?.empresa ?? []),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));

  const columns: SimpleColumn<HolidayRow>[] = [
    { id: "fecha", title: "Fecha", className: "whitespace-nowrap", cell: (h) => capitalizeFirst(formatLongDay(h.fecha)) },
    { id: "nombre", title: "Festivo", primary: true, cell: (h) => h.nombre },
    { id: "origen", title: "Origen", cell: (h) => <span className="text-muted-foreground">{h.id ? "De la institución" : "Nacional"}</span> },
    {
      id: "acciones",
      title: "",
      className: "w-12",
      cell: (h) =>
        h.id ? (
          <RowActions
            name={h.nombre}
            onDelete={() => remove(h.id as string)}
            deleteConfirmation={{ title: "¿Quitar este festivo?", description: `«${h.nombre}» volverá a ser un día con agenda.` }}
          />
        ) : null,
    },
  ];

  const canAdd = !!fecha && nombre.trim().length >= 2 && !add.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Año anterior" onClick={() => setYear(year - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center text-[15px] font-semibold tabular-nums">{year}</span>
          <Button variant="ghost" size="icon" aria-label="Año siguiente" onClick={() => setYear(year + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (canAdd) add.mutate();
          }}
        >
          <Input type="date" aria-label="Fecha del festivo" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-9 w-40" />
          <Input aria-label="Nombre del festivo" placeholder="Por ejemplo: aniversario de la IPS" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} className="h-9 w-64" />
          <Button type="submit" disabled={!canAdd} className="h-9 gap-1.5 rounded-full">
            {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Agregar
          </Button>
        </form>
      </div>
      {query.isLoading ? (
        <TableSkeleton columns={3} />
      ) : query.isError ? (
        <p className="text-[13px] text-destructive">{errorMessage(query.error)}</p>
      ) : (
        <SimpleTable columns={columns} rows={rows} rowKey={(h) => h.id ?? `n-${h.fecha}`} empty="Sin festivos este año." />
      )}
    </div>
  );
}
