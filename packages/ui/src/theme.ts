/**
 * Design tokens compartidos entre `apps/web` (tailwind.config.ts) y
 * `apps/mobile` (tailwind.config.js + NativeWind). Un solo lugar para
 * ajustar la paleta institucional "basadrina" (sección 2.4 del doc. base).
 *
 * NOTA: violeta + coral inspirados en apps de delivery tipo PedidosYa
 * (layout de categorías/tarjetas), pero con paleta propia para no
 * confundirse con ninguna marca existente. Reemplázalos por los colores
 * oficiales de la UNJBG cuando el equipo de diseño los confirme.
 */
export const colors = {
  primary: {
    50: '#f5f2ff',
    100: '#ebe3ff',
    200: '#d3c2ff',
    300: '#b494ff',
    400: '#9563ff',
    500: '#7c3aed',
    600: '#6624d1',
    700: '#521cad',
    800: '#3f1687',
    900: '#2c0f61',
  },
  accent: {
    50: '#fff4ed',
    100: '#ffe4d1',
    200: '#ffc7a3',
    300: '#ffa16a',
    400: '#ff7a33',
    500: '#f9600d',
    600: '#d44a04',
    700: '#a83a03',
  },
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;
