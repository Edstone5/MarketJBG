export interface Barra {
  clave: string;
  valor: number;
  /** Texto del globo al pasar el cursor, p. ej. «24/10/2026: 6 visitas». */
  titulo: string;
  destacada?: boolean;
}

/**
 * Gráfico de barras sin librerías: cada barra mide su valor frente al máximo. Es un
 * componente de servidor (no necesita JavaScript en el navegador).
 */
export function GraficoBarras({
  barras,
  descripcion,
  etiquetaInicio,
  etiquetaFin,
}: {
  barras: Barra[];
  /** Lo que lee un lector de pantalla en lugar del dibujo. */
  descripcion: string;
  etiquetaInicio: string;
  etiquetaFin: string;
}) {
  const maximo = Math.max(1, ...barras.map((barra) => barra.valor));

  return (
    <figure>
      <div className="relative">
        <span className="absolute right-1 top-0 text-xs text-neutral-400">Máx. {maximo}</span>
        <div
          role="img"
          aria-label={descripcion}
          className="flex h-40 items-end gap-px rounded-xl bg-neutral-50 px-2 pb-2 pt-5"
        >
          {barras.map((barra) => (
            <div key={barra.clave} title={barra.titulo} className="flex h-full min-w-0 flex-1 items-end">
              <div
                className={`w-full rounded-t ${barra.destacada ? 'bg-accent-500' : 'bg-primary-500'}`}
                style={{ height: barra.valor === 0 ? '2px' : `${Math.max(4, (barra.valor / maximo) * 100)}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-1 flex justify-between text-xs text-neutral-500">
        <span>{etiquetaInicio}</span>
        <span>{etiquetaFin}</span>
      </figcaption>
    </figure>
  );
}
