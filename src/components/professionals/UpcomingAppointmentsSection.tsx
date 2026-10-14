import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import {
  fetchCitas, formatShortDay, localDay, localTime, MODALITY_LABEL, STATE_LABEL, type Cita,
} from "@/components/agenda/agenda-api";
import { ContractSection } from "@/components/contracts/fields";
import { SimpleTable, type SimpleColumn } from "@/components/kit/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { professionalKeys } from "./professional-form";

const RANGE_DAYS = 14;

/** Rango fijo al abrir la ficha: desde ahora hasta dentro de 14 días (estable para la clave de la consulta). */
const initialRange = () => {
  const now = Date.now();
  return { from: new Date(now).toISOString(), to: new Date(now + RANGE_DAYS * 86_400_000).toISOString() };
};

export function UpcomingAppointmentsSection({ professionalId }: { professionalId: string }) {
  const navigate = useNavigate();
  const [range] = useState(initialRange);
  const { data: citas = [], isLoading, error } = useQuery({
    queryKey: professionalKeys.appointments(professionalId, range.from, range.to),
    queryFn: () => fetchCitas({ desde: range.from, hasta: range.to, profesionalId: professionalId }),
  });
  const open = (c: Cita) => navigate(`/app/citas/${c.id}`);

  const columns: SimpleColumn<Cita>[] = [
    { id: "day", title: "Fecha", cell: (c) => formatShortDay(localDay(c.inicio)), className: "whitespace-nowrap" },
    { id: "time", title: "Hora", cell: (c) => `${localTime(c.inicio)} a ${localTime(c.fin)}`, className: "whitespace-nowrap tabular-nums" },
    { id: "patient", title: "Paciente", cell: (c) => c.paciente, primary: true },
    { id: "modality", title: "Modalidad", cell: (c) => MODALITY_LABEL[c.modalidad] },
    { id: "state", title: "Estado", cell: (c) => STATE_LABEL[c.estado] },
    {
      id: "open",
      title: <span className="sr-only">Acciones</span>,
      className: "w-12 text-right",
      cell: (c) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Ver la cita de ${c.paciente}`}
          title="Ver cita"
          onClick={() => open(c)}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Button>
      ),
    },
  ];

  return (
    <ContractSection id="citas" title="Próximas citas" description={`Citas de los próximos ${RANGE_DAYS} días.`}>
      {isLoading ? (
        <div className="grid gap-2" aria-busy="true">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
        </div>
      ) : (
        <SimpleTable
          columns={columns}
          rows={citas}
          rowKey={(c) => c.id}
          empty={error ? `No se pudieron cargar las citas: ${(error as Error).message}` : "No tiene citas en los próximos 14 días."}
        />
      )}
    </ContractSection>
  );
}
