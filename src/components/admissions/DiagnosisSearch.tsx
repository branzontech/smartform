import React, { useState, useEffect, useRef } from "react";
import { Search, X, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface DiagnosticoCatalogo {
  id: string;
  sistema: string;
  codigo: string;
  descripcion: string;
  capitulo: string | null;
  fhir_system_uri: string;
}

interface SelectedDiagnosis {
  codigo: string;
  descripcion: string;
  sistema: string;
  fhir_system_uri: string;
}

interface DiagnosisSearchProps {
  value: string;
  onChange: (value: string, fhirCoding?: SelectedDiagnosis) => void;
}

export const DiagnosisSearch: React.FC<DiagnosisSearchProps> = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<DiagnosticoCatalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [sistema, setSistema] = useState<"CIE-10" | "CIE-11">("CIE-10");
  const [selected, setSelected] = useState<SelectedDiagnosis | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value && !selected) {
      const match = value.match(/^(.+?)\s*-\s*(.+)$/);
      if (match) {
        setSelected({ codigo: match[1], descripcion: match[2], sistema: "", fhir_system_uri: "" });
      }
    }
  }, []);

  // Search
  useEffect(() => {
    if (searchTerm.length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("catalogo_diagnosticos")
        .select("*")
        .eq("sistema", sistema)
        .eq("activo", true)
        .or(`codigo.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`)
        .limit(10);
      setResults((data as DiagnosticoCatalogo[]) || []);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, sistema]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (diag: DiagnosticoCatalogo) => {
    const sel: SelectedDiagnosis = {
      codigo: diag.codigo,
      descripcion: diag.descripcion,
      sistema: diag.sistema,
      fhir_system_uri: diag.fhir_system_uri,
    };
    setSelected(sel);
    onChange(`${diag.codigo} - ${diag.descripcion}`, sel);
    setOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    setSelected(null);
    onChange("", undefined);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <Label className="flex items-center gap-2">
        <Stethoscope className="w-4 h-4 text-primary" />
        Diagnóstico principal (FHIR Condition)
      </Label>

      {selected ? (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5">
          <Badge variant="secondary" className="text-xs font-mono">
            {selected.sistema || "CIE"}
          </Badge>
          <span className="font-mono text-sm font-semibold text-primary">{selected.codigo}</span>
          <span className="text-sm text-muted-foreground">—</span>
          <span className="text-sm flex-1 truncate">{selected.descripcion}</span>
          <button onClick={handleClear} className="p-1 rounded-lg hover:bg-destructive/10 transition-colors">
            <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <Tabs value={sistema} onValueChange={(v) => setSistema(v as "CIE-10" | "CIE-11")}>
            <TabsList className="h-8 p-0.5">
              <TabsTrigger value="CIE-10" className="text-xs h-7 px-3">CIE-10</TabsTrigger>
              <TabsTrigger value="CIE-11" className="text-xs h-7 px-3">CIE-11</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar por código o nombre en ${sistema}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setOpen(true);
              }}
              onFocus={() => searchTerm.length > 0 && setOpen(true)}
              className="h-11 rounded-xl pl-10"
            />
          </div>

          {open && (searchTerm.length > 0) && (
            <div className="absolute z-50 w-full max-w-md border border-border rounded-xl bg-popover shadow-lg overflow-hidden mt-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
              ) : results.length > 0 ? (
                <ul className="max-h-60 overflow-y-auto divide-y divide-border">
                  {results.map((diag) => (
                    <li
                      key={diag.id}
                      onClick={() => handleSelect(diag)}
                      className="px-4 py-3 hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-primary">{diag.codigo}</span>
                        <span className="text-sm">{diag.descripcion}</span>
                      </div>
                      {diag.capitulo && (
                        <p className="text-xs text-muted-foreground mt-0.5">{diag.capitulo}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No se encontraron diagnósticos para "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosisSearch;
