import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description:
    'Cómo Emprende UNJBG recopila, usa y protege los datos personales de estudiantes emprendedores y consumidores.',
};

const ULTIMA_ACTUALIZACION = '17 de septiembre de 2026';
const CORREO_CONTACTO = 'privacidad@emprendeunjbg.com';

export default function PrivacidadPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold text-neutral-900">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Última actualización: {ULTIMA_ACTUALIZACION}
        </p>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Nota para el equipo del proyecto:</strong> esta política es una plantilla
          redactada para el alcance funcional actual de la plataforma. Antes de publicarla en
          producción o de enviarla a Google Play / App Store, complétala con la razón social o
          responsable legal del tratamiento (¿el equipo del taller, una asociación de
          estudiantes, o la propia UNJBG?), reemplaza <code>{CORREO_CONTACTO}</code> por un
          correo real que el equipo revise, y pide una validación de un asesor legal o de la
          oficina de la UNJBG competente en protección de datos.
        </div>

        <Seccion titulo="1. Quiénes somos">
          <p>
            Emprende UNJBG es una plataforma desarrollada por estudiantes de Ingeniería de
            Sistemas de la Universidad Nacional Jorge Basadre Grohmann (UNJBG), en el marco del
            curso Taller de Emprendimiento, que funciona como catálogo de emprendimientos
            estudiantiles. Esta política explica qué datos personales recopilamos a través de
            la aplicación web y móvil (en conjunto, la &quot;Plataforma&quot;), para qué los
            usamos, con quién los compartimos y qué derechos tienes sobre ellos.
          </p>
          <p>
            Esta Plataforma no procesa pagos: la suscripción de los emprendedores se paga por
            Yape directamente entre el usuario y el equipo administrador, y la Plataforma solo
            almacena el comprobante para su revisión manual. Del mismo modo, la compra de
            productos se coordina fuera de la Plataforma, normalmente por WhatsApp.
          </p>
        </Seccion>

        <Seccion titulo="2. Qué datos recopilamos">
          <p>Recopilamos los siguientes datos, siempre que tú mismo los proporciones:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Datos de cuenta:</strong> nombre completo, correo institucional
              (@unjbg.edu.pe) y contraseña. La contraseña se almacena de forma encriptada por
              nuestro proveedor de autenticación (Supabase) y nunca es visible para el equipo
              del proyecto.
            </li>
            <li>
              <strong>Datos de perfil comercial</strong> (si te registras como emprendedor):
              nombre del negocio, descripción, categoría, número de WhatsApp de contacto y logo.
            </li>
            <li>
              <strong>Datos de productos publicados:</strong> nombre, descripción, precio y
              fotografías de los productos que publicas.
            </li>
            <li>
              <strong>Comprobantes de pago:</strong> la captura de pantalla del comprobante Yape
              y el monto que reportas al pagar tu suscripción mensual. Estas imágenes se
              almacenan en un espacio privado y solo son accesibles para ti y para el equipo
              administrador que valida el pago.
            </li>
            <li>
              <strong>Datos técnicos básicos:</strong> información estándar de uso de la app
              (por ejemplo, fecha de creación de publicaciones, contador de vistas de un
              producto) necesaria para el funcionamiento del catálogo.
            </li>
          </ul>
          <p>
            No recopilamos datos de tarjetas de crédito o débito, ni datos bancarios: la
            Plataforma nunca procesa el dinero directamente.
          </p>
        </Seccion>

        <Seccion titulo="3. Para qué usamos tus datos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Crear y administrar tu cuenta, y verificar que perteneces a la comunidad UNJBG.</li>
            <li>Mostrar tu perfil comercial y tus productos en el catálogo público.</li>
            <li>
              Permitir que otros estudiantes te contacten por WhatsApp cuando publicas un
              producto.
            </li>
            <li>Validar manualmente el pago de tu suscripción y activar tu visibilidad en el catálogo.</li>
            <li>Moderar contenido que incumpla nuestros Términos y Condiciones.</li>
            <li>Comunicarnos contigo sobre el estado de tu cuenta, suscripción o publicaciones.</li>
            <li>Mejorar la Plataforma y corregir errores técnicos.</li>
          </ul>
          <p>No usamos tus datos para publicidad de terceros ni los vendemos a nadie.</p>
        </Seccion>

        <Seccion titulo="4. Base legal del tratamiento">
          <p>
            Tratamos tus datos personales conforme a la Ley N.º 29733, Ley de Protección de
            Datos Personales del Perú, y su Reglamento (Decreto Supremo N.º 003-2013-JUS), sobre
            la base de: (a) tu consentimiento libre, expreso e informado al crear una cuenta y
            aceptar esta política; y (b) la ejecución de la relación de servicio que se genera
            entre tú y la Plataforma al usar el catálogo.
          </p>
        </Seccion>

        <Seccion titulo="5. Con quién compartimos tus datos">
          <p>
            Tu perfil comercial y tus productos son <strong>públicos</strong> dentro del
            catálogo: cualquier persona que visite la Plataforma puede verlos. Tu número de
            WhatsApp solo se muestra como enlace de contacto directo, no como texto plano
            visible para bots de scraping automatizado (aunque no podemos garantizar al 100%
            que un tercero no lo copie manualmente, como ocurre con cualquier directorio
            público).
          </p>
          <p>Compartimos datos con los siguientes proveedores, únicamente para operar la Plataforma:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase</strong> (base de datos, autenticación y almacenamiento de
              archivos).
            </li>
            <li>
              <strong>Vercel</strong> (alojamiento de la aplicación web).
            </li>
            <li>
              <strong>Expo / EAS</strong> (distribución y actualización de la aplicación móvil).
            </li>
          </ul>
          <p>
            Estos proveedores actúan como encargados del tratamiento bajo sus propios acuerdos
            de confidencialidad y seguridad, y no usan tus datos para fines propios. No
            compartimos tus datos con anunciantes ni los cedemos a terceros con fines
            comerciales.
          </p>
          <p>
            Cuando contactas a un vendedor por WhatsApp, esa conversación ocurre en WhatsApp y
            se rige por la política de privacidad de Meta/WhatsApp, no por esta política.
          </p>
        </Seccion>

        <Seccion titulo="6. Transferencia internacional de datos">
          <p>
            Nuestros proveedores de infraestructura (Supabase, Vercel) pueden almacenar datos en
            servidores ubicados fuera del Perú. Al usar la Plataforma, aceptas esta
            transferencia internacional, que se realiza únicamente para fines operativos y bajo
            los estándares de seguridad de dichos proveedores.
          </p>
        </Seccion>

        <Seccion titulo="7. Conservación de datos">
          <p>
            Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación de
            tu cuenta, eliminamos o anonimizamos tus datos personales en un plazo razonable,
            salvo que debamos conservar cierta información (por ejemplo, comprobantes de pago)
            durante un periodo adicional por motivos administrativos o legales.
          </p>
        </Seccion>

        <Seccion titulo="8. Tus derechos (derechos ARCO)">
          <p>
            De acuerdo con la Ley N.º 29733, tienes derecho a acceder, rectificar, cancelar y
            oponerte al tratamiento de tus datos personales (derechos ARCO), así como a revocar
            tu consentimiento en cualquier momento. También puedes solicitar la portabilidad de
            tus datos cuando la ley lo permita.
          </p>
          <p>
            Puedes ejercer estos derechos directamente desde la app (editando o eliminando tu
            perfil, tus productos o tu cuenta) o escribiéndonos a{' '}
            <a href={`mailto:${CORREO_CONTACTO}`} className="text-primary-700 underline">
              {CORREO_CONTACTO}
            </a>
            . Responderemos tu solicitud dentro de los plazos que establece la ley. Para
            eliminar tu cuenta y todos tus datos, visita{' '}
            <a href="/eliminar-cuenta" className="text-primary-700 underline">
              emprendeunjbg.com/eliminar-cuenta
            </a>
            .
          </p>
        </Seccion>

        <Seccion titulo="9. Seguridad">
          <p>
            Aplicamos medidas técnicas razonables para proteger tus datos, incluyendo cifrado en
            tránsito (HTTPS), autenticación segura y control de acceso por roles a nivel de base
            de datos (por ejemplo, los comprobantes de pago solo son visibles para ti y para el
            equipo administrador). Ningún sistema es 100% infalible, y te recomendamos usar una
            contraseña única y no compartirla con nadie.
          </p>
        </Seccion>

        <Seccion titulo="10. Menores de edad">
          <p>
            La Plataforma está dirigida a estudiantes universitarios con correo institucional
            activo. No está diseñada para niños menores de 14 años y no recopilamos
            intencionalmente datos de menores de esa edad.
          </p>
        </Seccion>

        <Seccion titulo="11. Cookies y tecnologías similares (versión web)">
          <p>
            La versión web usa cookies estrictamente necesarias para mantener tu sesión iniciada
            (gestionadas por Supabase Auth). No usamos cookies de rastreo publicitario ni de
            analítica de terceros.
          </p>
        </Seccion>

        <Seccion titulo="12. Cambios a esta política">
          <p>
            Podemos actualizar esta política cuando cambien las funcionalidades de la
            Plataforma. Publicaremos la fecha de la última actualización en la parte superior de
            esta página y, si el cambio es significativo, te lo notificaremos dentro de la app.
          </p>
        </Seccion>

        <Seccion titulo="13. Contacto">
          <p>
            Si tienes preguntas sobre esta política o sobre el tratamiento de tus datos, escribe
            a{' '}
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
