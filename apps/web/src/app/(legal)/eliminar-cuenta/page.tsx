import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Eliminar mi cuenta',
  description: 'Cómo solicitar la eliminación de tu cuenta y tus datos en Emprende UNJBG.',
};

const CORREO_CONTACTO = 'privacidad@emprendeunjbg.com';

export default function EliminarCuentaPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold text-neutral-900">Eliminar mi cuenta y mis datos</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Puedes eliminar tu cuenta de Emprende UNJBG y todos los datos personales asociados en
          cualquier momento, de dos maneras:
        </p>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-2 text-base font-semibold text-neutral-900">
            Opción 1 · Desde la app (recomendada)
          </h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-600">
            <li>
              Inicia sesión y entra a{' '}
              <Link href="/mi-cuenta" className="text-primary-700 underline">
                Mi cuenta
              </Link>{' '}
              en la web, o a la pestaña <strong>Perfil</strong> en la app móvil.
            </li>
            <li>
              Pulsa <strong>&quot;Eliminar mi cuenta&quot;</strong> y confirma la acción.
            </li>
          </ol>
          <p className="mt-2 text-sm text-neutral-500">
            La eliminación ocurre de inmediato: no necesitas esperar a que el equipo la procese
            manualmente.
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-2 text-base font-semibold text-neutral-900">
            Opción 2 · Sin acceso a tu cuenta
          </h2>
          <p className="text-sm text-neutral-600">
            Si perdiste el acceso a tu cuenta o prefieres no usar la app, escríbenos a{' '}
            <a href={`mailto:${CORREO_CONTACTO}`} className="text-primary-700 underline">
              {CORREO_CONTACTO}
            </a>{' '}
            desde el correo institucional con el que te registraste, indicando que deseas
            eliminar tu cuenta. Procesaremos la solicitud en un plazo máximo de 15 días hábiles y
            te confirmaremos por correo cuando se complete.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-base font-semibold text-neutral-900">
            Qué se elimina y qué se conserva
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            Al eliminar tu cuenta borramos permanentemente tu perfil, tu perfil de
            emprendimiento (si tenías uno), tus productos publicados y sus fotos, y tu historial
            de comprobantes de pago Yape. Podemos conservar registros mínimos y anonimizados
            (por ejemplo, para cumplir obligaciones legales o contables) durante el plazo que
            exija la normativa aplicable, sin que estos permitan identificarte.
          </p>
        </div>

        <p className="mt-6 text-sm text-neutral-500">
          Más detalles en nuestra{' '}
          <Link href="/privacidad" className="text-primary-700 underline">
            Política de Privacidad
          </Link>
          .
        </p>
      </main>
      <Footer />
    </>
  );
}
