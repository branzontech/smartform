import { useState } from "react";
import CotizacionList from "./CotizacionList";
import CotizacionForm from "./CotizacionForm";

const CotizacionesPage = () => {
  const [view, setView] = useState<"list" | "form">("list");

  return view === "list" ? (
    <CotizacionList onNewClick={() => setView("form")} />
  ) : (
    <CotizacionForm onCancel={() => setView("list")} onSaved={() => setView("list")} />
  );
};

export default CotizacionesPage;
