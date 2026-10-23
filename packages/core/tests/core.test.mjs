// Pruebas del paquete core: mensajes de validación en español, traducción de errores, ayudantes de
// archivos y vigencia de la suscripción. core está en TypeScript y se usa sin compilar, así que aquí se
// transpila con el `typescript` del monorepo a una carpeta temporal (ignorada por git) y se importa.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, '.test-build');
let core;

function transpilar(origen, destino) {
  mkdirSync(destino, { recursive: true });
  for (const entrada of readdirSync(origen, { withFileTypes: true })) {
    const ruta = join(origen, entrada.name);
    if (entrada.isDirectory()) transpilar(ruta, join(destino, entrada.name));
    else if (entrada.name.endsWith('.ts')) {
      const { outputText } = ts.transpileModule(readFileSync(ruta, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      });
      writeFileSync(join(destino, entrada.name.replace(/\.ts$/, '.js')), outputText);
    }
  }
}

before(() => {
  rmSync(SALIDA, { recursive: true, force: true });
  transpilar(join(RAIZ, 'src'), SALIDA);
  core = createRequire(import.meta.url)(join(SALIDA, 'index.js'));
});
after(() => rmSync(SALIDA, { recursive: true, force: true }));

const mensaje = (resultado) => (resultado.success ? 'ok' : core.primerError(resultado.error));

describe('mensajes de validación en español', () => {
  test('pago: comprobante y monto', () => {
    const { reportarPagoSchema: s } = core;
    assert.equal(mensaje(s.safeParse({ montoReportado: 5, comprobanteUrl: undefined })), 'Comprobante: es obligatorio.');
    assert.equal(mensaje(s.safeParse({ montoReportado: 5, comprobanteUrl: '' })), 'Sube la captura del comprobante de Yape.');
    assert.equal(mensaje(s.safeParse({ montoReportado: 0, comprobanteUrl: 'a/b.png' })), 'Monto: debe ser mayor que 0.');
    assert.equal(mensaje(s.safeParse({ montoReportado: NaN, comprobanteUrl: 'a/b.png' })), 'Monto: debe ser un número.');
  });

  test('producto: nombre, precio, fotos y categoría', () => {
    const { crearProductoSchema: s } = core;
    const base = { tipo: 'producto', nombre: 'Pan', descripcion: 'Pan fresco hecho en casa', precio: 5, categoriaSlug: 'comida', imagenes: [] };
    assert.equal(mensaje(s.safeParse(base)), 'ok');
    assert.equal(mensaje(s.safeParse({ ...base, nombre: 'a' })), 'Nombre: debe tener al menos 2 caracteres.');
    assert.equal(mensaje(s.safeParse({ ...base, precio: 60000 })), 'Precio: no puede ser mayor que 50000.');
    assert.equal(mensaje(s.safeParse({ ...base, imagenes: ['no-es-url'] })), 'Fotos: no es un enlace válido.');
    assert.equal(mensaje(s.safeParse({ ...base, imagenes: Array(7).fill('https://a.co/x.png') })), 'Fotos: admite como máximo 6 elementos.');
    assert.equal(mensaje(s.safeParse({ ...base, categoriaSlug: 'otra' })), 'Categoría: no es una opción válida.');
  });

  test('registro e inicio de sesión conservan sus mensajes propios', () => {
    const base = { email: 'ana@unjbg.edu.pe', password: '12345678', nombreCompleto: 'Ana Perez' };
    assert.equal(mensaje(core.registroSchema.safeParse(base)), 'ok');
    assert.match(mensaje(core.registroSchema.safeParse({ ...base, email: 'ana@gmail.com' })), /dominio @unjbg\.edu\.pe/);
    assert.match(mensaje(core.registroSchema.safeParse({ ...base, email: 'ana@fake.unjbg.edu.pe' })), /dominio @unjbg\.edu\.pe/);
    assert.equal(mensaje(core.registroSchema.safeParse({ ...base, password: '123' })), 'La contraseña debe tener al menos 8 caracteres');
    assert.equal(mensaje(core.loginSchema.safeParse({ email: 'x', password: 'y' })), 'Correo: no es un correo válido.');
  });
});

describe('estados de pago', () => {
  test('solo existen pendiente y validado', () => {
    assert.deepEqual([...core.ESTADOS_PAGO], ['pendiente', 'validado']);
    for (const estado of ['aprobado', 'rechazado']) {
      assert.equal(core.pagoSchema.shape.estado.safeParse(estado).success, false, estado);
    }
    assert.deepEqual(Object.keys(core.ETIQUETAS_ESTADO_PAGO), ['pendiente', 'validado']);
  });

  test('un negocio activo cuya suscripción terminó se trata como vencido', () => {
    const futuro = new Date(Date.now() + 86400000).toISOString();
    const pasado = new Date(Date.now() - 86400000).toISOString();
    assert.equal(core.estadoEfectivo('activo', futuro), 'activo');
    assert.equal(core.estadoEfectivo('activo', pasado), 'vencido');
    assert.equal(core.estadoEfectivo('activo', null), 'vencido');
    assert.equal(core.estadoEfectivo('suspendido', futuro), 'suspendido');
    assert.equal(core.estadoEfectivo('pendiente', null), 'pendiente');
  });
});

describe('mensajeError', () => {
  test('traduce errores de Supabase', () => {
    assert.equal(core.mensajeError({ code: 'invalid_credentials', message: 'Invalid login credentials' }), 'Correo o contraseña incorrectos.');
    assert.equal(core.mensajeError({ message: 'Database error saving new user', code: 'unexpected_failure' }), 'Solo se aceptan correos institucionales @unjbg.edu.pe.');
    assert.equal(core.mensajeError({ message: 'User already registered' }), 'Ya existe una cuenta con ese correo. Inicia sesión.');
    assert.match(core.mensajeError({ message: 'new row violates row-level security policy for table "pagos"', code: '42501' }), /No tienes permiso/);
    assert.equal(core.mensajeError({ message: 'duplicate key value violates unique constraint "emprendimientos_usuario_id_key"', code: '23505' }), 'Ya tienes un emprendimiento registrado.');
    assert.equal(core.mensajeError(new TypeError('Network request failed')), 'No hay conexión. Revisa tu internet e inténtalo de nuevo.');
  });

  test('conserva los mensajes propios y usa el de respaldo con lo desconocido', () => {
    assert.equal(core.mensajeError({ message: 'Solo un administrador puede validar pagos.', code: 'P0001' }), 'Solo un administrador puede validar pagos.');
    assert.equal(core.mensajeError(new core.ErrorDeUsuario('Ya tienes 3 pagos esperando revisión.')), 'Ya tienes 3 pagos esperando revisión.');
    assert.equal(core.mensajeError({ message: 'something obscure in English' }, 'Mensaje por defecto'), 'Mensaje por defecto');
  });
});

describe('archivos', () => {
  test('nombreArchivoSeguro deja solo letras, números, punto y guion', () => {
    assert.equal(core.nombreArchivoSeguro('Captura de pantalla, final (1).PNG'), 'captura-de-pantalla-final-1.png');
    assert.equal(core.nombreArchivoSeguro('Año nuevo ñandú.jpg'), 'ano-nuevo-nandu.jpg');
    assert.equal(core.nombreArchivoSeguro('../../etc/passwd'), 'passwd');
    assert.equal(core.nombreArchivoSeguro('C:\\fakepath\\Mi foto.JPG'), 'mi-foto.jpg');
    assert.equal(core.nombreArchivoSeguro('***'), 'archivo');
  });

  test('validarArchivoImagen: solo JPG/PNG/WebP de hasta 5 MB', () => {
    assert.equal(core.validarArchivoImagen({ type: 'image/png', size: 1000 }), null);
    assert.match(core.validarArchivoImagen({ type: 'application/pdf', size: 1000 }), /JPG, PNG o WebP/);
    assert.match(core.validarArchivoImagen({ type: 'image/svg+xml', size: 1000 }), /JPG, PNG o WebP/);
    assert.match(core.validarArchivoImagen({ type: 'image/png', size: 6 * 1024 * 1024 }), /5 MB/);
    assert.equal(core.validarArchivoImagen({}), null);
  });

  test('esFotoDelUsuario: solo nuestro almacenamiento y la carpeta propia', () => {
    const base = 'https://x.supabase.co/storage/v1/object/public/productos';
    assert.equal(core.esFotoDelUsuario(`${base}/u-1/a.png`, 'productos', 'u-1'), true);
    assert.equal(core.esFotoDelUsuario(`${base}/otro/a.png`, 'productos', 'u-1'), false);
    assert.equal(core.esFotoDelUsuario('https://evil.example/a.png', 'productos', 'u-1'), false);
  });

  test('rutaDeFoto: la ruta dentro del bucket, solo para fotos nuestras', () => {
    const base = 'https://x.supabase.co/storage/v1/object/public/productos';
    assert.equal(core.rutaDeFoto(`${base}/u-1/1700-foto.png`, 'productos'), 'u-1/1700-foto.png');
    assert.equal(core.rutaDeFoto(`${base}/u-1/mi%20foto.png?t=1`, 'productos'), 'u-1/mi foto.png');
    assert.equal(core.rutaDeFoto(`${base}/u-1/a.png`, 'logos'), null);
    assert.equal(core.rutaDeFoto('https://evil.example/a.png', 'productos'), null);
    assert.equal(core.rutaDeFoto(`${base}/../otro/a.png`, 'productos'), null);
  });
});
