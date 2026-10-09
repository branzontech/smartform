import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Texto o enlaces bajo la tarjeta. */
  footer?: ReactNode;
}

/**
 * Pantallas de acceso (mismo diseño que Magnet): ilustración a la izquierda
 * con la marca encima y, a la derecha, el formulario en una tarjeta sobre un
 * fondo con textura de puntos. En móvil la ilustración queda como franja superior.
 */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
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
        {/* El logo es blanco y lima: va sobre una placa morada para leerse sobre la ilustración. */}
        <div className="absolute left-6 top-6 rounded-2xl bg-[#3b2364]/75 px-4 py-3 shadow-sm backdrop-blur">
          <img src="/kerhub-logo-color.png" alt="Ker Hub" className="h-8 w-auto sm:h-9" />
        </div>
        <p className="absolute bottom-6 left-6 hidden rounded-full bg-background/85 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur lg:block">
          Tu consulta, en un solo lugar
        </p>
      </div>

      <div className="textura-puntos relative flex flex-col justify-center px-6 py-10 sm:px-12 lg:min-h-screen lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 [animation-duration:500ms]">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-[0_24px_60px_-28px_hsl(var(--foreground)/0.35),0_2px_6px_-2px_hsl(var(--foreground)/0.06)] sm:p-9">
            <div className="mb-7">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
              {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            {children}
          </div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
