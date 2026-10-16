import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, ImageIcon, Pencil, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import { ContentDialog, type ContentTarget } from "@/components/content/ContentDialog";
import {
  AUDIENCE_LABEL, CONTENT_BUCKET, CONTENT_TYPE_LABEL, deleteContent, fetchAll, updateContent, type ContentItem,
} from "@/components/content/content-api";
import {
  AUDIENCE_OPTIONS, contentKeys, errorMessage, formatDateTime, inputFromItem, isDated, TYPE_OPTIONS,
} from "@/components/content/content-form";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { RowActions } from "@/components/kit/RowActions";
import {
  DataTable, StatusCell, TableToolbar, useDataTable, type TableColumn, type TableFilter,
} from "@/components/kit/table";
import { useAuth } from "@/contexts/AuthContext";
import { fileUrl } from "@/integrations/api/client";

const statusText = (r: ContentItem) => `${r.publicado ? "Publicado" : "Borrador"}${r.destacado ? " · Destacado" : ""}`;
const asOptions = (opts: { label: string }[]) => opts.map(({ label }) => ({ value: label, label }));

function PostCell({ row }: { row: ContentItem }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      {row.imagenRuta ? (
        <img src={fileUrl(CONTENT_BUCKET, row.imagenRuta)} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg bg-muted object-cover" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/60">
          <ImageIcon className="h-4 w-4" aria-hidden />
        </div>
      )}
      <div className="min-w-0 max-w-[22rem]">
        <p className="truncate font-medium text-foreground">{row.titulo}</p>
        {row.resumen && <p className="truncate text-xs font-normal text-muted-foreground">{row.resumen}</p>}
      </div>
    </div>
  );
}

const COLUMNS: TableColumn<ContentItem>[] = [
  { id: "post", title: "Publicación", value: (r) => r.titulo, cell: (r) => <PostCell row={r} />, primary: true, alwaysVisible: true, className: "min-w-[280px]" },
  { id: "type", title: "Tipo", value: (r) => CONTENT_TYPE_LABEL[r.tipo] },
  { id: "audience", title: "Audiencia", value: (r) => AUDIENCE_LABEL[r.audiencia] },
  {
    id: "date", title: "Fecha", value: (r) => (isDated(r.tipo) ? r.fechaInicio : null),
    cell: (r) => (isDated(r.tipo) && r.fechaInicio ? formatDateTime(r.fechaInicio) : "—"), className: "tabular-nums",
  },
  {
    id: "status", title: "Estado", value: statusText, flush: true,
    cell: (r) => <StatusCell tone={r.publicado ? "success" : "neutral"} text={statusText(r)} />,
  },
];

const FILTERS: TableFilter<ContentItem>[] = [
  { id: "type", title: "Tipo", value: (r) => CONTENT_TYPE_LABEL[r.tipo], options: asOptions(TYPE_OPTIONS) },
  {
    id: "status", title: "Estado", value: (r) => (r.publicado ? "Publicado" : "Borrador"),
    options: asOptions([{ label: "Publicado" }, { label: "Borrador" }]),
  },
  { id: "audience", title: "Audiencia", value: (r) => AUDIENCE_LABEL[r.audiencia], options: asOptions(AUDIENCE_OPTIONS) },
];

const rowKey = (r: ContentItem) => r.id;
const newestFirst = (a: ContentItem, b: ContentItem) => b.creadoEn.localeCompare(a.creadoEn);

const EMPTY = (
  <div className="grid gap-1">
    <p className="font-medium text-foreground">Aún no hay publicaciones</p>
    <p>Lo que publiques aquí aparece en el Inicio de las apps de profesionales y pacientes.</p>
  </div>
);

const ContentPage = () => {
  const { hasRole, company } = useAuth();
  const isAdmin = hasRole("admin");
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<ContentTarget>(null);
  const { data, isLoading, error } = useQuery({ queryKey: contentKeys.list, queryFn: fetchAll, enabled: isAdmin });
  const rows = useMemo(() => [...(data ?? [])].sort(newestFirst), [data]);
  const t = useDataTable({ id: "contenido.app", rows, columns: COLUMNS, rowKey, filters: FILTERS });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: contentKeys.list });
  const toggle = useMutation({
    mutationFn: ({ item, patch }: { item: ContentItem; patch: Partial<Pick<ContentItem, "publicado" | "destacado">>; done: string }) =>
      updateContent(item.id, { ...inputFromItem(item), ...patch }),
    onSuccess: (_, { done }) => { refresh(); toast.success(done); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = async (item: ContentItem) => {
    try {
      // El servidor borra también la imagen de la publicación.
      await deleteContent(item.id);
      refresh();
      toast.success("Publicación eliminada");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (!isAdmin || !company) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 py-6">
        <ModuleHeader title="Contenido de la app" />
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-sm">
          <p className="font-medium text-foreground">{company ? "Solo para administradores" : "Sin empresa activa"}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {company
              ? "Solo un administrador de la empresa puede publicar o cambiar lo que aparece en el Inicio de las apps."
              : "Elige una empresa para administrar el contenido de sus apps."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader title="Contenido de la app" primary={{ title: "Nueva publicación", onClick: () => setTarget("new") }} />
      <DataTable
        t={t}
        loading={isLoading}
        onRowClick={(r: ContentItem) => setTarget(r)}
        toolbar={<TableToolbar t={t} name={["publicación", "publicaciones"]} placeholder="Buscar por título" fileName="contenido-app" />}
        actions={(r) => (
          <RowActions
            name={r.titulo}
            menu={[
              { title: "Editar", icon: Pencil, onClick: () => setTarget(r) },
              r.publicado
                ? { title: "Pasar a borrador", icon: EyeOff, onClick: () => toggle.mutate({ item: r, patch: { publicado: false }, done: "Quedó como borrador" }) }
                : { title: "Publicar", icon: Eye, onClick: () => toggle.mutate({ item: r, patch: { publicado: true }, done: "Publicación visible en las apps" }) },
              r.destacado
                ? { title: "Quitar de destacados", icon: StarOff, onClick: () => toggle.mutate({ item: r, patch: { destacado: false }, done: "Ya no está en destacados" }) }
                : { title: "Destacar", icon: Star, onClick: () => toggle.mutate({ item: r, patch: { destacado: true }, done: "Publicación destacada" }) },
            ]}
            onDelete={() => remove(r)}
            deleteConfirmation={{ title: "¿Eliminar esta publicación?", description: "Se borra la publicación y su imagen. No se puede deshacer." }}
          />
        )}
        empty={error ? `No se pudo cargar el contenido: ${errorMessage(error)}` : EMPTY}
      />
      <ContentDialog target={target} empresaId={company.id} onClose={() => setTarget(null)} />
    </div>
  );
};

export default ContentPage;
