import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EncabezadoModulo } from "@/components/kit/EncabezadoModulo";
import { AccionesFila } from "@/components/kit/AccionesFila";
import {
  BarraTabla, CeldaEstado, TablaDatos, useTablaDatos,
  type ColumnaTabla, type FiltroTabla, type SegmentoTabla, type TonoEstado,
} from "@/components/kit/tabla";
import { useToast } from "@/hooks/use-toast";
import { getAllDoctors } from "@/utils/doctor-utils";
import type { Doctor } from "@/types/patient-types";

const TONO_ESTADO: Record<Doctor["status"], TonoEstado> = {
  Activo: "exito",
  Vacaciones: "aviso",
  Inactivo: "error",
};

/** Una celda, un dato, una línea. Lo demás está en el perfil del profesional. */
const COLUMNAS: ColumnaTabla<Doctor>[] = [
  { id: "nombre", titulo: "Profesional", valor: (d) => d.name, principal: true, fija: true, className: "min-w-[220px]" },
  { id: "especialidad", titulo: "Especialidad", valor: (d) => d.specialty },
  { id: "registro", titulo: "Registro", valor: (d) => d.licenseNumber, className: "font-mono text-xs" },
  { id: "documento", titulo: "Documento", valor: (d) => d.documentId, className: "font-mono text-xs", oculta: true },
  { id: "telefono", titulo: "Teléfono", valor: (d) => d.contactNumber, className: "tabular-nums" },
  { id: "correo", titulo: "Correo", valor: (d) => d.email, oculta: true },
  {
    id: "estado", titulo: "Estado", valor: (d) => d.status, sinPadding: true,
    celda: (d) => <CeldaEstado tono={TONO_ESTADO[d.status] ?? "neutro"} texto={d.status} />,
  },
];

const especialidades = (d: Doctor) => (d.specialties?.length ? d.specialties : [d.specialty]);

const FILTROS: FiltroTabla<Doctor>[] = [{ id: "especialidad", titulo: "Especialidad", valor: especialidades }];

const SEGMENTOS: SegmentoTabla<Doctor>[] = [
  { id: "todos", titulo: "Todos", cumple: () => true },
  { id: "activos", titulo: "Activos", cumple: (d) => d.status === "Activo" },
  { id: "vacaciones", titulo: "En vacaciones", cumple: (d) => d.status === "Vacaciones" },
  { id: "inactivos", titulo: "Inactivos", cumple: (d) => d.status === "Inactivo" },
];

const claveFila = (d: Doctor) => d.id;

/**
 * Médicos y profesionales. Fuente: getAllDoctors (datos simulados guardados en
 * localStorage hasta que exista la tabla de profesionales).
 */
const DoctorList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [medicos, setMedicos] = useState<Doctor[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const data = await getAllDoctors();
        if (vigente) setMedicos(data);
      } catch (error) {
        if (vigente) {
          toast({
            title: "No se pudieron cargar los profesionales",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          });
        }
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => { vigente = false; };
  }, [toast]);

  const t = useTablaDatos({ id: "medicos.lista", filas: medicos, columnas: COLUMNAS, claveFila, filtros: FILTROS, segmentos: SEGMENTOS });

  const ver = (d: Doctor) => navigate(`/app/medicos/${d.id}`);

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <EncabezadoModulo
        titulo="Médicos y profesionales"
        primaria={{ titulo: "Nuevo profesional", onClick: () => navigate("/app/medicos/nuevo") }}
      />
      <TablaDatos
        t={t}
        cargando={cargando}
        onFilaClick={ver}
        barra={<BarraTabla t={t} nombre={["profesional", "profesionales"]} placeholder="Buscar por nombre o especialidad" nombreArchivo="profesionales" />}
        acciones={(d) => <AccionesFila nombre={d.name} onVer={() => ver(d)} />}
        vacio="Aún no hay profesionales. Registra uno con «Nuevo profesional»."
      />
    </div>
  );
};

export default DoctorList;
