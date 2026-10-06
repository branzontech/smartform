import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, CalendarDays, Gift, MessageCircle, Upload } from "lucide-react";
import { EncabezadoModulo } from "@/components/kit/EncabezadoModulo";
import { PestanasCarpeta, type PestanaCarpeta } from "@/components/kit/pestanas/PestanasCarpeta";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerStats } from "@/components/customers/CustomerStats";

type VistaClientes = "lista" | "estadisticas";

const PESTANAS: PestanaCarpeta<VistaClientes>[] = [
  { id: "lista", titulo: "Clientes", fija: true },
  { id: "estadisticas", titulo: "Estadísticas" },
];
const VISIBLES: VistaClientes[] = ["lista", "estadisticas"];

/** Clientes: lista y estadísticas como pestañas de carpeta. */
const CustomerList = () => {
  const navigate = useNavigate();
  const [vista, setVista] = useState<VistaClientes>("lista");

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <EncabezadoModulo
        titulo="Clientes"
        secundarias={[
          { titulo: "Nueva notificación", icono: MessageCircle, onClick: () => navigate("/app/clientes/notificaciones/nueva") },
          { titulo: "Nueva cita", icono: Calendar, onClick: () => navigate("/app/citas/nueva") },
        ]}
        menu={[
          { titulo: "Importar clientes", icono: Upload, onClick: () => navigate("/app/clientes/importar") },
          { titulo: "Ver calendario", icono: CalendarDays, onClick: () => navigate("/app/citas") },
          { titulo: "Descuentos", icono: Gift, onClick: () => navigate("/app/clientes/descuentos") },
        ]}
        primaria={{ titulo: "Nuevo cliente", onClick: () => navigate("/app/clientes/nuevo") }}
      />
      <div>
        <PestanasCarpeta
          id="clientes.vistas"
          pestanas={PESTANAS}
          activa={vista}
          onCambio={setVista}
          visiblesIniciales={VISIBLES}
          etiqueta="Vistas de clientes"
        />
        <div className="pt-4">{vista === "lista" ? <CustomerTable /> : <CustomerStats />}</div>
      </div>
    </div>
  );
};

export default CustomerList;
