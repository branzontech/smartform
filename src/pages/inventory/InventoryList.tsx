import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit } from "lucide-react";
import { getAllInventoryItems, deleteInventoryItem } from "@/utils/inventory-utils";
import type { InventoryItem, InventoryStatus } from "@/types/inventory-types";
import { toast } from "@/hooks/use-toast";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { RowActions } from "@/components/kit/RowActions";
import {
  TableToolbar, StatusCell, DataTable, useDataTable,
  type TableColumn, type TableFilter, type TableSegment, type StatusTone,
} from "@/components/kit/table";

const STATUS_TONE: Record<InventoryStatus, StatusTone> = {
  "Disponible": "success",
  "Próximo a agotarse": "warning",
  "Agotado": "error",
  "Vencido": "error",
  "En cuarentena": "neutral",
};

const rightAligned = "text-right tabular-nums";
const shortDate = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });

/** Una celda, un dato, una línea. Lo demás está en el detalle del artículo. */
const COLUMNS: TableColumn<InventoryItem>[] = [
  { id: "name", title: "Nombre", value: (i) => i.name, primary: true, alwaysVisible: true, className: "min-w-[200px]" },
  { id: "category", title: "Categoría", value: (i) => i.category },
  { id: "quantity", title: "Cantidad", value: (i) => i.quantity, className: rightAligned },
  { id: "unit", title: "Unidad", value: (i) => i.unit },
  { id: "location", title: "Ubicación", value: (i) => i.location },
  { id: "minimum", title: "Stock mínimo", value: (i) => i.minimumStock, className: rightAligned, hidden: true },
  { id: "supplier", title: "Proveedor", value: (i) => i.supplier, hidden: true },
  {
    id: "expiry", title: "Vencimiento", value: (i) => i.expirationDate, hidden: true, className: "tabular-nums",
    cell: (i) => (i.expirationDate ? shortDate.format(new Date(i.expirationDate)) : "—"),
  },
  { id: "description", title: "Descripción", value: (i) => i.description, hidden: true },
  {
    id: "status", title: "Estado", value: (i) => i.status, flush: true, className: "w-40",
    cell: (i) => <StatusCell tone={STATUS_TONE[i.status] ?? "neutral"} text={i.status} />,
  },
];

const FILTERS: TableFilter<InventoryItem>[] = [
  { id: "category", title: "Categoría", value: (i) => i.category },
  { id: "location", title: "Ubicación", value: (i) => i.location },
  { id: "status", title: "Estado", value: (i) => i.status },
];

const SEGMENTS: TableSegment<InventoryItem>[] = [
  { id: "all", title: "Todos", match: () => true },
  { id: "lowStock", title: "Por agotarse", match: (i) => i.status === "Próximo a agotarse" },
  { id: "outOfStock", title: "Agotados", match: (i) => i.status === "Agotado" },
  { id: "expired", title: "Vencidos", match: (i) => i.status === "Vencido" },
];

const rowKey = (i: InventoryItem) => i.id;

/** Artículos de inventario (almacenamiento local) con el kit de tablas de Ker Hub. */
const InventoryList = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = useCallback(() => {
    setInventory(getAllInventoryItems());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const t = useDataTable({ id: "inventory.items", rows: inventory, columns: COLUMNS, rowKey, filters: FILTERS, segments: SEGMENTS });

  const handleDelete = (id: string) => {
    if (deleteInventoryItem(id)) {
      toast({ title: "Artículo eliminado", description: "El artículo ha sido eliminado correctamente." });
      loadInventory();
    } else {
      toast({ title: "Error", description: "No se pudo eliminar el artículo.", variant: "destructive" });
    }
  };

  const view = (i: InventoryItem) => navigate(`/app/inventario/${i.id}`);

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader
        title="Artículos de inventario"
        primary={{ title: "Nuevo artículo", onClick: () => navigate("/app/inventario/nuevo") }}
      />
      <DataTable
        t={t}
        loading={loading}
        onRowClick={view}
        toolbar={<TableToolbar t={t} name={["artículo", "artículos"]} placeholder="Buscar por nombre, categoría o descripción" fileName="articulos-inventario" />}
        actions={(i) => (
          <RowActions
            name={i.name}
            onView={() => view(i)}
            menu={[{ title: "Editar", icon: Edit, onClick: () => navigate(`/app/inventario/editar/${i.id}`) }]}
            onDelete={() => handleDelete(i.id)}
            deleteConfirmation={{ title: "¿Eliminar este artículo?", description: `«${i.name}» se eliminará del inventario y no se podrá recuperar.` }}
          />
        )}
        empty="Aún no hay artículos. Registra uno con «Nuevo artículo»."
      />
    </div>
  );
};

export default InventoryList;
