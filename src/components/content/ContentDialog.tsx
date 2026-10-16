import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createContent, updateContent, type ContentInput, type ContentItem } from "./content-api";
import { ContentFields } from "./ContentFields";
import {
  contentKeys, emptyContentForm, errorMessage, formFromItem, removeImages, toContentInput, type ContentForm,
} from "./content-form";

/** Publicación que se edita, «new» para crear una, o null con el diálogo cerrado. */
export type ContentTarget = ContentItem | "new" | null;

interface ContentDialogProps {
  target: ContentTarget;
  empresaId: string;
  onClose: () => void;
}

export function ContentDialog({ target, empresaId, onClose }: ContentDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-xl">
        {/* El formulario se monta con cada publicación para empezar siempre limpio. */}
        {target && (
          <ContentFormView
            key={target === "new" ? "new" : target.id}
            item={target === "new" ? null : target}
            empresaId={empresaId}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContentFormView({ item, empresaId, onClose }: { item: ContentItem | null; empresaId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ContentForm>(() => (item ? formFromItem(item) : emptyContentForm()));
  // Imágenes subidas en este formulario: las que no queden guardadas se borran al cerrar.
  const uploads = useRef<string[]>([]);
  const saved = useRef(false);

  useEffect(() => () => {
    if (!saved.current) removeImages(uploads.current);
  }, []);

  const mutation = useMutation({
    mutationFn: (input: ContentInput) => (item ? updateContent(item.id, input) : createContent(input)),
    onSuccess: (_, input) => {
      saved.current = true;
      // La imagen anterior la borra el servidor; aquí solo las subidas que no quedaron guardadas.
      removeImages(uploads.current.filter((p) => p !== input.imagenRuta));
      void queryClient.invalidateQueries({ queryKey: contentKeys.list });
      toast.success(item ? "Publicación actualizada" : input.publicado ? "Publicación creada" : "Borrador guardado");
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const submit = () => {
    const result = toContentInput(form);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    mutation.mutate(result.input);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{item ? "Editar publicación" : "Nueva publicación"}</DialogTitle>
        <DialogDescription>Se muestra en el Inicio de las apps de profesionales y pacientes.</DialogDescription>
      </DialogHeader>
      <ContentFields
        form={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        empresaId={empresaId}
        onUploaded={(path) => { uploads.current = [...uploads.current, path]; }}
      />
      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
        <Button onClick={submit} disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}
          {item ? "Guardar cambios" : "Guardar"}
        </Button>
      </DialogFooter>
    </>
  );
}
