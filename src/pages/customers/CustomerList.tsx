import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, CalendarDays, Gift, MessageCircle, Upload } from "lucide-react";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { FolderTabs, type FolderTab } from "@/components/kit/tabs/FolderTabs";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerStats } from "@/components/customers/CustomerStats";

type CustomerView = "list" | "stats";

const TABS: FolderTab<CustomerView>[] = [
  { id: "list", title: "Clientes", pinned: true },
  { id: "stats", title: "Estadísticas" },
];
const INITIAL_VISIBLE: CustomerView[] = ["list", "stats"];

/** Clientes: lista y estadísticas como pestañas de carpeta. */
const CustomerList = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<CustomerView>("list");

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader
        title="Clientes"
        secondary={[
          { title: "Nueva notificación", icon: MessageCircle, onClick: () => navigate("/app/clientes/notificaciones/nueva") },
          { title: "Nueva cita", icon: Calendar, onClick: () => navigate("/app/citas/nueva") },
        ]}
        menu={[
          { title: "Importar clientes", icon: Upload, onClick: () => navigate("/app/clientes/importar") },
          { title: "Ver calendario", icon: CalendarDays, onClick: () => navigate("/app/citas") },
          { title: "Descuentos", icon: Gift, onClick: () => navigate("/app/clientes/descuentos") },
        ]}
        primary={{ title: "Nuevo cliente", onClick: () => navigate("/app/clientes/nuevo") }}
      />
      <div>
        <FolderTabs
          id="customers.tabs"
          tabs={TABS}
          active={view}
          onChange={setView}
          initialVisible={INITIAL_VISIBLE}
          label="Vistas de clientes"
        />
        <div className="pt-4">{view === "list" ? <CustomerTable /> : <CustomerStats />}</div>
      </div>
    </div>
  );
};

export default CustomerList;
