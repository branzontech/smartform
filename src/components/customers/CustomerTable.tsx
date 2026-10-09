import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Edit, MessageCircle } from "lucide-react";
import { RowActions } from "@/components/kit/RowActions";
import {
  TableToolbar, StatusCell, DataTable, useDataTable,
  type TableColumn, type TableFilter, type TableSegment, type StatusTone,
} from "@/components/kit/table";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/types/customer-types";

// DATOS SIMULADOS: el módulo de clientes aún no tiene tabla ni API; esta lista es de ejemplo.
const MOCK_CUSTOMERS: Customer[] = [
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

const STATUS_TONE: Record<Customer["status"], StatusTone> = {
  Activo: "success",
  Inactivo: "error",
  Potencial: "info",
  Lead: "primary",
};

const shortDate = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });
const numberFormat = new Intl.NumberFormat("es-CO");
const rightAligned = "text-right tabular-nums";

/** Una celda, un dato, una línea. Lo demás está en el detalle del cliente. */
const COLUMNS: TableColumn<Customer>[] = [
  { id: "customer", title: "Cliente", value: (c) => c.name, primary: true, alwaysVisible: true, className: "min-w-[220px]" },
  { id: "email", title: "Correo", value: (c) => c.email },
  { id: "phone", title: "Teléfono", value: (c) => c.phone, className: "tabular-nums" },
  {
    id: "status", title: "Estado", value: (c) => c.status, flush: true,
    cell: (c) => <StatusCell tone={STATUS_TONE[c.status]} text={c.status} />,
  },
  { id: "frequency", title: "Frecuencia", value: (c) => c.frequency },
  { id: "loyalty", title: "Fidelización", value: (c) => c.loyalty, hidden: true },
  { id: "appointments", title: "Citas", value: (c) => c.appointmentCount, className: rightAligned, hidden: true },
  { id: "total", title: "Total gastado", value: (c) => c.totalSpent, cell: (c) => numberFormat.format(c.totalSpent), className: rightAligned, hidden: true },
  {
    id: "lastVisit", title: "Última visita", value: (c) => c.lastAppointment?.getTime(),
    cell: (c) => (c.lastAppointment ? shortDate.format(c.lastAppointment) : "Sin visitas"), className: "tabular-nums",
  },
  {
    id: "customerSince", title: "Cliente desde", value: (c) => c.createdAt.getTime(),
    cell: (c) => shortDate.format(c.createdAt), className: "tabular-nums", hidden: true,
  },
];

const FILTERS: TableFilter<Customer>[] = [
  { id: "frequency", title: "Frecuencia", value: (c) => c.frequency },
  { id: "loyalty", title: "Fidelización", value: (c) => c.loyalty },
  { id: "tag", title: "Etiqueta", value: (c) => c.tags ?? [] },
];

const SEGMENTS: TableSegment<Customer>[] = [
  { id: "all", title: "Todos", match: () => true },
  { id: "active", title: "Activos", match: (c) => c.status === "Activo" },
  { id: "prospects", title: "Potenciales", match: (c) => c.status === "Potencial" || c.status === "Lead" },
  { id: "inactive", title: "Inactivos", match: (c) => c.status === "Inactivo" },
];

const rowKey = (c: Customer) => c.id;

/** Listado de clientes con la convención de tablas de Ker Hub. */
export const CustomerTable = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const t = useDataTable({ id: "customers.list", rows: customers, columns: COLUMNS, rowKey, filters: FILTERS, segments: SEGMENTS });

  const view = (c: Customer) => navigate(`/app/clientes/${c.id}`);

  // Datos simulados: eliminar solo lo quita de la lista en pantalla.
  const remove = (c: Customer) => {
    setCustomers((list) => list.filter((x) => x.id !== c.id));
    toast({ title: "Cliente eliminado", description: c.name });
  };

  return (
    <DataTable
      t={t}
      onRowClick={view}
      toolbar={<TableToolbar t={t} name={["cliente", "clientes"]} placeholder="Buscar por nombre, correo o teléfono" fileName="clientes" />}
      actions={(c) => (
        <RowActions
          name={c.name}
          onView={() => view(c)}
          menu={[
            { title: "Editar", icon: Edit, onClick: () => navigate(`/app/clientes/editar/${c.id}`) },
            { title: "Enviar mensaje", icon: MessageCircle, onClick: () => navigate(`/app/clientes/notificaciones/nueva?id=${c.id}`) },
            { title: "Agendar cita", icon: Calendar, onClick: () => navigate(`/app/citas/nueva?clienteId=${c.id}`) },
          ]}
          onDelete={() => remove(c)}
        />
      )}
      empty="Aún no hay clientes. Registra uno con «Nuevo cliente»."
    />
  );
};
