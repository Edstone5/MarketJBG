import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DOMINIO_INSTITUCIONAL, PRECIO_SUSCRIPCION_MENSUAL } from '@emprende/core';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Reglas de uso de Emprende UNJBG para emprendedores y consumidores.',
};

const ULTIMA_ACTUALIZACION = '17 de septiembre de 2026';
const CORREO_CONTACTO = 'soporte@emprendeunjbg.com';

export default function TerminosPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold text-neutral-900">Términos y Condiciones de Uso</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Última actualización: {ULTIMA_ACTUALIZACION}
        </p>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Nota para el equipo del proyecto:</strong> revisa estos términos junto con la{' '}
          <a href="/privacidad" className="underline">
            Política de Privacidad
          </a>{' '}
          antes de publicarlos. Reemplaza <code>{CORREO_CONTACTO}</code> por un correo real y
          confirma con la universidad si la Plataforma se presenta como un proyecto estudiantil
          independiente o como un servicio institucional de la UNJBG.
        </div>

        <Seccion titulo="1. Aceptación de los términos">
          <p>
            Al crear una cuenta o usar Emprende UNJBG (la &quot;Plataforma&quot;), aceptas estos
            Términos y Condiciones y la Política de Privacidad. Si no estás de acuerdo, no uses
            la Plataforma.
          </p>
        </Seccion>

        <Seccion titulo="2. Qué es Emprende UNJBG">
          <p>
            Emprende UNJBG es un catálogo digital que conecta a estudiantes emprendedores de la
            Universidad Nacional Jorge Basadre Grohmann con consumidores dentro de la comunidad
            universitaria. La Plataforma <strong>no vende productos directamente</strong>, no
            procesa pagos de compras y no participa en la entrega ni en la calidad de los
            productos o servicios ofrecidos: solo facilita el descubrimiento y el contacto entre
            las partes, que luego coordinan la transacción por su cuenta (normalmente por
            WhatsApp).
          </p>
        </Seccion>

        <Seccion titulo="3. Elegibilidad y registro">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Debes registrarte con un correo institucional válido del dominio{' '}
              {DOMINIO_INSTITUCIONAL}.
            </li>
            <li>La información que proporciones debe ser veraz, exacta y actualizada.</li>
            <li>
              Eres responsable de mantener la confidencialidad de tu contraseña y de toda
              actividad que ocurra en tu cuenta.
            </li>
            <li>
              Nos reservamos el derecho de suspender cuentas con información falsa o que ya no
              pertenezcan a un correo institucional activo.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="4. Cuenta de emprendedor y suscripción">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Cualquier usuario registrado puede crear un perfil de emprendedor para publicar
              productos.
            </li>
            <li>
              Para que tu emprendimiento sea visible en el catálogo público, debes pagar una
              micro-suscripción mensual de S/ {PRECIO_SUSCRIPCION_MENSUAL} vía Yape y subir el
              comprobante correspondiente dentro de la Plataforma.
            </li>
            <li>
              La validación del pago es <strong>manual</strong>: un administrador revisa el
              comprobante y aprueba o rechaza la activación en un plazo razonable (normalmente
              dentro de 24 horas hábiles).
            </li>
            <li>
              La suscripción no se renueva automáticamente ni se cobra de forma recurrente sin
              tu intervención: cada periodo requiere que reportes un nuevo pago.
            </li>
            <li>
              Los pagos ya reportados y aprobados no son reembolsables, salvo error atribuible a
              la Plataforma.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="5. Contenido publicado">
          <p>Al publicar un producto o perfil comercial, declaras que:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Tienes derecho a ofrecer ese producto o servicio.</li>
            <li>Las fotos, precios y descripciones son veraces y no engañosas.</li>
            <li>El producto o servicio no infringe la ley peruana ni el reglamento estudiantil de la UNJBG.</li>
          </ul>
          <p>Está prohibido publicar, entre otros:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Productos o servicios ilegales, falsificados o peligrosos.</li>
            <li>Bebidas alcohólicas, sustancias controladas o material regulado que requiera licencias que no posees.</li>
            <li>Contenido discriminatorio, difamatorio, sexual o que incite a la violencia.</li>
            <li>Servicios académicos que constituyan plagio o fraude académico (por ejemplo, elaboración de trabajos o exámenes de terceros).</li>
            <li>Spam, esquemas piramidales o contenido no relacionado con un emprendimiento genuino.</li>
          </ul>
          <p>
            Podemos remover cualquier publicación o suspender cualquier cuenta que incumpla
            estas reglas, sin necesidad de aviso previo cuando la infracción sea grave.
          </p>
        </Seccion>

        <Seccion titulo="6. Transacciones entre usuarios">
          <p>
            La compra y venta de productos ocurre <strong>fuera de la Plataforma</strong>,
            directamente entre el emprendedor y el consumidor. Emprende UNJBG no es parte de esa
            transacción, no garantiza la calidad, legalidad, seguridad o entrega de los
            productos, y no media disputas de pago o reembolso entre usuarios. Cualquier
            desacuerdo debe resolverse directamente entre las partes.
          </p>
        </Seccion>

        <Seccion titulo="7. Propiedad intelectual">
          <p>
            Conservas los derechos sobre el contenido que publicas (fotos, descripciones), pero
            nos otorgas una licencia no exclusiva para mostrarlo dentro del catálogo de la
            Plataforma. El nombre, el logo y el diseño de Emprende UNJBG pertenecen al equipo del
            proyecto y no pueden usarse sin autorización.
          </p>
        </Seccion>

        <Seccion titulo="8. Limitación de responsabilidad">
          <p>
            La Plataforma se ofrece &quot;tal cual&quot;, como un proyecto académico en
            desarrollo continuo. No garantizamos disponibilidad ininterrumpida ni ausencia total
            de errores. En la medida permitida por la ley, no somos responsables por daños
            derivados de transacciones entre usuarios, pérdida de datos, o el uso indebido de la
            Plataforma por parte de terceros.
          </p>
        </Seccion>

        <Seccion titulo="9. Suspensión y terminación de cuenta">
          <p>
            Puedes eliminar tu cuenta en cualquier momento. Podemos suspender o eliminar cuentas
            que incumplan estos términos, que dejen de pertenecer a la comunidad UNJBG, o por
            inactividad prolongada, previa notificación cuando sea razonablemente posible.
          </p>
        </Seccion>

        <Seccion titulo="10. Cambios a estos términos">
          <p>
            Podemos actualizar estos términos cuando cambien las funcionalidades de la
            Plataforma. Los cambios entran en vigor al publicarse; el uso continuado de la
            Plataforma implica su aceptación.
          </p>
        </Seccion>

        <Seccion titulo="11. Ley aplicable">
          <p>
            Estos términos se rigen por las leyes de la República del Perú. Cualquier
            controversia se someterá a los jueces y tribunales de Tacna, Perú, sin perjuicio de
            los mecanismos de resolución que la propia comunidad universitaria disponga para
            asuntos académicos.
          </p>
        </Seccion>

        <Seccion titulo="12. Contacto">
          <p>
            Para consultas sobre estos términos, escribe a{' '}
            <a href={`mailto:${CORREO_CONTACTO}`} className="text-primary-700 underline">
              {CORREO_CONTACTO}
            </a>
            .
          </p>
        </Seccion>
      </main>
      <Footer />
    </>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-neutral-900">{titulo}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-neutral-600">{children}</div>
    </section>
  );
}
