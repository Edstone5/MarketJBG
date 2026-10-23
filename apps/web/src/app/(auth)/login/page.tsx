import Link from 'next/link';
import { LoginForm } from '@/components/LoginForm';
import { rutaInterna } from '@/lib/rutas';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = rutaInterna(typeof params.next === 'string' ? params.next : null);
  const recienRegistrado = params.registrado === '1';
  const falloConfirmacion = params.error === 'confirmacion';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Ingresa a tu cuenta</h1>
        <p className="mt-1 text-sm text-neutral-500">Usa tu correo institucional UNJBG</p>
      </div>

      {recienRegistrado && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Te enviamos un correo para confirmar tu cuenta. Ábrelo, confirma y luego ingresa aquí.
        </p>
      )}
      {falloConfirmacion && (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          No pudimos confirmar tu correo; el enlace pudo vencer. Si ya lo confirmaste, ingresa; si no,
          vuelve a registrarte.
        </p>
      )}

      <LoginForm next={next} />

      <p className="text-center text-sm text-neutral-500">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="font-medium text-primary-700">
          Regístrate
        </Link>
      </p>
    </main>
  );
}
