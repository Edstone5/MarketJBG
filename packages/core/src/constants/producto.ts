/** El catálogo admite tanto bienes físicos como servicios (tutorías, diseño, impresiones...). */
export const TIPOS_PRODUCTO = ['producto', 'servicio'] as const;
export type TipoProducto = (typeof TIPOS_PRODUCTO)[number];

export const ETIQUETAS_TIPO_PRODUCTO: Record<TipoProducto, string> = {
  producto: 'Producto',
  servicio: 'Servicio',
};
