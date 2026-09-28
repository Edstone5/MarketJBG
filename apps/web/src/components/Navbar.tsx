import Link from 'next/link';
import { Store, User } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 backdrop-blur">
      <div className="h-1 w-full bg-gradient-to-r from-primary-600 to-accent-500" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Store className="h-5 w-5" aria-hidden />
          </span>
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
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-primary-400 hover:text-primary-700"
          >
            <User className="h-4 w-4" aria-hidden />
            Ingresar
          </Link>
        </div>
      </div>
    </header>
  );
}
