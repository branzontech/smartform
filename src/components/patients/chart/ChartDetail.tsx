import type { Order } from "@kerhub/core/ordenes";
import { useAuth } from "@/contexts/AuthContext";
import type { Cita } from "@/components/agenda/agenda-api";
import { RecordPreview } from "@/components/forms/registros/RecordPreview";
import { printRecords } from "@/components/forms/registros/print";
import type { ClinicalRecord, Provenance } from "@/components/forms/registros/types";
import { AttentionDetail, OrderBlock } from "./AttentionDetail";
import { ordersOf, type ChartView } from "./chart-model";

interface ChartDetailProps {
  view: ChartView;
  patientId: string;
  selectedId: string | null;
  citas: Cita[];
  records: ClinicalRecord[];
  orders: Order[];
  provenanceByRecord: Record<string, Provenance[]>;
  recordsLoading: boolean;
  recordsOf: (admisionId: string | null) => ClinicalRecord[];
  onRecordsChanged: () => void;
  onBack: () => void;
}

const Empty = ({ children }: { children: string }) => <p className="px-6 py-16 text-center text-sm text-muted-foreground">{children}</p>;

/**
 * Lado derecho de la ficha según la pestaña: la atención elegida, el registro
 * elegido (con imprimir y corregir) o la atención a la que pertenece una orden.
 */
export function ChartDetail(props: ChartDetailProps) {
  const { view, patientId, selectedId, citas, records, orders, recordsOf, recordsLoading, onBack } = props;
  const { hasRole } = useAuth();

  const attention = (cita: Cita, focusOrders = false) => (
    <AttentionDetail
      key={`${cita.id}-${focusOrders ? selectedId : ""}`}
      cita={cita}
      patientId={patientId}
      records={recordsOf(cita.admisionId)}
      orders={ordersOf(orders, cita.admisionId)}
      recordsLoading={recordsLoading}
      focusOrders={focusOrders}
      onBack={onBack}
    />
  );

  if (view === "atenciones") {
    const cita = citas.find((c) => c.id === selectedId);
    return cita ? attention(cita) : <Empty>Elige una atención para ver lo que quedó registrado.</Empty>;
  }

  if (view === "registros") {
    const record = records.find((r) => r.id === selectedId);
    if (!record) return <Empty>Elige un registro para verlo aquí.</Empty>;
    return (
      <div className="h-full overflow-y-auto [scrollbar-width:thin]">
        <RecordPreview
          key={record.id}
          record={record}
          provenance={props.provenanceByRecord[record.id] ?? []}
          canCorrect={hasRole("doctor") || hasRole("admin")}
          onPrint={() => void printRecords([record], { patientId })}
          onCorrected={props.onRecordsChanged}
          onBack={onBack}
        />
      </div>
    );
  }

  const order = orders.find((o) => o.id === selectedId);
  if (!order) return <Empty>Elige una orden para ver la atención en que se dio.</Empty>;
  const cita = citas.find((c) => !!c.admisionId && c.admisionId === order.admisionId);
  if (cita) return attention(cita, true);
  return (
    <div className="grid gap-2 px-6 py-5">
      <p className="text-[13px] text-muted-foreground">Esta orden no está ligada a una cita de la agenda.</p>
      <OrderBlock order={order} />
    </div>
  );
}
