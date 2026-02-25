import React, { useState, useEffect, useRef } from "react";
import { Search, X, Stethoscope, Plus } from "lucide-react";
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

export interface SelectedDiagnosis {
  codigo: string;
  descripcion: string;
  sistema: string;
  fhir_system_uri: string;
}

interface DiagnosisSearchProps {
  diagnoses: SelectedDiagnosis[];
  onChange: (diagnoses: SelectedDiagnosis[]) => void;
  maxDiagnoses?: number;
}

const ROLE_LABELS = ["Principal", "Relacionado 1", "Relacionado 2", "Relacionado 3"];

export const DiagnosisSearch: React.FC<DiagnosisSearchProps> = ({
  diagnoses,
  onChange,
  maxDiagnoses = 4,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<DiagnosticoCatalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [sistema, setSistema] = useState<"CIE-10" | "CIE-11">("CIE-10");
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search
  useEffect(() => {
    if (searchTerm.length < 1) { setResults([]); return; }
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
        setAddingIndex(null);
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
    const next = [...diagnoses];
    if (addingIndex !== null && addingIndex < maxDiagnoses) {
      next[addingIndex] = sel;
    } else {
      next.push(sel);
    }
    onChange(next);
    setOpen(false);
    setSearchTerm("");
    setAddingIndex(null);
  };

  const handleRemove = (index: number) => {
    onChange(diagnoses.filter((_, i) => i !== index));
  };

  const startAdding = (index: number) => {
    setAddingIndex(index);
    setSearchTerm("");
    setOpen(false);
  };

  const canAdd = diagnoses.length < maxDiagnoses;
  const isSearching = addingIndex !== null;

  return (
    <div ref={containerRef} className="space-y-2">
      <Label className="flex items-center gap-2">
        <Stethoscope className="w-4 h-4 text-primary" />
        Diagnósticos (FHIR Condition)
        <span className="text-xs text-muted-foreground font-normal ml-1">
          {diagnoses.length}/{maxDiagnoses}
        </span>
      </Label>

      {/* Selected diagnoses - compact list */}
      {diagnoses.length > 0 && (
        <div className="space-y-1.5">
          {diagnoses.map((diag, i) => (
            <div
              key={`${diag.codigo}-${i}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm",
                i === 0
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-muted/30"
              )}
            >
              <Badge
                variant={i === 0 ? "default" : "secondary"}
                className="text-[10px] px-1.5 py-0 h-5 shrink-0"
              >
                {ROLE_LABELS[i]}
              </Badge>
              <span className="font-mono text-xs font-semibold text-primary shrink-0">
                {diag.codigo}
              </span>
              <span className="text-xs flex-1 truncate text-muted-foreground">
                {diag.descripcion}
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0">{diag.sistema}</span>
              <button
                onClick={() => handleRemove(i)}
                className="p-0.5 rounded hover:bg-destructive/10 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input - shown when adding or no diagnoses yet */}
      {(isSearching || diagnoses.length === 0) && (
        <div className="space-y-2">
          {diagnoses.length === 0 && (
            <Tabs value={sistema} onValueChange={(v) => setSistema(v as "CIE-10" | "CIE-11")}>
              <TabsList className="h-8 p-0.5">
                <TabsTrigger value="CIE-10" className="text-xs h-7 px-3">CIE-10</TabsTrigger>
                <TabsTrigger value="CIE-11" className="text-xs h-7 px-3">CIE-11</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="relative">
            {isSearching && diagnoses.length > 0 && (
              <Tabs value={sistema} onValueChange={(v) => setSistema(v as "CIE-10" | "CIE-11")} className="mb-2">
                <TabsList className="h-7 p-0.5">
                  <TabsTrigger value="CIE-10" className="text-[11px] h-6 px-2">CIE-10</TabsTrigger>
                  <TabsTrigger value="CIE-11" className="text-[11px] h-6 px-2">CIE-11</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${ROLE_LABELS[addingIndex ?? diagnoses.length] ?? "diagnóstico"} en ${sistema}...`}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setOpen(true); }}
                onFocus={() => searchTerm.length > 0 && setOpen(true)}
                className="h-10 rounded-xl pl-10 text-sm"
                autoFocus={isSearching}
              />
              {isSearching && (
                <button
                  onClick={() => { setAddingIndex(null); setSearchTerm(""); setOpen(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {open && searchTerm.length > 0 && (
              <div className="absolute z-50 w-full border border-border rounded-xl bg-popover shadow-lg overflow-hidden mt-1">
                {loading ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">Buscando...</div>
                ) : results.length > 0 ? (
                  <ul className="max-h-48 overflow-y-auto divide-y divide-border">
                    {results
                      .filter((r) => !diagnoses.some((d) => d.codigo === r.codigo && d.sistema === r.sistema))
                      .map((diag) => (
                        <li
                          key={diag.id}
                          onClick={() => handleSelect(diag)}
                          className="px-3 py-2.5 hover:bg-accent cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-primary">{diag.codigo}</span>
                            <span className="text-xs">{diag.descripcion}</span>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Sin resultados para "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add button - compact */}
      {canAdd && diagnoses.length > 0 && !isSearching && (
        <button
          onClick={() => startAdding(diagnoses.length)}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar {ROLE_LABELS[diagnoses.length]?.toLowerCase() ?? "diagnóstico"}
        </button>
      )}
    </div>
  );
};

export default DiagnosisSearch;
