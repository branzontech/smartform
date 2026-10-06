import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit } from "lucide-react";
import { getAllInventoryItems, deleteInventoryItem } from "@/utils/inventory-utils";
import type { InventoryItem, InventoryStatus } from "@/types/inventory-types";
import { toast } from "@/hooks/use-toast";
import { EncabezadoModulo } from "@/components/kit/EncabezadoModulo";
import { AccionesFila } from "@/components/kit/AccionesFila";
import {
  BarraTabla, CeldaEstado, TablaDatos, useTablaDatos,
  type ColumnaTabla, type FiltroTabla, type SegmentoTabla, type TonoEstado,
} from "@/components/kit/tabla";

const TONO_ESTADO: Record<InventoryStatus, TonoEstado> = {
  "Disponible": "exito",
  "Próximo a agotarse": "aviso",
  "Agotado": "error",
  "Vencido": "error",
  "En cuarentena": "neutro",
};

const derecha = "text-right tabular-nums";
const fechaCorta = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });

/** Una celda, un dato, una línea. Lo demás está en el detalle del artículo. */
const COLUMNAS: ColumnaTabla<InventoryItem>[] = [
  { id: "nombre", titulo: "Nombre", valor: (i) => i.name, principal: true, fija: true, className: "min-w-[200px]" },
  { id: "categoria", titulo: "Categoría", valor: (i) => i.category },
  { id: "cantidad", titulo: "Cantidad", valor: (i) => i.quantity, className: derecha },
  { id: "unidad", titulo: "Unidad", valor: (i) => i.unit },
  { id: "ubicacion", titulo: "Ubicación", valor: (i) => i.location },
  { id: "minimo", titulo: "Stock mínimo", valor: (i) => i.minimumStock, className: derecha, oculta: true },
  { id: "proveedor", titulo: "Proveedor", valor: (i) => i.supplier, oculta: true },
  {
    id: "vencimiento", titulo: "Vencimiento", valor: (i) => i.expirationDate, oculta: true, className: "tabular-nums",
    celda: (i) => (i.expirationDate ? fechaCorta.format(new Date(i.expirationDate)) : "—"),
  },
  { id: "descripcion", titulo: "Descripción", valor: (i) => i.description, oculta: true },
  {
    id: "estado", titulo: "Estado", valor: (i) => i.status, sinPadding: true, className: "w-40",
    celda: (i) => <CeldaEstado tono={TONO_ESTADO[i.status] ?? "neutro"} texto={i.status} />,
  },
];

const FILTROS: FiltroTabla<InventoryItem>[] = [
  { id: "categoria", titulo: "Categoría", valor: (i) => i.category },
  { id: "ubicacion", titulo: "Ubicación", valor: (i) => i.location },
  { id: "estado", titulo: "Estado", valor: (i) => i.status },
];

const SEGMENTOS: SegmentoTabla<InventoryItem>[] = [
  { id: "todos", titulo: "Todos", cumple: () => true },
  { id: "por-agotarse", titulo: "Por agotarse", cumple: (i) => i.status === "Próximo a agotarse" },
  { id: "agotados", titulo: "Agotados", cumple: (i) => i.status === "Agotado" },
  { id: "vencidos", titulo: "Vencidos", cumple: (i) => i.status === "Vencido" },
];

const claveFila = (i: InventoryItem) => i.id;

/** Artículos de inventario (almacenamiento local) con el kit de tablas de Ker Hub. */
const InventoryList = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cargando, setCargando] = useState(true);

  const loadInventory = useCallback(() => {
    setInventory(getAllInventoryItems());
    setCargando(false);
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const t = useTablaDatos({ id: "inventario.articulos", filas: inventory, columnas: COLUMNAS, claveFila, filtros: FILTROS, segmentos: SEGMENTOS });

  const handleDelete = (id: string) => {
    if (deleteInventoryItem(id)) {
      toast({ title: "Artículo eliminado", description: "El artículo ha sido eliminado correctamente." });
      loadInventory();
    } else {
      toast({ title: "Error", description: "No se pudo eliminar el artículo.", variant: "destructive" });
    }
  };

  const ver = (i: InventoryItem) => navigate(`/app/inventario/${i.id}`);

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <EncabezadoModulo
        titulo="Artículos de inventario"
        primaria={{ titulo: "Nuevo artículo", onClick: () => navigate("/app/inventario/nuevo") }}
      />
      <TablaDatos
        t={t}
        cargando={cargando}
        onFilaClick={ver}
        barra={<BarraTabla t={t} nombre={["artículo", "artículos"]} placeholder="Buscar por nombre, categoría o descripción" nombreArchivo="articulos-inventario" />}
        acciones={(i) => (
          <AccionesFila
            nombre={i.name}
            onVer={() => ver(i)}
            menu={[{ titulo: "Editar", icono: Edit, onClick: () => navigate(`/app/inventario/editar/${i.id}`) }]}
            onEliminar={() => handleDelete(i.id)}
            confirmarEliminar={{ titulo: "¿Eliminar este artículo?", descripcion: `«${i.name}» se eliminará del inventario y no se podrá recuperar.` }}
          />
        )}
        vacio="Aún no hay artículos. Registra uno con «Nuevo artículo»."
      />
    </div>
  );
};

export default InventoryList;
