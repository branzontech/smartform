import { BRAND } from '@kerhub/core/brand';

/** Estilo de Ker Hub en la app: lienzo gris, tarjetas blancas, acento de marca. */
export const colors = {
  canvas: BRAND.canvas,
  surface: BRAND.surface,
  ink: BRAND.ink,
  muted: BRAND.muted,
  line: BRAND.line,
  primary: BRAND.purple,
  primaryDark: BRAND.purpleDark,
  primarySoft: '#f1e9fc',
  lime: BRAND.lime,
  success: BRAND.success,
  warning: BRAND.warning,
  danger: BRAND.danger,
};

export const toneColor: Record<'info' | 'success' | 'warning' | 'error' | 'neutral', string> = {
  info: '#2563a8',
  success: colors.success,
  warning: colors.warning,
  error: colors.danger,
  neutral: colors.muted,
};

export const radius = { card: 18, control: 12 };
