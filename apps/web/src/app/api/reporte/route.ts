import { NextResponse, type NextRequest } from 'next/server';
import { nombreArchivoSeguro, periodoEstadisticas, reporteCsv } from '@emprende/core';
import { obtenerEstadisticas, obtenerMiEmprendimiento } from '@emprende/db';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * RF09: descarga el reporte de estadísticas (CSV) del emprendimiento de quien tiene la sesión
 * abierta. Nunca recibe un id desde afuera: siempre es el negocio del usuario de la sesión, y
 * la base de datos vuelve a comprobar que es el dueño (o un administrador).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Inicia sesión para descargar tu reporte.' }, { status: 401 });
  }

  const emprendimiento = await obtenerMiEmprendimiento(supabase, user.id).catch(() => null);
  if (!emprendimiento) {
    return NextResponse.json({ error: 'Todavía no tienes un emprendimiento.' }, { status: 404 });
  }

  const dias = periodoEstadisticas(request.nextUrl.searchParams.get('dias'));
  let estadisticas;
  try {
    estadisticas = await obtenerEstadisticas(supabase, emprendimiento.id, dias);
  } catch (error) {
    console.error('No se pudo generar el reporte', error);
    return NextResponse.json({ error: 'No se pudo generar el reporte. Inténtalo de nuevo.' }, { status: 503 });
  }

  const archivo = nombreArchivoSeguro(`reporte ${emprendimiento.nombre} ${estadisticas.hasta}.csv`);
  return new NextResponse(reporteCsv(emprendimiento.nombre, estadisticas), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${archivo}"`,
      'cache-control': 'no-store',
    },
  });
}
