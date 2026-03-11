import { useState } from "react";
import CotizacionList from "./CotizacionList";
import CotizacionForm from "./CotizacionForm";
import CotizacionDetail from "./CotizacionDetail";

export type CotizacionView =
  | { mode: "list" }
  | { mode: "form"; editId?: string }
  | { mode: "detail"; cotizacionId: string };

const CotizacionesPage = () => {
  const [view, setView] = useState<CotizacionView>({ mode: "list" });

  if (view.mode === "detail") {
    return (
      <CotizacionDetail
        cotizacionId={view.cotizacionId}
        onBack={() => setView({ mode: "list" })}
        onEdit={(id) => setView({ mode: "form", editId: id })}
      />
    );
  }

  if (view.mode === "form") {
    return (
      <CotizacionForm
        editId={view.editId}
        onCancel={() => setView({ mode: "list" })}
        onSaved={() => setView({ mode: "list" })}
      />
    );
  }

  return (
    <CotizacionList
      onNewClick={() => setView({ mode: "form" })}
      onView={(id) => setView({ mode: "detail", cotizacionId: id })}
      onEdit={(id) => setView({ mode: "form", editId: id })}
    />
  );
};

export default CotizacionesPage;
