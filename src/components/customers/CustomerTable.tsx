import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Edit, MessageCircle } from "lucide-react";
import { AccionesFila } from "@/components/kit/AccionesFila";
import {
  BarraTabla, CeldaEstado, TablaDatos, useTablaDatos,
  type ColumnaTabla, type FiltroTabla, type SegmentoTabla, type TonoEstado,
} from "@/components/kit/tabla";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/types/customer-types";

// DATOS SIMULADOS: el módulo de clientes aún no tiene tabla ni API; esta lista es de ejemplo.
const CLIENTES_SIMULADOS: Customer[] = [
  {
    id: "1",
    name: "Ana García Martínez",
    email: "ana.garcia@example.com",
    phone: "+34 612 345 678",
    whatsapp: "+34 612 345 678",
    status: "Activo",
    frequency: "Frecuente",
    loyalty: "Alta",
    lastContact: new Date(2023, 2, 15),
    nextContactDate: new Date(2023, 4, 1),
    createdAt: new Date(2020, 5, 10),
    appointmentCount: 24,
    totalSpent: 1850,
    lastAppointment: new Date(2023, 3, 20),
    tags: ["VIP", "Tratamiento mensual"],
  },
  {
    id: "2",
    name: "Carlos Rodríguez López",
    email: "carlos.rodriguez@example.com",
    phone: "+34 623 456 789",
    status: "Inactivo",
    frequency: "Esporádico",
    loyalty: "Baja",
    lastContact: new Date(2022, 10, 5),
    createdAt: new Date(2021, 2, 20),
    appointmentCount: 3,
    totalSpent: 250,
    lastAppointment: new Date(2022, 10, 1),
  },
  {
    id: "3",
    name: "María Fernández González",
    email: "maria.fernandez@example.com",
    phone: "+34 634 567 890",
    whatsapp: "+34 634 567 890",
    status: "Activo",
    frequency: "Regular",
    loyalty: "Media",
    lastContact: new Date(2023, 1, 20),
    nextContactDate: new Date(2023, 3, 15),
    createdAt: new Date(2021, 8, 12),
    appointmentCount: 12,
    totalSpent: 980,
    lastAppointment: new Date(2023, 1, 15),
    tags: ["Descuentos", "Preferencial"],
  },
  {
    id: "4",
    name: "David Sánchez Pérez",
    email: "david.sanchez@example.com",
    phone: "+34 645 678 901",
    status: "Potencial",
    frequency: "Nuevo",
    loyalty: "Sin historial",
    lastContact: new Date(2023, 3, 1),
    createdAt: new Date(2023, 3, 1),
    appointmentCount: 0,
    totalSpent: 0,
  },
  {
    id: "5",
    name: "Laura Gómez Martín",
    email: "laura.gomez@example.com",
    phone: "+34 656 789 012",
    whatsapp: "+34 656 789 012",
    status: "Activo",
    frequency: "Frecuente",
    loyalty: "Alta",
    lastContact: new Date(2023, 2, 28),
    nextContactDate: new Date(2023, 3, 25),
    createdAt: new Date(2020, 1, 5),
    appointmentCount: 32,
    totalSpent: 2340,
    lastAppointment: new Date(2023, 2, 20),
    tags: ["VIP", "Planes especiales"],
  },
];

const TONO_ESTADO: Record<Customer["status"], TonoEstado> = {
  Activo: "exito",
  Inactivo: "error",
  Potencial: "info",
  Lead: "primario",
};

const fechaCorta = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });
const numero = new Intl.NumberFormat("es-CO");
const derecha = "text-right tabular-nums";

/** Una celda, un dato, una línea. Lo demás está en el detalle del cliente. */
const COLUMNAS: ColumnaTabla<Customer>[] = [
  { id: "cliente", titulo: "Cliente", valor: (c) => c.name, principal: true, fija: true, className: "min-w-[220px]" },
  { id: "correo", titulo: "Correo", valor: (c) => c.email },
  { id: "telefono", titulo: "Teléfono", valor: (c) => c.phone, className: "tabular-nums" },
  {
    id: "estado", titulo: "Estado", valor: (c) => c.status, sinPadding: true,
    celda: (c) => <CeldaEstado tono={TONO_ESTADO[c.status]} texto={c.status} />,
  },
  { id: "frecuencia", titulo: "Frecuencia", valor: (c) => c.frequency },
  { id: "fidelizacion", titulo: "Fidelización", valor: (c) => c.loyalty, oculta: true },
  { id: "citas", titulo: "Citas", valor: (c) => c.appointmentCount, className: derecha, oculta: true },
  { id: "total", titulo: "Total gastado", valor: (c) => c.totalSpent, celda: (c) => numero.format(c.totalSpent), className: derecha, oculta: true },
  {
    id: "ultimaVisita", titulo: "Última visita", valor: (c) => c.lastAppointment?.getTime(),
    celda: (c) => (c.lastAppointment ? fechaCorta.format(c.lastAppointment) : "Sin visitas"), className: "tabular-nums",
  },
  {
    id: "desde", titulo: "Cliente desde", valor: (c) => c.createdAt.getTime(),
    celda: (c) => fechaCorta.format(c.createdAt), className: "tabular-nums", oculta: true,
  },
];

const FILTROS: FiltroTabla<Customer>[] = [
  { id: "frecuencia", titulo: "Frecuencia", valor: (c) => c.frequency },
  { id: "fidelizacion", titulo: "Fidelización", valor: (c) => c.loyalty },
  { id: "etiqueta", titulo: "Etiqueta", valor: (c) => c.tags ?? [] },
];

const SEGMENTOS: SegmentoTabla<Customer>[] = [
  { id: "todos", titulo: "Todos", cumple: () => true },
  { id: "activos", titulo: "Activos", cumple: (c) => c.status === "Activo" },
  { id: "potenciales", titulo: "Potenciales", cumple: (c) => c.status === "Potencial" || c.status === "Lead" },
  { id: "inactivos", titulo: "Inactivos", cumple: (c) => c.status === "Inactivo" },
];

const claveFila = (c: Customer) => c.id;

/** Listado de clientes con la convención de tablas de Ker Hub. */
export const CustomerTable = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Customer[]>(CLIENTES_SIMULADOS);
  const t = useTablaDatos({ id: "clientes.lista", filas: clientes, columnas: COLUMNAS, claveFila, filtros: FILTROS, segmentos: SEGMENTOS });

  const ver = (c: Customer) => navigate(`/app/clientes/${c.id}`);

  // Datos simulados: eliminar solo lo quita de la lista en pantalla.
  const eliminar = (c: Customer) => {
    setClientes((lista) => lista.filter((x) => x.id !== c.id));
    toast({ title: "Cliente eliminado", description: c.name });
  };

  return (
    <TablaDatos
      t={t}
      onFilaClick={ver}
      barra={<BarraTabla t={t} nombre={["cliente", "clientes"]} placeholder="Buscar por nombre, correo o teléfono" nombreArchivo="clientes" />}
      acciones={(c) => (
        <AccionesFila
          nombre={c.name}
          onVer={() => ver(c)}
          menu={[
            { titulo: "Editar", icono: Edit, onClick: () => navigate(`/app/clientes/editar/${c.id}`) },
            { titulo: "Enviar mensaje", icono: MessageCircle, onClick: () => navigate(`/app/clientes/notificaciones/nueva?id=${c.id}`) },
            { titulo: "Agendar cita", icono: Calendar, onClick: () => navigate(`/app/citas/nueva?clienteId=${c.id}`) },
          ]}
          onEliminar={() => eliminar(c)}
        />
      )}
      vacio="Aún no hay clientes. Registra uno con «Nuevo cliente»."
    />
  );
};
