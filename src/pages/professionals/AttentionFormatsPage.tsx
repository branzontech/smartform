import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, CircleOff, Loader2, MoreHorizontal, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PRO_TYPE_LABEL } from "@/components/agenda/agenda-api";
import {
  fetchAvailableForms, fetchFormatConfig, formatKeys, formTypeLabel, MAX_FORMATS_PER_TYPE, saveFormatConfig,
  type FormatConfigRow,
} from "@/components/agenda/formats-api";
import { SelectField } from "@/components/contracts/fields";
import { useConfirm } from "@/components/kit/useConfirm";
import { PRO_TYPE_OPTIONS, errorMessage } from "@/components/professionals/professional-form";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";

const LIST_PATH = "/app/profesionales";
const DEFAULT_TYPE = PRO_TYPE_OPTIONS[0]?.value ?? "medico";

/** Un formato en la lista que se edita (lo que se manda al guardar más lo que se muestra). */
interface FormatItem {
  formularioId: string;
  titulo: string;
  tipo: string;
  principal: boolean;
  obligatorio: boolean;
}

const toItems = (rows: FormatConfigRow[], tipoProfesional: string): FormatItem[] =>
  rows
    .filter((r) => r.tipoProfesional === tipoProfesional)
    .sort((a, b) => a.orden - b.orden)
    .map(({ formularioId, titulo, tipo, principal, obligatorio }) => ({ formularioId, titulo, tipo, principal, obligatorio }));

/** Lo que cuenta para saber si hay cambios: orden, principal y obligatorio. */
const signature = (items: FormatItem[]) => JSON.stringify(items.map((i) => [i.formularioId, i.principal, i.obligatorio]));

/** Mueve un elemento una posición sin tocar la lista original. */
const move = (items: FormatItem[], index: number, delta: -1 | 1): FormatItem[] => {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

/**
 * Formatos de la atención: qué formularios usa cada tipo de profesional, cuál
 * abre la cita (el principal) y cuáles son obligatorios para cerrarla. Solo el
 * administrador lo cambia; los demás lo ven en solo lectura.
 */
const AttentionFormatsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canEdit = hasRole("admin");
  const [confirm, confirmDialog] = useConfirm();
  const [proType, setProType] = useState(DEFAULT_TYPE);
  /** Cambios sin guardar del tipo elegido; null = se muestra lo del servidor. */
  const [draft, setDraft] = useState<FormatItem[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: config = [], isLoading, error } = useQuery({ queryKey: formatKeys.config, queryFn: fetchFormatConfig });
  const available = useQuery({ queryKey: formatKeys.available, queryFn: fetchAvailableForms, enabled: pickerOpen });

  const serverItems = useMemo(() => toItems(config, proType), [config, proType]);
  const items = draft ?? serverItems;
  const dirty = draft !== null && signature(draft) !== signature(serverItems);
  const principalId = items.find((i) => i.principal)?.formularioId ?? "";
  const chosen = new Set(items.map((i) => i.formularioId));
  const candidates = (available.data ?? []).filter((f) => !chosen.has(f.id));
  const isFull = items.length >= MAX_FORMATS_PER_TYPE;
  const typeName = PRO_TYPE_LABEL[proType] ?? proType;

  const edit = (update: (current: FormatItem[]) => FormatItem[]) => setDraft(update(items));

  const changeType = async (next: string) => {
    if (next === proType) return;
    if (dirty) {
      const ok = await confirm({
        title: "¿Descartar los cambios?",
        description: `Los cambios en los formatos de ${typeName} aún no se han guardado.`,
        confirmLabel: "Descartar",
        destructive: true,
      });
      if (!ok) return;
    }
    setDraft(null);
    setProType(next);
  };

  // El principal siempre es obligatorio; solo puede haber uno.
  const setPrincipal = (formularioId: string) =>
    edit((list) => list.map((i) => ({ ...i, principal: i.formularioId === formularioId, obligatorio: i.formularioId === formularioId ? true : i.obligatorio })));
  const clearPrincipal = () => edit((list) => list.map((i) => ({ ...i, principal: false })));
  const setRequired = (formularioId: string, obligatorio: boolean) =>
    edit((list) => list.map((i) => (i.formularioId === formularioId && !i.principal ? { ...i, obligatorio } : i)));

  const remove = async (item: FormatItem) => {
    const ok = await confirm({
      title: "¿Quitar este formato?",
      description: `«${item.titulo}» dejará de usarse en las citas nuevas de ${typeName}. El formato no se elimina.`,
      confirmLabel: "Quitar",
      destructive: true,
    });
    if (ok) edit((list) => list.filter((i) => i.formularioId !== item.formularioId));
  };

  const add = (form: { id: string; titulo: string; tipo: string }) => {
    if (isFull || chosen.has(form.id)) return;
    edit((list) => [...list, { formularioId: form.id, titulo: form.titulo, tipo: form.tipo, principal: false, obligatorio: false }]);
    setPickerOpen(false);
  };

  const mutation = useMutation({
    mutationFn: (list: FormatItem[]) =>
      saveFormatConfig(proType, list.map(({ formularioId, principal, obligatorio }) => ({ formularioId, principal, obligatorio }))),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: formatKeys.config });
      setDraft(null);
      toast.success(`Formatos de ${typeName} guardados`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="mx-auto grid max-w-4xl gap-5 py-6">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Volver a profesionales"
          onClick={() => navigate(LIST_PATH)}
          className="h-9 w-9 shrink-0 rounded-full text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">Formatos de la atención</h1>
          <p className="text-[13px] text-muted-foreground">Lo que se configura aquí se aplica a las citas nuevas.</p>
        </div>
      </div>

      <SelectField
        id="formats-pro-type"
        label="Tipo de profesional"
        className="max-w-xs"
        value={proType}
        onChange={(v) => void changeType(v)}
        options={PRO_TYPE_OPTIONS}
      />

      <section aria-labelledby="formats-title" className="rounded-card bg-card p-5 shadow-card dark:border dark:border-border dark:shadow-none md:p-6">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="formats-title" className="text-lg font-semibold">Formatos de {typeName}</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {canEdit
                ? "El que abre la cita se diligencia primero; los obligatorios deben estar completos para terminar la atención."
                : "Solo un administrador puede modificar esta configuración."}
            </p>
          </div>
          {canEdit && (
            <Button
              variant="ghost"
              className="h-9 gap-1.5 rounded-lg px-3 text-[13px] font-normal text-muted-foreground hover:bg-muted hover:text-foreground"
              disabled={isFull || isLoading}
              title={isFull ? `Máximo ${MAX_FORMATS_PER_TYPE} formatos por tipo de profesional` : undefined}
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Agregar formato
            </Button>
          )}
        </header>

        {isLoading ? (
          <div className="grid gap-2" aria-busy="true">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-tile" />)}
          </div>
        ) : error ? (
          <p className="py-10 text-center text-sm text-destructive">No se pudo cargar la configuración: {errorMessage(error)}</p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {typeName} aún no tiene formatos configurados: sus citas abren la «Historia clínica general».
          </p>
        ) : (
          <RadioGroup value={principalId} onValueChange={setPrincipal} disabled={!canEdit} className="gap-0 divide-y divide-border/60" aria-label="Formato que abre la cita">
            {items.map((item, index) => {
              const radioId = `principal-${item.formularioId}`;
              const switchId = `required-${item.formularioId}`;
              return (
                <div key={item.formularioId} className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-tile px-2 py-3 transition-colors hover:bg-muted/40">
                  <span className="w-5 text-center text-[13px] tabular-nums text-muted-foreground">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground">{formTypeLabel(item.tipo)}</p>
                  </div>
                  <label htmlFor={radioId} className="flex cursor-pointer items-center gap-2 text-[13px]">
                    <RadioGroupItem id={radioId} value={item.formularioId} />
                    Abre la cita
                  </label>
                  <label htmlFor={switchId} className="flex cursor-pointer items-center gap-2 text-[13px]">
                    <Switch
                      id={switchId}
                      checked={item.principal || item.obligatorio}
                      disabled={!canEdit || item.principal}
                      onCheckedChange={(v) => setRequired(item.formularioId, v)}
                    />
                    Obligatorio
                  </label>
                  {canEdit ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={`Más acciones para ${item.titulo}`}
                          title="Más acciones"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-xl">
                        <DropdownMenuItem disabled={index === 0} onSelect={() => edit((list) => move(list, index, -1))} className="gap-2 text-[13px]">
                          <ArrowUp className="h-4 w-4 text-muted-foreground" /> Subir
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={index === items.length - 1} onSelect={() => edit((list) => move(list, index, 1))} className="gap-2 text-[13px]">
                          <ArrowDown className="h-4 w-4 text-muted-foreground" /> Bajar
                        </DropdownMenuItem>
                        {item.principal && (
                          <DropdownMenuItem onSelect={clearPrincipal} className="gap-2 text-[13px]">
                            <CircleOff className="h-4 w-4 text-muted-foreground" /> No abre la cita
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => void remove(item)} className="gap-2 text-[13px] text-destructive focus:text-destructive">
                          <X className="h-4 w-4" /> Quitar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="w-8" aria-hidden />
                  )}
                </div>
              );
            })}
          </RadioGroup>
        )}

        {canEdit && (
          <div className="mt-4 flex items-center justify-end gap-2">
            {dirty && (
              <Button variant="ghost" size="sm" className="h-8 text-[13px] text-muted-foreground" disabled={mutation.isPending} onClick={() => setDraft(null)}>
                Descartar cambios
              </Button>
            )}
            <Button size="sm" className="h-8 text-[13px]" disabled={!dirty || mutation.isPending} onClick={() => mutation.mutate(items)}>
              {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}
              Guardar
            </Button>
          </div>
        )}
      </section>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md gap-3">
          <DialogHeader>
            <DialogTitle>Agregar formato</DialogTitle>
          </DialogHeader>
          <Command className="rounded-lg border">
            <CommandInput placeholder="Buscar por nombre" />
            <CommandList>
              {available.isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Cargando formatos…</p>
              ) : available.error ? (
                <p className="py-6 text-center text-sm text-destructive">No se pudieron cargar los formatos: {errorMessage(available.error)}</p>
              ) : (
                <>
                  <CommandEmpty>No hay formatos para agregar.</CommandEmpty>
                  {candidates.map((f) => (
                    <CommandItem key={f.id} value={`${f.titulo} ${f.id}`} onSelect={() => add(f)} className="flex-col items-start gap-0 px-3 py-2">
                      <span className="text-sm font-medium">{f.titulo}</span>
                      <span className="text-xs text-muted-foreground">{formTypeLabel(f.tipo)}</span>
                    </CommandItem>
                  ))}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  );
};

export default AttentionFormatsPage;
