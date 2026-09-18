import Link from 'next/link';
import { Store, User } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary-700">
          <Store className="h-6 w-6" aria-hidden />
          <span>Emprende UNJBG</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">
          <Link href="/catalogo" className="hover:text-primary-700">
            Catálogo
          </Link>
          <Link href="/mi-emprendimiento" className="hover:text-primary-700">
            Vender
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-primary-500 hover:text-primary-700"
          >
            <User className="h-4 w-4" aria-hidden />
            Ingresar
          </Link>
        </div>
      </div>
    </header>
  );
}
