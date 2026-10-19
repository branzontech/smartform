import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleTable, type SimpleColumn } from "@/components/kit/table/SimpleTable";
import { RowActions } from "@/components/kit/RowActions";
import { TableSkeleton } from "@/components/kit/TableSkeleton";
import { errorMessage } from "@/components/agenda/agenda-ui";
import { CATEGORY_LABEL, MODALITY_LABEL, fetchAppointmentTypes, type TipoCita } from "@/components/agenda/agenda-api";
import { AppointmentTypeSheet } from "./AppointmentTypeSheet";

/** Tipos de cita de la IPS: lo que se elige al agendar y define duración, modalidades y quién atiende. */
export function AppointmentTypesSettings() {
  const query = useQuery({ queryKey: ["agenda", "tipos-cita", "todos"], queryFn: () => fetchAppointmentTypes(false) });
  const [editing, setEditing] = useState<TipoCita | null>(null);
  const [open, setOpen] = useState(false);

  const openSheet = (tipo: TipoCita | null) => {
    setEditing(tipo);
    setOpen(true);
  };

  const columns: SimpleColumn<TipoCita>[] = [
    {
      id: "nombre",
      title: "Tipo de cita",
      primary: true,
      cell: (t) => (
        <button type="button" onClick={() => openSheet(t)} className="text-left hover:text-primary">
          {t.nombre}
          {t.codigo && <span className="ml-2 text-xs font-normal text-muted-foreground">{t.codigo}</span>}
        </button>
      ),
    },
    { id: "categoria", title: "Categoría", cell: (t) => CATEGORY_LABEL[t.categoria] },
    { id: "duracion", title: "Duración", className: "text-right tabular-nums", cell: (t) => `${t.duracionMin} min` },
    { id: "modalidades", title: "Modalidades", cell: (t) => t.modalidades.map((m) => MODALITY_LABEL[m]).join(", ") },
    { id: "atiende", title: "Quiénes atienden", cell: (t) => (t.profesionalIds.length ? `${t.profesionalIds.length} asignados` : "Todos") },
    { id: "estado", title: "Estado", cell: (t) => <span className={t.activo ? "text-foreground" : "text-muted-foreground"}>{t.activo ? "Activo" : "Inactivo"}</span> },
    { id: "acciones", title: "", className: "w-12", cell: (t) => <RowActions name={t.nombre} onView={() => openSheet(t)} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openSheet(null)} className="h-9 gap-1.5 rounded-full">
          <Plus className="h-4 w-4" />
          Nuevo tipo de cita
        </Button>
      </div>
      {query.isLoading ? (
        <TableSkeleton columns={6} />
      ) : query.isError ? (
        <p className="text-[13px] text-destructive">{errorMessage(query.error)}</p>
      ) : (
        <SimpleTable columns={columns} rows={query.data ?? []} rowKey={(t) => t.id} empty="Aún no hay tipos de cita. Crea el primero." />
      )}
      <AppointmentTypeSheet open={open} onOpenChange={setOpen} tipo={editing} />
    </div>
  );
}
