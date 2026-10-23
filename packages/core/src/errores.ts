import { z, ZodIssueCode, ZodParsedType, type ZodError, type ZodErrorMap } from 'zod';

/**
 * Mensajes de error en español para toda la app (web y móvil comparten este
 * paquete). Zod trae sus textos en inglés («Required», «String must contain
 * at least 3 character(s)»); aquí se reemplazan y se les antepone el nombre
 * del campo. Los esquemas con `message` propio no pasan por este mapa.
 */
const ETIQUETAS_CAMPO: Record<string, string> = {
  email: 'Correo',
  password: 'Contraseña',
  nombreCompleto: 'Nombre completo',
  nombre: 'Nombre',
  descripcion: 'Descripción',
  precio: 'Precio',
  categoriaSlug: 'Categoría',
  tipo: 'Tipo',
  imagenes: 'Fotos',
  whatsapp: 'WhatsApp',
  montoReportado: 'Monto',
  comprobanteUrl: 'Comprobante',
  pagoId: 'Pago',
};

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function describir(issue: Parameters<ZodErrorMap>[0]): string {
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined || issue.received === ZodParsedType.null) {
        return 'es obligatorio';
      }
      return issue.expected === 'number' ? 'debe ser un número' : 'no tiene un formato válido';
    case ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return Number(issue.minimum) <= 1
          ? 'es obligatorio'
          : `debe tener al menos ${issue.minimum} caracteres`;
      }
      if (issue.type === 'number') {
        return issue.inclusive
          ? `debe ser como mínimo ${issue.minimum}`
          : `debe ser mayor que ${issue.minimum}`;
      }
      return `debe tener al menos ${issue.minimum} elementos`;
    case ZodIssueCode.too_big:
      if (issue.type === 'string') return `no puede superar los ${issue.maximum} caracteres`;
      if (issue.type === 'number') return `no puede ser mayor que ${issue.maximum}`;
      return `admite como máximo ${issue.maximum} elementos`;
    case ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return 'no es un correo válido';
      if (issue.validation === 'url') return 'no es un enlace válido';
      if (issue.validation === 'uuid') return 'no es un identificador válido';
      return 'no tiene un formato válido';
    case ZodIssueCode.invalid_enum_value:
      return 'no es una opción válida';
    default:
      return 'no es válido';
  }
}

export const mapaErroresEs: ZodErrorMap = (issue) => {
  const detalle = describir(issue);
  const campo = issue.path.find((parte): parte is string => typeof parte === 'string');
  const etiqueta = campo ? ETIQUETAS_CAMPO[campo] : undefined;
  return { message: etiqueta ? `${etiqueta}: ${detalle}.` : `${capitalizar(detalle)}.` };
};

// Efecto de importar el paquete: todos los esquemas hablan español.
z.setErrorMap(mapaErroresEs);

/** Primer error de validación, listo para mostrar al usuario. */
export function primerError(error: ZodError, porDefecto = 'Revisa los datos ingresados.'): string {
  return error.issues[0]?.message ?? porDefecto;
}

/** Error cuyo mensaje ya está pensado para mostrarse tal cual a la persona usuaria. */
export class ErrorDeUsuario extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDeUsuario';
  }
}

interface ErrorConocido {
  message?: string;
  code?: string;
}

const REGLAS: [RegExp, string][] = [
  [/emprendimientos_usuario_id_key/i, 'Ya tienes un emprendimiento registrado.'],
  [
    /row-level security|permission denied|\b42501\b/i,
    'No tienes permiso para hacer esto. Si crees que es un error, vuelve a iniciar sesión.',
  ],
  [
    /Database error saving new user|Solo se permiten correos/i,
    'Solo se aceptan correos institucionales @unjbg.edu.pe.',
  ],
  [/user_already_exists|already registered|already been registered/i, 'Ya existe una cuenta con ese correo. Inicia sesión.'],
  [/weak_password|Password should be at least/i, 'La contraseña es muy débil. Usa al menos 8 caracteres.'],
  [/invalid_credentials|Invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/email_not_confirmed|Email not confirmed/i, 'Confirma tu correo antes de ingresar: revisa tu bandeja de entrada.'],
  [
    /over_email_send_rate_limit|over_request_rate_limit|rate limit|too many requests/i,
    'Hiciste demasiados intentos. Espera unos minutos e inténtalo otra vez.',
  ],
  [/Failed to fetch|Network request failed|fetch failed|NetworkError/i, 'No hay conexión. Revisa tu internet e inténtalo de nuevo.'],
  [/JWT expired|invalid JWT|session_not_found|not authenticated|No autenticado/i, 'Tu sesión expiró. Vuelve a iniciar sesión.'],
  [/maximum allowed size|Payload too large/i, 'El archivo pesa demasiado (máximo 5 MB).'],
  [/mime type|invalid_mime_type/i, 'Solo se aceptan imágenes (JPG, PNG o WebP).'],
];

/**
 * Convierte cualquier error (Supabase Auth, PostgREST, Storage, red o una
 * excepción de nuestras funciones SQL) en un mensaje en español para el usuario.
 */
export function mensajeError(
  error: unknown,
  porDefecto = 'Ocurrió un error inesperado. Inténtalo de nuevo.',
): string {
  if (error instanceof ErrorDeUsuario) return error.message;

  const e: ErrorConocido = typeof error === 'object' && error !== null ? error : {};
  const texto = typeof error === 'string' ? error : (e.message ?? '');
  const codigo = e.code ?? '';

  for (const [patron, mensaje] of REGLAS) {
    if (patron.test(texto) || patron.test(codigo)) return mensaje;
  }
  // Las excepciones de nuestras funciones SQL (raise exception) ya vienen en español.
  if (codigo === 'P0001' && texto) return texto;
  return porDefecto;
}
