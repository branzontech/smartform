import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/data/client";
import { fetchPatientCitas, type Cita } from "@/components/agenda/agenda-api";
import type { EditablePatientRow } from "@/components/patients/PatientEditForm";
import { recordsKey, useRecordsHistory } from "@/components/forms/registros/useRecordsHistory";
import { clinicalSnapshot } from "./clinical-snapshot";
import { chartKeys, fetchPatientOrders, nextCita, ordersOf } from "./chart-model";

async function fetchPatient(id: string): Promise<EditablePatientRow | null> {
  const { data, error } = await db.from("pacientes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as EditablePatientRow | null;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Todo lo que muestra la ficha del paciente: sus datos, sus citas, sus órdenes
 * y sus registros clínicos, más lo que se deriva de ellos (resumen clínico,
 * próxima cita y qué quedó en cada atención).
 */
export function usePatientChart(id: string) {
  const queryClient = useQueryClient();
  const patientQuery = useQuery({ queryKey: chartKeys.patient(id), queryFn: () => fetchPatient(id), enabled: !!id });
  const citasQuery = useQuery({ queryKey: chartKeys.citas(id), queryFn: () => fetchPatientCitas(id), enabled: !!id });
  const ordersQuery = useQuery({ queryKey: chartKeys.orders(id), queryFn: () => fetchPatientOrders(id), enabled: !!id });
  const { records, provenanceByRecord, isLoading: recordsLoading } = useRecordsHistory(id);

  const citas = useMemo(() => citasQuery.data ?? [], [citasQuery.data]);
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const snapshot = useMemo(() => clinicalSnapshot(records), [records]);
  const next = useMemo(() => nextCita(citas), [citas]);

  /** Registros de una atención, en el orden en que se guardaron. */
  const recordsOf = useCallback(
    (admisionId: string | null) =>
      admisionId ? records.filter((r) => r.response.admision_id === admisionId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) : [],
    [records],
  );

  const summaryOf = useCallback(
    (cita: Cita) => {
      const formats = recordsOf(cita.admisionId).filter((r) => r.state === "active").length;
      const given = ordersOf(orders, cita.admisionId).filter((o) => o.estadoRegistro === "active").length;
      return [formats ? plural(formats, "formato", "formatos") : "", given ? plural(given, "orden", "órdenes") : ""].filter(Boolean).join(" · ");
    },
    [recordsOf, orders],
  );

  const setPatient = (updated: EditablePatientRow) => queryClient.setQueryData<EditablePatientRow | null>(chartKeys.patient(id), updated);
  const refreshRecords = () => {
    void queryClient.invalidateQueries({ queryKey: recordsKey(id) });
    void queryClient.invalidateQueries({ queryKey: ["records-history-provenance", id] });
  };

  return {
    patientQuery,
    citasQuery,
    ordersQuery,
    citas,
    orders,
    records,
    provenanceByRecord,
    recordsLoading,
    snapshot,
    next,
    recordsOf,
    summaryOf,
    setPatient,
    refreshRecords,
  };
}
