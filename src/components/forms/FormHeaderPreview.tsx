import { cn } from "@/lib/utils";

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface HeaderConfig {
  nombre_institucion: string;
  logo_url: string | null;
  nit: string;
  direccion: string;
  telefono: string;
  email_institucion: string;
  resolucion_habilitacion: string;
  campos_personalizados: CustomField[];
}

interface FormHeaderPreviewProps {
  config: HeaderConfig | null;
  formTitle?: string;
  formCode?: string;
  className?: string;
}

export const FormHeaderPreview = ({ config, formTitle, formCode, className }: FormHeaderPreviewProps) => {
  if (!config || !config.nombre_institucion) return null;

  return (
    <div className={cn("border-b border-border pb-4 mb-6 print:pb-2 print:mb-4", className)}>
      <div className="flex items-start gap-4">
        {/* Logo */}
        {config.logo_url && (
          <img
            src={config.logo_url}
            alt={config.nombre_institucion}
            className="h-14 w-auto object-contain shrink-0 print:h-12"
          />
        )}

        {/* Center: Institution info */}
        <div className="flex-1 text-center">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wide print:text-sm">
            {config.nombre_institucion}
          </h2>
          <div className="text-[11px] text-muted-foreground space-y-0.5 mt-1">
            {config.nit && <p>NIT: {config.nit}</p>}
            {config.direccion && <p>{config.direccion}</p>}
            <div className="flex items-center justify-center gap-3">
              {config.telefono && <span>Tel: {config.telefono}</span>}
              {config.email_institucion && <span>{config.email_institucion}</span>}
            </div>
            {config.resolucion_habilitacion && (
              <p className="font-medium">{config.resolucion_habilitacion}</p>
            )}
            {config.campos_personalizados?.map((field) => (
              field.label && field.value ? (
                <p key={field.id}>
                  {field.label}: {field.value}
                </p>
              ) : null
            ))}
          </div>
        </div>

        {/* Right: Form code */}
        {(formTitle || formCode) && (
          <div className="text-right shrink-0">
            {formTitle && (
              <p className="text-xs font-semibold text-foreground">{formTitle}</p>
            )}
            {formCode && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Código: {formCode}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
