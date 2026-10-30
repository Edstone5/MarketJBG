import { z } from 'zod';

/**
 * RF09: estadísticas de visitas y desempeño de un emprendimiento.
 * La base de datos las calcula (`estadisticas_emprendimiento`, migración 0006);
 * aquí viven los tipos, la validación de lo que devuelve y el reporte descargable.
 */

/** perfil = vio el negocio · producto = vio una publicación · contacto = tocó «Contactar por WhatsApp». */
export const TIPOS_VISITA = ['perfil', 'producto', 'contacto'] as const;
export type TipoVisita = (typeof TIPOS_VISITA)[number];

/** Periodos que ofrece el panel (en días, contando hoy). */
export const PERIODOS_ESTADISTICAS = [7, 30, 90] as const;
export const PERIODO_ESTADISTICAS_POR_DEFECTO = 30;

/** Los días y las horas de las estadísticas se cuentan en hora de Perú. */
export const ZONA_HORARIA_ESTADISTICAS = 'America/Lima';

const entero = z.number().int().nonnegative();

export const estadisticasSchema = z.object({
  desde: z.string(),
  hasta: z.string(),
  dias: entero,
  visitas_perfil: entero,
  visitas_productos: entero,
  contactos: entero,
  por_dia: z.array(z.object({ dia: z.string(), visitas: entero, contactos: entero })),
  por_hora: z.array(z.object({ hora: z.number().int().min(0).max(23), visitas: entero })),
  hora_pico: z.number().int().min(0).max(23).nullable(),
  productos: z.array(
    z.object({ producto_id: z.string().uuid(), nombre: z.string(), visitas: entero, contactos: entero }),
  ),
});

export type Estadisticas = z.infer<typeof estadisticasSchema>;

/** Convierte el `?dias=` de la URL en uno de los periodos permitidos (por defecto 30). */
export function periodoEstadisticas(valor: unknown): number {
  const numero = Number(Array.isArray(valor) ? valor[0] : valor);
  return (PERIODOS_ESTADISTICAS as readonly number[]).includes(numero)
    ? numero
    : PERIODO_ESTADISTICAS_POR_DEFECTO;
}

/** Visitas totales: al perfil más a las publicaciones (los contactos se cuentan aparte). */
export function totalVisitas(e: Pick<Estadisticas, 'visitas_perfil' | 'visitas_productos'>): number {
  return e.visitas_perfil + e.visitas_productos;
}

/** Porcentaje de visitas a publicaciones que terminaron en un clic a WhatsApp (0 si no hubo visitas). */
export function tasaDeContacto(e: Pick<Estadisticas, 'visitas_productos' | 'contactos'>): number {
  return e.visitas_productos > 0 ? Math.round((e.contactos / e.visitas_productos) * 100) : 0;
}

/** «13:00 – 14:00» para la hora 13. */
export function etiquetaHora(hora: number): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(hora)}:00 – ${dos((hora + 1) % 24)}:00`;
}

/** «2026-10-24» → «24/10/2026». Se arma a mano porque `new Date('2026-10-24')` se corre un día en Perú. */
export function formatearDia(dia: string): string {
  const [anio, mes, diaDelMes] = dia.split('-');
  return `${diaDelMes}/${mes}/${anio}`;
}

/** Un valor de CSV entre comillas; si empieza como una fórmula de Excel se neutraliza. */
function celdaCsv(valor: string | number): string {
  let texto = String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

/**
 * Reporte descargable en CSV (se abre en Excel). Lleva un BOM para que Excel
 * lea bien las tildes y secciones separadas por una línea en blanco.
 */
export function reporteCsv(nombreNegocio: string, e: Estadisticas, generadoEn: Date = new Date()): string {
  const filas: (string | number)[][] = [
    ['Reporte de estadísticas · MarketJBG'],
    ['Emprendimiento', nombreNegocio],
    ['Periodo', `${formatearDia(e.desde)} al ${formatearDia(e.hasta)} (${e.dias} días, hora de Perú)`],
    [
      'Generado',
      generadoEn.toLocaleString('es-PE', { timeZone: ZONA_HORARIA_ESTADISTICAS, dateStyle: 'short', timeStyle: 'short' }),
    ],
    [],
    ['Resumen'],
    ['Indicador', 'Valor'],
    ['Visitas totales', totalVisitas(e)],
    ['Visitas al perfil', e.visitas_perfil],
    ['Visitas a publicaciones', e.visitas_productos],
    ['Clics en «Contactar por WhatsApp»', e.contactos],
    ['Hora de mayor actividad', e.hora_pico === null ? 'Sin visitas' : etiquetaHora(e.hora_pico)],
    [],
    ['Visitas por día'],
    ['Día', 'Visitas', 'Clics en WhatsApp'],
    ...e.por_dia.map((d) => [formatearDia(d.dia), d.visitas, d.contactos]),
    [],
    ['Visitas por hora del día (hora de Perú)'],
    ['Hora', 'Visitas'],
    ...e.por_hora.map((h) => [etiquetaHora(h.hora), h.visitas]),
    [],
    ['Publicaciones más vistas'],
    ['Publicación', 'Visitas', 'Clics en WhatsApp'],
    ...(e.productos.length > 0
      ? e.productos.map((p) => [p.nombre, p.visitas, p.contactos])
      : [['Sin visitas a publicaciones en este periodo', '', '']]),
  ];
  const cuerpo = filas.map((fila) => fila.map(celdaCsv).join(',')).join('\r\n');
  return `﻿${cuerpo}\r\n`;
}

/** Resumen corto en texto, para compartir desde el celular (WhatsApp, correo…). */
export function reporteTexto(nombreNegocio: string, e: Estadisticas): string {
  const lineas = [
    `Estadísticas de ${nombreNegocio} · MarketJBG`,
    `Del ${formatearDia(e.desde)} al ${formatearDia(e.hasta)} (${e.dias} días)`,
    '',
    `Visitas totales: ${totalVisitas(e)}`,
    `· Al perfil: ${e.visitas_perfil}`,
    `· A publicaciones: ${e.visitas_productos}`,
    `Clics en WhatsApp: ${e.contactos}`,
    `Hora de mayor actividad: ${e.hora_pico === null ? 'sin visitas' : etiquetaHora(e.hora_pico)}`,
  ];
  if (e.productos.length > 0) {
    lineas.push('', 'Publicaciones más vistas:');
    e.productos.slice(0, 5).forEach((p, i) => lineas.push(`${i + 1}. ${p.nombre}: ${p.visitas} visitas, ${p.contactos} clics`));
  }
  return lineas.join('\n');
}
