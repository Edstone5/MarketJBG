import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-neutral-500 sm:flex-row">
        <p>© {new Date().getFullYear()} Emprende UNJBG. Proyecto estudiantil de la UNJBG.</p>
        <nav className="flex items-center gap-4">
          <Link href="/privacidad" className="hover:text-primary-700">
            Política de Privacidad
          </Link>
          <Link href="/terminos" className="hover:text-primary-700">
            Términos y Condiciones
          </Link>
          <Link href="/eliminar-cuenta" className="hover:text-primary-700">
            Eliminar mi cuenta
          </Link>
        </nav>
      </div>
    </footer>
  );
}
