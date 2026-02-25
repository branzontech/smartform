import { cn } from "@/lib/utils";

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface HeaderConfig {
  nombre_principal: string;
  logo_url: string | null;
  telefono: string;
  email_institucion: string;
  direccion: string;
  tipo_entidad?: string;
  pais?: string;
  identificacion_fiscal?: Record<string, string>;
  datos_regulatorios?: Record<string, string>;
  campos_personalizados: CustomField[];
  // Legacy compat
  nombre_institucion?: string;
  nit?: string;
  resolucion_habilitacion?: string;
}

interface FormHeaderPreviewProps {
  config: HeaderConfig | null;
  formTitle?: string;
  formCode?: string;
  className?: string;
}

/** Collect non-empty key-value pairs from a JSONB record and render as labeled lines */
function renderJsonbEntries(data: Record<string, string> | undefined) {
  if (!data) return null;
  return Object.entries(data)
    .filter(([, v]) => v && v.trim() !== "")
    .map(([key, value]) => {
      // Convert key to human-readable label
      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return (
        <p key={key}>
          {label}: {value}
        </p>
      );
    });
}

export const FormHeaderPreview = ({
  config,
  formTitle,
  formCode,
  className,
}: FormHeaderPreviewProps) => {
  if (!config) return null;

  // Support both old (nombre_institucion) and new (nombre_principal) field names
  const name = config.nombre_principal || (config as any).nombre_institucion;
  if (!name) return null;

  return (
    <div
      className={cn(
        "border-b border-border pb-4 mb-6 print:pb-2 print:mb-4",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        {config.logo_url && (
          <img
            src={config.logo_url}
            alt={name}
            className="h-14 w-auto object-contain shrink-0 print:h-12"
          />
        )}

        {/* Center: Institution info */}
        <div className="flex-1 text-center">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wide print:text-sm">
            {name}
          </h2>
          <div className="text-[11px] text-muted-foreground space-y-0.5 mt-1">
            {/* Fiscal identification entries */}
            {renderJsonbEntries(config.identificacion_fiscal)}

            {/* Legacy NIT support */}
            {!config.identificacion_fiscal && config.nit && (
              <p>NIT: {config.nit}</p>
            )}

            {config.direccion && <p>{config.direccion}</p>}
            <div className="flex items-center justify-center gap-3">
              {config.telefono && <span>Tel: {config.telefono}</span>}
              {config.email_institucion && (
                <span>{config.email_institucion}</span>
              )}
            </div>

            {/* Regulatory data entries */}
            {renderJsonbEntries(config.datos_regulatorios)}

            {/* Legacy resolution support */}
            {!config.datos_regulatorios &&
              config.resolucion_habilitacion && (
                <p className="font-medium">
                  {config.resolucion_habilitacion}
                </p>
              )}

            {config.campos_personalizados?.map((field) =>
              field.label && field.value ? (
                <p key={field.id}>
                  {field.label}: {field.value}
                </p>
              ) : null
            )}
          </div>
        </div>

        {/* Right: Form code */}
        {(formTitle || formCode) && (
          <div className="text-right shrink-0">
            {formTitle && (
              <p className="text-xs font-semibold text-foreground">
                {formTitle}
              </p>
            )}
            {formCode && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Código: {formCode}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
