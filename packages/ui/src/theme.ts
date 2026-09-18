/**
 * Design tokens compartidos entre `apps/web` (tailwind.config.ts) y
 * `apps/mobile` (tailwind.config.js + NativeWind). Un solo lugar para
 * ajustar la paleta institucional "basadrina" (sección 2.4 del doc. base).
 *
 * NOTA: estos valores de "primary" son un placeholder profesional
 * (azul institucional + acento dorado). Reemplázalos por los colores
 * oficiales de la UNJBG cuando el equipo de diseño los confirme.
 */
export const colors = {
  primary: {
    50: '#eef4ff',
    100: '#d9e6ff',
    200: '#b3ccff',
    300: '#80aaff',
    400: '#4d84ff',
    500: '#1a5cff',
    600: '#0041e0',
    700: '#0033ad',
    800: '#00247a',
    900: '#001a5c',
  },
  accent: {
    50: '#fff9eb',
    100: '#ffefc2',
    200: '#ffdd85',
    300: '#ffc947',
    400: '#ffb31a',
    500: '#e69500',
    600: '#b37400',
    700: '#805300',
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
