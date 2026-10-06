import type { ReactNode } from "react";

interface AuthLayoutProps {
  /** Etiqueta pequeña sobre el título (ej. «Iniciar sesión»). */
  insignia: string;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  /** Texto o enlaces bajo la tarjeta. */
  pie?: ReactNode;
}

/**
 * Pantallas de acceso (mismo diseño que Magnet): ilustración a la izquierda
 * con la marca encima y, a la derecha, el formulario en una tarjeta sobre un
 * fondo con textura de puntos. En móvil la ilustración queda como franja superior.
 */
export function AuthLayout({ insignia, titulo, descripcion, children, pie }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-muted/50 motion-safe:animate-in motion-safe:fade-in [animation-duration:300ms] lg:grid-cols-[58fr_42fr]">
      <div className="relative h-[220px] overflow-hidden bg-[#4b2f7a] sm:h-[300px] lg:sticky lg:top-0 lg:h-screen">
        <img
          src="/login-medico.jpg"
          alt=""
          aria-hidden="true"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
        />
        <div className="absolute left-6 top-6 flex items-center gap-3 rounded-2xl bg-background/85 px-3.5 py-2.5 shadow-sm backdrop-blur">
          <div aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            K
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground">Ker Hub</p>
            <p className="text-[11px] text-muted-foreground">Gestión clínica integral</p>
          </div>
        </div>
        <p className="absolute bottom-6 left-6 hidden rounded-full bg-background/85 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur lg:block">
          Tu consulta, en un solo lugar
        </p>
      </div>

      <div className="textura-puntos relative flex flex-col justify-center px-6 py-10 sm:px-12 lg:min-h-screen lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 [animation-duration:500ms]">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-[0_24px_60px_-28px_hsl(var(--foreground)/0.35),0_2px_6px_-2px_hsl(var(--foreground)/0.06)] sm:p-9">
            <div className="mb-7">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
                {insignia}
              </span>
              <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight">{titulo}</h1>
              {descripcion && <p className="mt-1.5 text-sm text-muted-foreground">{descripcion}</p>}
            </div>
            {children}
          </div>
          {pie && <div className="mt-6 text-center text-sm text-muted-foreground">{pie}</div>}
        </div>
      </div>
    </div>
  );
}
