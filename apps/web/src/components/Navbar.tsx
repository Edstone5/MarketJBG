import Link from 'next/link';
import { Menu, Store, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

interface Sesion {
  conSesion: boolean;
  esAdmin: boolean;
}

/** Lee la sesión; si Supabase no responde, la barra se muestra como visitante en vez de romper la página. */
async function leerSesion(): Promise<Sesion> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { conSesion: false, esAdmin: false };

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .maybeSingle();
    return { conSesion: true, esAdmin: perfil?.rol === 'admin' };
  } catch {
    return { conSesion: false, esAdmin: false };
  }
}

const enlaceEscritorio = 'hover:text-primary-700';
const enlaceMovil = 'block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-primary-50 hover:text-primary-700';

export async function Navbar() {
  const { conSesion, esAdmin } = await leerSesion();

  return (
    <header className="sticky top-0 z-40 border-b border-primary-200/70 bg-[#eee9fc]/95 shadow-sm backdrop-blur">
      <div className="h-1 w-full bg-gradient-to-r from-primary-600 to-accent-500" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-primary-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Store className="h-5 w-5" aria-hidden />
          </span>
          <span className="whitespace-nowrap text-[15px] sm:text-base">MarketJBG</span>
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex"
        >
          <Link href="/catalogo" className={enlaceEscritorio}>
            Catálogo
          </Link>
          <Link href="/mi-emprendimiento" className={enlaceEscritorio}>
            Vender
          </Link>
          {esAdmin && (
            <Link href="/admin" className={enlaceEscritorio}>
              Administración
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={conSesion ? '/mi-cuenta' : '/login'}
            className="flex items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:border-primary-400 hover:text-primary-700 sm:px-4"
          >
            <User className="h-4 w-4" aria-hidden />
            {conSesion ? 'Mi cuenta' : 'Ingresar'}
          </Link>

          {/* Menú para pantallas pequeñas: <details> funciona sin JavaScript */}
          <details className="relative md:hidden">
            <summary
              aria-label="Abrir menú"
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-primary-200 bg-white text-neutral-700 hover:border-primary-400 [&::-webkit-details-marker]:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </summary>
            <nav
              aria-label="Menú"
              className="absolute right-0 mt-2 w-52 rounded-2xl border border-neutral-100 bg-white p-2 shadow-lg"
            >
              <Link href="/catalogo" className={enlaceMovil}>
                Catálogo
              </Link>
              <Link href="/mi-emprendimiento" className={enlaceMovil}>
                Vender
              </Link>
              {esAdmin && (
                <Link href="/admin" className={enlaceMovil}>
                  Administración
                </Link>
              )}
              <Link href={conSesion ? '/mi-cuenta' : '/login'} className={enlaceMovil}>
                {conSesion ? 'Mi cuenta' : 'Ingresar'}
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
