import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fileUrl } from "@/integrations/api/client";
import { db } from "@/integrations/data/client";
import { cn } from "@/lib/utils";
import { CONTENT_BUCKET, contentImagePath } from "./content-api";
import { checkImage, IMAGE_ACCEPT, MAX_IMAGE_MB } from "./content-form";

interface ContentImageFieldProps {
  id: string;
  /** Empresa activa: cada empresa guarda sus imágenes en su propia carpeta. */
  empresaId: string;
  value: string | null;
  onChange: (path: string | null) => void;
  /** Avisa de cada archivo subido, para limpiar los que no se lleguen a guardar. */
  onUploaded: (path: string) => void;
}

/** Imagen de la publicación: zona para subirla, vista previa, «Cambiar imagen» y «Quitar imagen». */
export function ContentImageField({ id, empresaId, value, onChange, onUploaded }: ContentImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const upload = async (file: File) => {
    const check = checkImage(file);
    if ("error" in check) {
      toast.error(check.error);
      return;
    }
    setUploading(true);
    try {
      const path = contentImagePath(empresaId, `${crypto.randomUUID()}.${check.ext}`);
      const { error } = await db.storage.from(CONTENT_BUCKET).upload(path, file, { upsert: false });
      if (error) {
        toast.error(`No se pudo subir la imagen: ${error.message}`);
        return;
      }
      onUploaded(path);
      onChange(path);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-1.5">
      <span id={`${id}-label`} className="text-[13px] font-medium">Imagen</span>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        aria-labelledby={`${id}-label`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
      {value ? (
        <div className="flex items-center gap-4">
          <img
            src={fileUrl(CONTENT_BUCKET, value)}
            alt="Vista previa de la imagen"
            className={cn("h-24 w-36 shrink-0 rounded-xl bg-muted object-cover transition-opacity duration-200", uploading && "opacity-50")}
          />
          <div className="flex flex-col items-start gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-[13px]" onClick={pick} disabled={uploading}>
              {uploading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}
              Cambiar imagen
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-[13px] text-muted-foreground" onClick={() => onChange(null)} disabled={uploading}>
              Quitar imagen
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/30 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-wait"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ImagePlus className="h-5 w-5" aria-hidden />}
          {uploading ? "Subiendo imagen…" : "Subir imagen"}
          <span className="text-xs text-muted-foreground/80">PNG, JPG, WebP o GIF de hasta {MAX_IMAGE_MB} MB</span>
        </button>
      )}
    </div>
  );
}
