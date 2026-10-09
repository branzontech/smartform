import { cn } from "@/lib/utils";

/**
 * Íconos 3D de Ker Hub (public/iconos/*.webp). Son SOLO para los módulos
 * principales: tarjetas de Inicio y lanzador de aplicaciones. Botones, menús
 * internos y acciones siguen con los íconos de Lucide.
 * Origen y nombres: docs/iconos-3d/prompt-flow.md.
 */
export type ModuleIconName =
  // Pack 1: módulos actuales
  | "inicio" | "atencion" | "pacientes" | "citas" | "turnos"
  | "admisiones" | "formularios" | "informes" | "telemedicina" | "chat"
  | "notificaciones" | "flujos" | "medicos" | "especialidades" | "inventario"
  | "catalogo" | "sedes" | "zonas" | "facturacion" | "clientes"
  | "cotizaciones" | "planes" | "portal-usuario" | "perfil" | "configuracion"
  // Pack 2: módulos futuros
  | "laboratorio" | "imagenologia" | "farmacia" | "hospitalizacion" | "urgencias"
  | "cirugia" | "enfermeria" | "vacunacion" | "odontologia" | "salud-mental"
  | "nutricion" | "rehabilitacion" | "atencion-domiciliaria" | "traslados" | "historia-clinica"
  | "facturacion-electronica" | "cartera" | "talento-humano" | "compras" | "documentos"
  | "calidad" | "seguridad" | "encuestas" | "asistente-ia" | "integraciones";

interface ModuleIconProps {
  name: ModuleIconName;
  className?: string;
}

/** Decorativo: el nombre del módulo ya va en el texto de al lado. */
export function ModuleIcon({ name, className }: ModuleIconProps) {
  return (
    <img
      src={`/iconos/${name}.webp`}
      alt=""
      aria-hidden="true"
      decoding="async"
      loading="lazy"
      draggable={false}
      className={cn("h-12 w-12 shrink-0 select-none object-contain", className)}
    />
  );
}

/** Rutas de módulos principales con ícono 3D. Las demás (acciones, subsecciones) no tienen. */
const ICON_BY_ROUTE: Record<string, ModuleIconName> = {
  "/app/home": "inicio",
  "/app/pacientes": "pacientes",
  "/app/citas": "citas",
  "/app/turnos": "turnos",
  "/app/chat": "chat",
  "/app/telemedicina": "telemedicina",
  "/app/notificaciones/centro": "notificaciones",
  "/app/crear": "historia-clinica",
  "/app/admisiones": "admisiones",
  "/app/portal-usuario": "portal-usuario",
  "/app/medicos": "medicos",
  "/app/inventario": "inventario",
  "/app/locations/sites": "sedes",
  "/app/facturacion": "facturacion",
  "/app/informes": "informes",
  "/app/configuracion": "configuracion",
  "/app/cotizaciones": "cotizaciones",
  "/app/zonas": "zonas",
  "/app/clientes": "clientes",
  "/app/workflows": "flujos",
  "/app/precios": "planes",
  "/app/perfil": "perfil",
};

export function iconForRoute(path: string): ModuleIconName | undefined {
  return ICON_BY_ROUTE[path];
}
