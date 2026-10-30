// Pruebas de las políticas de seguridad (RLS), disparadores y funciones de supabase/migrations.
// Cada caso de "bloqueado" corresponde a una incidencia de la revisión del 2026-10-15
// (Pendientes/06-incidencias-marketjbg.md, solo local). Ejecutar con `pnpm test`.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { crearEntorno, filas, uno } from './entorno.mjs';

let env;
let db;
let como;
let crearUsuario;

before(async () => {
  env = await crearEntorno();
  ({ db, como, crearUsuario } = env);
});
after(async () => {
  await db.close();
});

let contador = 0;
const correo = (nombre) => `${nombre}${++contador}@unjbg.edu.pe`;

/** Crea un vendedor con su emprendimiento (siempre queda 'pendiente'). */
async function crearVendedor(nombre = 'vendedor') {
  const id = await crearUsuario(correo(nombre));
  const emp = await como('authenticated', id, (d) =>
    uno(
      d,
      `insert into emprendimientos (usuario_id, nombre, descripcion, categoria_slug, whatsapp)
       values ($1, 'Mi negocio', 'Descripción de prueba', 'comida', '+51900000001') returning id, estado`,
      [id],
    ),
  );
  return { id, empId: emp.id };
}

/** Deja un negocio activo y vigente de la forma legítima: pago pendiente + validar_pago de un admin. */
async function activar({ id, empId }, admin) {
  const pago = await como('authenticated', id, (d) =>
    uno(
      d,
      `insert into pagos (emprendimiento_id, monto_reportado, comprobante_url)
       values ($1, 5, $2) returning id`,
      [empId, `${id}/comprobante.png`],
    ),
  );
  await como('authenticated', admin, (d) => d.query('select validar_pago($1)', [pago.id]));
  return pago.id;
}

const urlFoto = (userId) =>
  `https://abc.supabase.co/storage/v1/object/public/productos/${userId}/foto.png`;

async function publicarProducto({ id, empId }, nombre = 'Producto de prueba') {
  return como('authenticated', id, (d) =>
    uno(
      d,
      `insert into productos (emprendimiento_id, nombre, descripcion, precio, categoria_slug, imagenes)
       values ($1, $2, 'Descripción de prueba', 5, 'comida', $3) returning id`,
      [empId, nombre, [urlFoto(id)]],
    ),
  );
}

describe('perfiles: nadie se vuelve administrador ni cambia su correo', () => {
  test('un usuario no puede ponerse rol admin', async () => {
    const id = await crearUsuario(correo('estudiante'));
    await assert.rejects(
      como('authenticated', id, (d) => d.query(`update perfiles set rol = 'admin' where id = $1`, [id])),
      /No puedes cambiar tu rol/,
    );
    assert.equal((await uno(db, 'select rol from perfiles where id = $1', [id])).rol, 'consumidor');
    const es = await como('authenticated', id, (d) => uno(d, 'select es_admin() as es_admin'));
    assert.equal(es.es_admin, false);
  });

  test('no puede cambiar el correo guardado en su perfil, pero sí su nombre', async () => {
    const id = await crearUsuario(correo('estudiante'));
    await assert.rejects(
      como('authenticated', id, (d) => d.query(`update perfiles set email = 'otro@x.com' where id = $1`, [id])),
      /correo/,
    );
    await como('authenticated', id, (d) =>
      d.query(`update perfiles set nombre_completo = 'Nombre Nuevo' where id = $1`, [id]),
    );
    assert.equal((await uno(db, 'select nombre_completo from perfiles where id = $1', [id])).nombre_completo, 'Nombre Nuevo');
  });

  test('el SQL Editor / service role (sin sesión) sí puede asignar roles', async () => {
    const id = await crearUsuario(correo('futuro-admin'));
    await db.query(`update perfiles set rol = 'admin' where id = $1`, [id]);
    assert.equal((await uno(db, 'select rol from perfiles where id = $1', [id])).rol, 'admin');
  });

  test('un usuario no lee perfiles ajenos', async () => {
    const a = await crearUsuario(correo('a'));
    const b = await crearUsuario(correo('b'));
    const r = await como('authenticated', b, (d) => filas(d, 'select id from perfiles where id = $1', [a]));
    assert.equal(r.length, 0);
  });
});

describe('registro: solo correos @unjbg.edu.pe', () => {
  test('rechaza gmail y subdominios falsos', async () => {
    for (const email of ['cualquiera@gmail.com', 'x@fake.unjbg.edu.pe', 'x@unjbg.edu.pe.evil.com', '@unjbg.edu.pe', '']) {
      await assert.rejects(
        db.query('insert into auth.users (id, email) values (gen_random_uuid(), $1)', [email]),
        /correos @unjbg\.edu\.pe/,
        `debió rechazar «${email}»`,
      );
    }
  });

  test('acepta el correo institucional, también en mayúsculas', async () => {
    const id = await crearUsuario('Maria.Perez@UNJBG.EDU.PE');
    assert.equal((await uno(db, 'select count(*)::int as n from perfiles where id = $1', [id])).n, 1);
  });
});

describe('emprendimientos: el estado y la vigencia no los controla el dueño', () => {
  test('al crearlo siempre queda pendiente, aunque pida activo', async () => {
    const id = await crearUsuario(correo('vendedor'));
    const emp = await como('authenticated', id, (d) =>
      uno(
        d,
        `insert into emprendimientos (usuario_id, nombre, descripcion, categoria_slug, whatsapp, estado, activo_hasta)
         values ($1, 'Negocio', 'Descripción de prueba', 'comida', '+51900000002', 'activo', now() + interval '5 years')
         returning estado, activo_hasta`,
        [id],
      ),
    );
    assert.deepEqual({ ...emp }, { estado: 'pendiente', activo_hasta: null });
  });

  test('no puede activarse ni darse vigencia', async () => {
    const v = await crearVendedor();
    for (const set of [`estado = 'activo'`, `activo_hasta = now() + interval '1 year'`]) {
      await assert.rejects(
        como('authenticated', v.id, (d) => d.query(`update emprendimientos set ${set} where id = $1`, [v.empId])),
        /Solo un administrador/,
        set,
      );
    }
  });

  test('un negocio suspendido por un administrador no se reactiva solo', async () => {
    const v = await crearVendedor();
    await db.query(`update emprendimientos set estado = 'suspendido' where id = $1`, [v.empId]);
    await assert.rejects(
      como('authenticated', v.id, (d) => d.query(`update emprendimientos set estado = 'activo' where id = $1`, [v.empId])),
      /Solo un administrador/,
    );
  });

  test('sí puede editar sus datos comerciales', async () => {
    const v = await crearVendedor();
    await como('authenticated', v.id, (d) =>
      d.query(`update emprendimientos set nombre = 'Nuevo nombre' where id = $1`, [v.empId]),
    );
    assert.equal((await uno(db, 'select nombre from emprendimientos where id = $1', [v.empId])).nombre, 'Nuevo nombre');
  });

  test('el dueño no puede borrar su emprendimiento (arrastraría sus pagos); el administrador sí', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    await como('authenticated', v.id, (d) => d.query('delete from emprendimientos where id = $1', [v.empId]));
    assert.equal((await uno(db, 'select count(*)::int as n from emprendimientos where id = $1', [v.empId])).n, 1);
    await como('authenticated', admin, (d) => d.query('delete from emprendimientos where id = $1', [v.empId]));
    assert.equal((await uno(db, 'select count(*)::int as n from emprendimientos where id = $1', [v.empId])).n, 0);
  });
});

describe('emprendimientos: el dueño edita su perfil comercial', () => {
  test('cambia nombre, descripción, categoría y WhatsApp de una vez, y el negocio sigue activo con su vigencia', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    await activar(v, admin);
    const antes = await uno(db, 'select estado, activo_hasta from emprendimientos where id = $1', [v.empId]);

    const filasCambiadas = await como('authenticated', v.id, (d) =>
      filas(
        d,
        `update emprendimientos
            set nombre = 'Dulces Tacna', descripcion = 'Postres hechos a mano en el campus',
                categoria_slug = 'postres', whatsapp = '+51987654321'
          where id = $1 returning id`,
        [v.empId],
      ),
    );
    assert.equal(filasCambiadas.length, 1);

    const despues = await uno(db, 'select * from emprendimientos where id = $1', [v.empId]);
    assert.equal(despues.nombre, 'Dulces Tacna');
    assert.equal(despues.descripcion, 'Postres hechos a mano en el campus');
    assert.equal(despues.categoria_slug, 'postres');
    assert.equal(despues.whatsapp, '+51987654321');
    assert.equal(despues.estado, antes.estado);
    assert.equal(despues.estado, 'activo');
    assert.equal(String(despues.activo_hasta), String(antes.activo_hasta));
  });

  test('no puede cambiar el perfil de otra persona: la base de datos no actualiza ninguna fila', async () => {
    const duenio = await crearVendedor();
    const intruso = await crearVendedor('intruso');
    const filasCambiadas = await como('authenticated', intruso.id, (d) =>
      filas(d, `update emprendimientos set nombre = 'Hackeado' where id = $1 returning id`, [duenio.empId]),
    );
    assert.equal(filasCambiadas.length, 0);
    assert.equal((await uno(db, 'select nombre from emprendimientos where id = $1', [duenio.empId])).nombre, 'Mi negocio');
  });

  test('una categoría que no existe se rechaza', async () => {
    const v = await crearVendedor();
    await assert.rejects(
      como('authenticated', v.id, (d) =>
        d.query(`update emprendimientos set categoria_slug = 'no-existe' where id = $1`, [v.empId]),
      ),
      /categoria_slug|foreign key|viola/i,
    );
  });
});

describe('pagos: dos estados (pendiente / validado)', () => {
  test('la restricción de la tabla solo admite pendiente y validado', async () => {
    const v = await crearVendedor();
    for (const estado of ['aprobado', 'rechazado']) {
      await assert.rejects(
        db.query(
          `insert into pagos (emprendimiento_id, monto_reportado, comprobante_url, estado) values ($1, 5, 'x/y.png', $2)`,
          [v.empId, estado],
        ),
        /pagos_estado_check/,
      );
    }
  });

  test('el vendedor solo puede crear pagos pendientes y sin datos de revisión', async () => {
    const v = await crearVendedor();
    const intentos = [
      `estado, comprobante_url) values ($1, 5, 'validado', '${v.id}/a.png')`,
      `revisado_por, comprobante_url) values ($1, 5, '${v.id}', '${v.id}/a.png')`,
      `periodo_fin, comprobante_url) values ($1, 5, now() + interval '10 years', '${v.id}/a.png')`,
    ];
    const columnas = ['estado', 'revisado_por', 'periodo_fin'];
    for (const [i, resto] of intentos.entries()) {
      await assert.rejects(
        como('authenticated', v.id, (d) =>
          d.query(`insert into pagos (emprendimiento_id, monto_reportado, ${resto}`, [v.empId]),
        ),
        /row-level security/,
        `debió bloquear ${columnas[i]}`,
      );
    }
  });

  test('el comprobante debe estar en la carpeta del propio usuario', async () => {
    const v = await crearVendedor();
    const otro = await crearUsuario(correo('otro'));
    await assert.rejects(
      como('authenticated', v.id, (d) =>
        d.query(`insert into pagos (emprendimiento_id, monto_reportado, comprobante_url) values ($1, 5, $2)`, [
          v.empId,
          `${otro}/comprobante.png`,
        ]),
      ),
      /row-level security/,
    );
  });

  test('no puede pagar por el emprendimiento de otra persona', async () => {
    const v = await crearVendedor();
    const intruso = await crearUsuario(correo('intruso'));
    await assert.rejects(
      como('authenticated', intruso, (d) =>
        d.query(`insert into pagos (emprendimiento_id, monto_reportado, comprobante_url) values ($1, 5, $2)`, [
          v.empId,
          `${intruso}/c.png`,
        ]),
      ),
      /row-level security/,
    );
  });

  test('máximo 3 pagos pendientes a la vez', async () => {
    const v = await crearVendedor();
    const reportar = (i) =>
      como('authenticated', v.id, (d) =>
        d.query(`insert into pagos (emprendimiento_id, monto_reportado, comprobante_url) values ($1, 5, $2)`, [
          v.empId,
          `${v.id}/c${i}.png`,
        ]),
      );
    for (let i = 0; i < 3; i++) await reportar(i);
    await assert.rejects(reportar(3), /row-level security/);
  });

  test('el vendedor no puede editar sus pagos', async () => {
    const v = await crearVendedor();
    await como('authenticated', v.id, (d) =>
      d.query(`insert into pagos (emprendimiento_id, monto_reportado, comprobante_url) values ($1, 5, $2)`, [
        v.empId,
        `${v.id}/c.png`,
      ]),
    );
    const r = await como('authenticated', v.id, (d) => d.query(`update pagos set estado = 'validado' returning id`));
    assert.equal(r.rows.length, 0);
    assert.equal((await uno(db, 'select estado from pagos where emprendimiento_id = $1', [v.empId])).estado, 'pendiente');
  });

  test('no se ven los pagos de otras personas, pero sí los propios y el administrador ve todos', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const a = await crearVendedor('a');
    const b = await crearVendedor('b');
    for (const v of [a, b]) {
      await como('authenticated', v.id, (d) =>
        d.query(`insert into pagos (emprendimiento_id, monto_reportado, comprobante_url) values ($1, 5, $2)`, [
          v.empId,
          `${v.id}/c.png`,
        ]),
      );
    }
    assert.equal((await como('authenticated', a.id, (d) => filas(d, 'select id from pagos'))).length, 1);
    const todos = await como('authenticated', admin, (d) =>
      filas(d, 'select id from pagos where emprendimiento_id in ($1, $2)', [a.empId, b.empId]),
    );
    assert.equal(todos.length, 2);
  });
});

describe('validar_pago: una transacción, con vigencia', () => {
  test('un usuario normal no puede validar', async () => {
    const v = await crearVendedor();
    const pago = await como('authenticated', v.id, (d) =>
      uno(d, `insert into pagos (emprendimiento_id, monto_reportado, comprobante_url) values ($1, 5, $2) returning id`, [
        v.empId,
        `${v.id}/c.png`,
      ]),
    );
    await assert.rejects(
      como('authenticated', v.id, (d) => d.query('select validar_pago($1)', [pago.id])),
      /Solo un administrador/,
    );
    await assert.rejects(como('anon', null, (d) => d.query('select validar_pago($1)', [pago.id])), /permission denied/);
  });

  test('el administrador valida: pago validado, negocio activo y un mes de vigencia', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    const pagoId = await activar(v, admin);
    const pago = await uno(db, 'select estado, revisado_por, periodo_inicio, periodo_fin from pagos where id = $1', [pagoId]);
    assert.equal(pago.estado, 'validado');
    assert.equal(pago.revisado_por, admin);
    const emp = await uno(
      db,
      `select estado, activo_hasta, (activo_hasta - now()) between interval '27 days' and interval '32 days' as un_mes
         from emprendimientos where id = $1`,
      [v.empId],
    );
    assert.equal(emp.estado, 'activo');
    assert.equal(emp.un_mes, true);
    assert.equal(new Date(pago.periodo_fin).getTime(), new Date(emp.activo_hasta).getTime());
  });

  test('no se puede validar dos veces el mismo pago', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    const pagoId = await activar(v, admin);
    await assert.rejects(
      como('authenticated', admin, (d) => d.query('select validar_pago($1)', [pagoId])),
      /ya fue validado/,
    );
  });

  test('un segundo pago suma un mes al final de la vigencia (renovación)', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    await activar(v, admin);
    const antes = await uno(db, 'select activo_hasta from emprendimientos where id = $1', [v.empId]);
    await activar(v, admin);
    const despues = await uno(
      db,
      `select activo_hasta, (activo_hasta - $2::timestamptz) between interval '27 days' and interval '32 days' as suma_un_mes
         from emprendimientos where id = $1`,
      [v.empId, antes.activo_hasta],
    );
    assert.equal(despues.suma_un_mes, true);
  });

  test('un negocio suspendido no se reactiva validando un pago', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    await db.query(`update emprendimientos set estado = 'suspendido' where id = $1`, [v.empId]);
    await assert.rejects(activar(v, admin), /suspendido/);
    assert.equal((await uno(db, 'select estado from emprendimientos where id = $1', [v.empId])).estado, 'suspendido');
  });
});

describe('catálogo público: solo negocios activos con suscripción vigente', () => {
  test('un negocio pendiente no se ve, ni sus productos por la API', async () => {
    const v = await crearVendedor();
    await publicarProducto(v);
    assert.equal((await como('anon', null, (d) => filas(d, 'select id from emprendimientos where id = $1', [v.empId]))).length, 0);
    assert.equal((await como('anon', null, (d) => filas(d, 'select id from productos where emprendimiento_id = $1', [v.empId]))).length, 0);
  });

  test('con el pago validado se ven el negocio y el producto disponible', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    await publicarProducto(v);
    await activar(v, admin);
    assert.equal((await como('anon', null, (d) => filas(d, 'select id from emprendimientos where id = $1', [v.empId]))).length, 1);
    assert.equal((await como('anon', null, (d) => filas(d, 'select id from productos where emprendimiento_id = $1', [v.empId]))).length, 1);
  });

  test('un producto no disponible solo lo ve su dueño', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    const p = await publicarProducto(v);
    await activar(v, admin);
    await como('authenticated', v.id, (d) => d.query('update productos set disponible = false where id = $1', [p.id]));
    assert.equal((await como('anon', null, (d) => filas(d, 'select id from productos where id = $1', [p.id]))).length, 0);
    assert.equal((await como('authenticated', v.id, (d) => filas(d, 'select id from productos where id = $1', [p.id]))).length, 1);
  });

  test('vencida la vigencia, desaparece del público pero el dueño sigue viéndolo', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    await publicarProducto(v);
    await activar(v, admin);
    await db.query(`update emprendimientos set activo_hasta = now() - interval '1 day' where id = $1`, [v.empId]);
    assert.equal((await como('anon', null, (d) => filas(d, 'select id from productos where emprendimiento_id = $1', [v.empId]))).length, 0);
    assert.equal((await como('authenticated', v.id, (d) => filas(d, 'select id from emprendimientos where id = $1', [v.empId]))).length, 1);
  });

  test('suspendido: desaparece del público aunque conserve la vigencia', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    await publicarProducto(v);
    await activar(v, admin);
    await como('authenticated', admin, (d) => d.query(`update emprendimientos set estado = 'suspendido' where id = $1`, [v.empId]));
    assert.equal((await como('anon', null, (d) => filas(d, 'select id from productos where emprendimiento_id = $1', [v.empId]))).length, 0);
  });

  test('vencer_suscripciones() marca como vencido lo caducado y solo la puede ejecutar el sistema', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    await activar(v, admin);
    await db.query(`update emprendimientos set activo_hasta = now() - interval '1 day' where id = $1`, [v.empId]);
    await assert.rejects(como('authenticated', admin, (d) => d.query('select vencer_suscripciones()')), /permission denied/);
    await db.query('select vencer_suscripciones()');
    assert.equal((await uno(db, 'select estado from emprendimientos where id = $1', [v.empId])).estado, 'vencido');
  });
});

describe('productos: fotos solo de nuestro almacenamiento y de la carpeta del dueño', () => {
  test('rechaza imágenes de otros sitios o de la carpeta de otra persona', async () => {
    const v = await crearVendedor();
    const otro = await crearUsuario(correo('otro'));
    for (const url of ['https://evil.example/x.png', 'javascript:alert(1)', urlFoto(otro)]) {
      await assert.rejects(
        como('authenticated', v.id, (d) =>
          d.query(
            `insert into productos (emprendimiento_id, nombre, descripcion, precio, categoria_slug, imagenes)
             values ($1, 'P', 'Descripción de prueba', 5, 'comida', $2)`,
            [v.empId, [url]],
          ),
        ),
        /fotos deben subirse/,
        url,
      );
    }
  });

  test('acepta productos sin fotos (servicios) y con fotos propias', async () => {
    const v = await crearVendedor();
    await como('authenticated', v.id, (d) =>
      d.query(
        `insert into productos (emprendimiento_id, tipo, nombre, descripcion, precio, categoria_slug, imagenes)
         values ($1, 'servicio', 'Tutorías', 'Descripción de prueba', 20, 'servicios-academicos', '{}')`,
        [v.empId],
      ),
    );
    await publicarProducto(v);
  });

  test('nadie publica productos en el negocio de otra persona', async () => {
    const v = await crearVendedor();
    const intruso = await crearUsuario(correo('intruso'));
    await assert.rejects(
      como('authenticated', intruso, (d) =>
        d.query(
          `insert into productos (emprendimiento_id, nombre, descripcion, precio, categoria_slug, imagenes)
           values ($1, 'P', 'Descripción de prueba', 5, 'comida', '{}')`,
          [v.empId],
        ),
      ),
      /row-level security/,
    );
  });
});

describe('productos: el dueño edita, oculta y borra los suyos', () => {
  test('el dueño cambia los datos de su publicación', async () => {
    const v = await crearVendedor();
    const p = await publicarProducto(v);
    const cambiado = await como('authenticated', v.id, (d) =>
      uno(
        d,
        `update productos set nombre = 'Nombre nuevo', precio = 9.5, tipo = 'servicio', imagenes = '{}'
          where id = $1 returning nombre, precio, tipo, imagenes`,
        [p.id],
      ),
    );
    assert.equal(cambiado.nombre, 'Nombre nuevo');
    assert.equal(Number(cambiado.precio), 9.5);
    assert.equal(cambiado.tipo, 'servicio');
    assert.deepEqual(cambiado.imagenes, []);
  });

  test('al editar tampoco se admiten fotos ajenas ni de otros sitios', async () => {
    const v = await crearVendedor();
    const otro = await crearUsuario(correo('otro'));
    const p = await publicarProducto(v);
    for (const url of ['https://evil.example/x.png', urlFoto(otro)]) {
      await assert.rejects(
        como('authenticated', v.id, (d) => d.query('update productos set imagenes = $2 where id = $1', [p.id, [url]])),
        /fotos deben subirse/,
        url,
      );
    }
  });

  test('otra persona no edita, oculta ni borra publicaciones ajenas (no cambia ninguna fila)', async () => {
    const v = await crearVendedor();
    const intruso = await crearVendedor('intruso');
    const p = await publicarProducto(v);
    const editadas = await como('authenticated', intruso.id, (d) =>
      filas(d, `update productos set nombre = 'Hackeado', disponible = false where id = $1 returning id`, [p.id]),
    );
    assert.equal(editadas.length, 0);
    const borradas = await como('authenticated', intruso.id, (d) =>
      filas(d, 'delete from productos where id = $1 returning id', [p.id]),
    );
    assert.equal(borradas.length, 0);
    const intacto = await uno(db, 'select nombre, disponible from productos where id = $1', [p.id]);
    assert.deepEqual(intacto, { nombre: 'Producto de prueba', disponible: true });
  });

  test('ocultar quita la publicación del catálogo y mostrarla la devuelve', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    const p = await publicarProducto(v);
    await activar(v, admin);
    const visible = () => como('anon', null, (d) => filas(d, 'select id from productos where id = $1', [p.id]));
    assert.equal((await visible()).length, 1);
    await como('authenticated', v.id, (d) => d.query('update productos set disponible = false where id = $1', [p.id]));
    assert.equal((await visible()).length, 0);
    await como('authenticated', v.id, (d) => d.query('update productos set disponible = true where id = $1', [p.id]));
    assert.equal((await visible()).length, 1);
  });

  test('el dueño borra su publicación y devuelve sus fotos; el administrador también puede borrar', async () => {
    const admin = await crearUsuario(correo('admin'), { admin: true });
    const v = await crearVendedor();
    const p1 = await publicarProducto(v, 'Para borrar');
    const p2 = await publicarProducto(v, 'Para que borre el admin');
    const borrada = await como('authenticated', v.id, (d) =>
      uno(d, 'delete from productos where id = $1 returning imagenes', [p1.id]),
    );
    assert.deepEqual(borrada.imagenes, [urlFoto(v.id)]);
    const porAdmin = await como('authenticated', admin, (d) => filas(d, 'delete from productos where id = $1 returning id', [p2.id]));
    assert.equal(porAdmin.length, 1);
    assert.equal((await filas(db, 'select id from productos where emprendimiento_id = $1', [v.empId])).length, 0);
  });
});

describe('storage', () => {
  test('cada usuario solo escribe en su carpeta y no lee comprobantes ajenos', async () => {
    const a = await crearUsuario(correo('a'));
    const b = await crearUsuario(correo('b'));
    await como('authenticated', a, (d) => d.query(`insert into storage.objects (bucket_id, name) values ('productos', $1)`, [`${a}/x.png`]));
    await assert.rejects(
      como('authenticated', a, (d) => d.query(`insert into storage.objects (bucket_id, name) values ('productos', $1)`, [`${b}/x.png`])),
      /row-level security/,
    );
    await como('authenticated', b, (d) => d.query(`insert into storage.objects (bucket_id, name) values ('comprobantes', $1)`, [`${b}/c.png`]));
    assert.equal(
      (await como('authenticated', a, (d) => filas(d, `select name from storage.objects where bucket_id = 'comprobantes'`))).length,
      0,
    );
  });

  test('los buckets solo admiten imágenes de hasta 5 MB', async () => {
    const buckets = await filas(db, 'select id, file_size_limit::int as limite, allowed_mime_types from storage.buckets order by id');
    assert.equal(buckets.length, 3);
    for (const b of buckets) {
      assert.equal(b.limite, 5 * 1024 * 1024, b.id);
      assert.ok(b.allowed_mime_types.every((t) => t.startsWith('image/')), b.id);
      assert.ok(!b.allowed_mime_types.includes('image/svg+xml'), b.id);
    }
  });
});

// ---------------------------------------------------------------------------------------------
// RF09: visitas y estadísticas (migración 0006)
// ---------------------------------------------------------------------------------------------
const visitante = (n) => `visitante-${n}-abcdef`; // la base exige entre 8 y 64 caracteres

/** Negocio activo y vigente con un producto publicado. */
async function negocioActivoConProducto(admin, nombreProducto = 'Producto de prueba') {
  const v = await crearVendedor();
  await activar(v, admin);
  const producto = await publicarProducto(v, nombreProducto);
  return { ...v, productoId: producto.id };
}

/** Llama a registrar_visita como el rol indicado y devuelve si la visita se contó. */
async function visitar(rol, uid, { empId, tipo, productoId = null, visitanteId = null }) {
  const fila = await como(rol, uid, (d) =>
    uno(d, 'select registrar_visita($1, $2, $3, $4) as contada', [empId, tipo, productoId, visitanteId]),
  );
  return fila.contada;
}

const contarVisitas = async (empId) =>
  Number((await uno(db, 'select count(*)::int as n from visitas where emprendimiento_id = $1', [empId])).n);

/** Inserta una visita con fecha fija (como lo haría el service role o el SQL Editor). */
async function insertarVisita(empId, tipo, productoId, cuando = 'now()') {
  await db.query(
    `insert into visitas (emprendimiento_id, producto_id, tipo, visitado_en) values ($1, $2, $3, ${cuando})`,
    [empId, productoId, tipo],
  );
}

/** Un instante de «ayer» a la hora de Lima indicada (p. ej. '13 hours 30 minutes' = 13:30). */
const ayerEnLima = (hora) =>
  `((date_trunc('day', now() at time zone 'America/Lima') - interval '1 day') + interval '${hora}') at time zone 'America/Lima'`;

/** Un instante de «hoy» a la hora de Lima indicada (puede quedar en el futuro: solo cuenta la fecha). */
const hoyEnLima = (hora) =>
  `(date_trunc('day', now() at time zone 'America/Lima') + interval '${hora}') at time zone 'America/Lima'`;

async function estadisticas(rol, uid, empId, dias) {
  const fila = await como(rol, uid, (d) =>
    uno(d, 'select estadisticas_emprendimiento($1, $2) as e', dias === undefined ? [empId, 30] : [empId, dias]),
  );
  return fila.e;
}

describe('visitas: solo se registran con registrar_visita() y solo lo que el público ve', () => {
  let admin;
  before(async () => {
    admin = await crearUsuario(correo('admin'), { admin: true });
  });

  test('cuenta las visitas de cualquiera, también sin cuenta: perfil, producto y contacto', async () => {
    const n = await negocioActivoConProducto(admin);
    assert.equal(await visitar('anon', null, { empId: n.empId, tipo: 'perfil' }), true);
    assert.equal(await visitar('anon', null, { empId: n.empId, tipo: 'producto', productoId: n.productoId }), true);
    const consumidor = await crearUsuario(correo('comprador'));
    assert.equal(
      await visitar('authenticated', consumidor, { empId: n.empId, tipo: 'contacto', productoId: n.productoId }),
      true,
    );
    assert.equal(await contarVisitas(n.empId), 3);
  });

  test('no cuenta negocios que el público no ve: pendiente, vencido ni suspendido', async () => {
    const pendiente = await crearVendedor();
    assert.equal(await visitar('anon', null, { empId: pendiente.empId, tipo: 'perfil' }), false);

    const vencido = await negocioActivoConProducto(admin);
    await db.query(`update emprendimientos set activo_hasta = now() - interval '1 day' where id = $1`, [vencido.empId]);
    assert.equal(await visitar('anon', null, { empId: vencido.empId, tipo: 'perfil' }), false);

    const suspendido = await negocioActivoConProducto(admin);
    await db.query(`update emprendimientos set estado = 'suspendido' where id = $1`, [suspendido.empId]);
    assert.equal(await visitar('anon', null, { empId: suspendido.empId, tipo: 'perfil' }), false);

    for (const n of [pendiente, vencido, suspendido]) assert.equal(await contarVisitas(n.empId), 0);
  });

  test('un negocio que no existe no es un error: simplemente no cuenta', async () => {
    const inexistente = '00000000-0000-4000-8000-000000000999';
    assert.equal(await visitar('anon', null, { empId: inexistente, tipo: 'perfil' }), false);
  });

  test('las visitas del propio dueño a su negocio no cuentan', async () => {
    const n = await negocioActivoConProducto(admin);
    assert.equal(await visitar('authenticated', n.id, { empId: n.empId, tipo: 'perfil' }), false);
    assert.equal(
      await visitar('authenticated', n.id, { empId: n.empId, tipo: 'producto', productoId: n.productoId }),
      false,
    );
    assert.equal(await contarVisitas(n.empId), 0);
  });

  test('un producto ajeno, oculto o inexistente no cuenta; un tipo inválido o sin producto da error', async () => {
    const a = await negocioActivoConProducto(admin, 'Producto de A');
    const b = await negocioActivoConProducto(admin, 'Producto de B');
    // el producto de B no se puede atribuir al negocio A
    assert.equal(await visitar('anon', null, { empId: a.empId, tipo: 'producto', productoId: b.productoId }), false);
    // producto inexistente
    assert.equal(
      await visitar('anon', null, { empId: a.empId, tipo: 'producto', productoId: '00000000-0000-4000-8000-000000000998' }),
      false,
    );
    // producto oculto
    await db.query('update productos set disponible = false where id = $1', [a.productoId]);
    assert.equal(await visitar('anon', null, { empId: a.empId, tipo: 'producto', productoId: a.productoId }), false);
    assert.equal(await contarVisitas(a.empId), 0);

    await assert.rejects(visitar('anon', null, { empId: a.empId, tipo: 'compra' }), /Tipo de visita no válido/);
    await assert.rejects(visitar('anon', null, { empId: a.empId, tipo: 'producto' }), /debe indicar el producto/);
  });

  test('el mismo visitante no suma dos veces seguidas; otro visitante, otro producto o pasados 30 minutos sí', async () => {
    const n = await negocioActivoConProducto(admin);
    const base = { empId: n.empId, tipo: 'producto', productoId: n.productoId };
    assert.equal(await visitar('anon', null, { ...base, visitanteId: visitante(1) }), true);
    assert.equal(await visitar('anon', null, { ...base, visitanteId: visitante(1) }), false, 'repetida');
    assert.equal(await visitar('anon', null, { ...base, visitanteId: visitante(2) }), true, 'otro visitante');
    assert.equal(
      await visitar('anon', null, { empId: n.empId, tipo: 'perfil', visitanteId: visitante(1) }),
      true,
      'otro tipo de visita',
    );
    // pasados 30 minutos vuelve a contar
    await db.query(`update visitas set visitado_en = now() - interval '31 minutes' where visitante = $1`, [visitante(1)]);
    assert.equal(await visitar('anon', null, { ...base, visitanteId: visitante(1) }), true, 'pasados 31 minutos');
  });

  test('sin identificador de visitante (o con uno demasiado corto) siempre cuenta', async () => {
    const n = await negocioActivoConProducto(admin);
    assert.equal(await visitar('anon', null, { empId: n.empId, tipo: 'perfil' }), true);
    assert.equal(await visitar('anon', null, { empId: n.empId, tipo: 'perfil' }), true);
    assert.equal(await visitar('anon', null, { empId: n.empId, tipo: 'perfil', visitanteId: 'corto' }), true);
    assert.equal(await contarVisitas(n.empId), 3);
    const guardados = await filas(db, 'select visitante from visitas where emprendimiento_id = $1', [n.empId]);
    assert.ok(guardados.every((f) => f.visitante === null));
  });

  test('nadie escribe, edita ni borra visitas directamente desde la API', async () => {
    const n = await negocioActivoConProducto(admin);
    await visitar('anon', null, { empId: n.empId, tipo: 'perfil' });
    const otro = await crearUsuario(correo('curioso'));
    for (const [rol, uid] of [['anon', null], ['authenticated', otro], ['authenticated', n.id], ['authenticated', admin]]) {
      await assert.rejects(
        como(rol, uid, (d) => d.query(`insert into visitas (emprendimiento_id, tipo) values ($1, 'perfil')`, [n.empId])),
        /permission denied/,
        `insertar como ${rol}`,
      );
      await assert.rejects(
        como(rol, uid, (d) => d.query(`update visitas set tipo = 'contacto' where emprendimiento_id = $1`, [n.empId])),
        /permission denied/,
        `editar como ${rol}`,
      );
      await assert.rejects(
        como(rol, uid, (d) => d.query('delete from visitas where emprendimiento_id = $1', [n.empId])),
        /permission denied/,
        `borrar como ${rol}`,
      );
    }
    assert.equal(await contarVisitas(n.empId), 1);
  });

  test('solo el dueño y el administrador leen las visitas', async () => {
    const n = await negocioActivoConProducto(admin);
    const otro = await negocioActivoConProducto(admin);
    await visitar('anon', null, { empId: n.empId, tipo: 'perfil' });
    await visitar('anon', null, { empId: otro.empId, tipo: 'perfil' });

    const leer = (rol, uid) => como(rol, uid, (d) => filas(d, 'select emprendimiento_id from visitas'));
    const propias = await leer('authenticated', n.id);
    assert.ok(propias.length >= 1 && propias.every((f) => f.emprendimiento_id === n.empId), 'el dueño solo ve las suyas');
    const comoAdmin = await leer('authenticated', admin);
    const ids = new Set(comoAdmin.map((f) => f.emprendimiento_id));
    assert.ok(ids.has(n.empId) && ids.has(otro.empId), 'el administrador ve las de todos');
    const curioso = await crearUsuario(correo('curioso'));
    assert.deepEqual(await leer('authenticated', curioso), [], 'otra persona no ve nada');
    await assert.rejects(leer('anon', null), /permission denied/);
  });

  test('las visitas se borran con el emprendimiento, pero no al borrar un producto', async () => {
    const n = await negocioActivoConProducto(admin);
    await visitar('anon', null, { empId: n.empId, tipo: 'producto', productoId: n.productoId });
    await db.query('delete from productos where id = $1', [n.productoId]);
    assert.equal(await contarVisitas(n.empId), 1, 'el historial se conserva');
    const fila = await uno(db, 'select producto_id from visitas where emprendimiento_id = $1', [n.empId]);
    assert.equal(fila.producto_id, null);
    await como('authenticated', admin, (d) => d.query('delete from emprendimientos where id = $1', [n.empId]));
    assert.equal(await contarVisitas(n.empId), 0);
  });
});

describe('estadisticas_emprendimiento: totales, días, horas pico y productos más vistos', () => {
  let admin;
  before(async () => {
    admin = await crearUsuario(correo('admin'), { admin: true });
  });

  test('sin visitas: todo en cero, 30 días y 24 horas de relleno, sin hora pico', async () => {
    const n = await negocioActivoConProducto(admin);
    const e = await estadisticas('authenticated', n.id, n.empId);
    assert.equal(e.dias, 30);
    assert.equal(e.visitas_perfil + e.visitas_productos + e.contactos, 0);
    assert.equal(e.por_dia.length, 30);
    assert.equal(e.por_hora.length, 24);
    assert.equal(e.hora_pico, null);
    assert.deepEqual(e.productos, []);
    const hoy = (await uno(db, `select (now() at time zone 'America/Lima')::date::text as hoy`)).hoy;
    assert.equal(e.hasta, hoy);
    assert.equal(e.por_dia.at(-1).dia, hoy);
    assert.ok(e.por_dia.every((d) => d.visitas === 0 && d.contactos === 0));
  });

  test('cuenta por tipo, por día y por hora de Lima, y arma el ranking de productos', async () => {
    const n = await negocioActivoConProducto(admin, 'Brownies');
    const segundo = await publicarProducto(n, 'Galletas');
    // ayer a las 13:xx (Lima): 3 visitas; a las 09:xx: 1 visita; hoy: 1 visita al perfil; 2 contactos
    for (const hora of ['13 hours 5 minutes', '13 hours 30 minutes', '13 hours 55 minutes']) {
      await insertarVisita(n.empId, 'producto', n.productoId, ayerEnLima(hora));
    }
    await insertarVisita(n.empId, 'producto', segundo.id, ayerEnLima('9 hours 10 minutes'));
    await insertarVisita(n.empId, 'perfil', null, hoyEnLima('2 hours'));
    await insertarVisita(n.empId, 'contacto', n.productoId, ayerEnLima('13 hours 40 minutes'));
    await insertarVisita(n.empId, 'contacto', segundo.id, hoyEnLima('2 hours 30 minutes'));

    const e = await estadisticas('authenticated', n.id, n.empId);
    assert.equal(e.visitas_perfil, 1);
    assert.equal(e.visitas_productos, 4);
    assert.equal(e.contactos, 2);
    assert.equal(e.hora_pico, 13, 'la hora pico es en hora de Lima, no en UTC');
    assert.equal(e.por_hora.find((h) => h.hora === 13).visitas, 3);
    assert.equal(e.por_hora.find((h) => h.hora === 9).visitas, 1);
    assert.equal(e.por_hora.reduce((suma, h) => suma + h.visitas, 0), 5, 'los contactos no cuentan como visitas');

    const ayer = e.por_dia.at(-2);
    assert.equal(ayer.visitas, 4);
    assert.equal(ayer.contactos, 1);
    assert.equal(e.por_dia.at(-1).visitas, 1);
    assert.equal(e.por_dia.at(-1).contactos, 1);

    assert.equal(e.productos[0].nombre, 'Brownies');
    assert.equal(e.productos[0].visitas, 3);
    assert.equal(e.productos[0].contactos, 1);
    assert.equal(e.productos[1].nombre, 'Galletas');
    assert.equal(e.productos[1].visitas, 1);
  });

  test('en un empate de horas gana la más temprana', async () => {
    const n = await negocioActivoConProducto(admin);
    await insertarVisita(n.empId, 'perfil', null, ayerEnLima('15 hours'));
    await insertarVisita(n.empId, 'perfil', null, ayerEnLima('11 hours'));
    const e = await estadisticas('authenticated', n.id, n.empId);
    assert.equal(e.hora_pico, 11);
  });

  test('el periodo se respeta: lo anterior queda fuera y entra al ampliarlo', async () => {
    const n = await negocioActivoConProducto(admin);
    await insertarVisita(n.empId, 'perfil', null, `now() - interval '40 days'`);
    await insertarVisita(n.empId, 'perfil', null, `now() - interval '3 days'`);
    assert.equal((await estadisticas('authenticated', n.id, n.empId, 30)).visitas_perfil, 1);
    assert.equal((await estadisticas('authenticated', n.id, n.empId, 2)).visitas_perfil, 0);
    assert.equal((await estadisticas('authenticated', n.id, n.empId, 90)).visitas_perfil, 2);
  });

  test('el periodo se limita entre 1 y 365 días', async () => {
    const n = await negocioActivoConProducto(admin);
    assert.equal((await estadisticas('authenticated', n.id, n.empId, 0)).por_dia.length, 1);
    assert.equal((await estadisticas('authenticated', n.id, n.empId, -5)).por_dia.length, 1);
    assert.equal((await estadisticas('authenticated', n.id, n.empId, 99999)).por_dia.length, 365);
  });

  test('una visita se sigue contando en las estadísticas aunque el producto se borre', async () => {
    const n = await negocioActivoConProducto(admin, 'Temporal');
    await visitar('anon', null, { empId: n.empId, tipo: 'producto', productoId: n.productoId });
    await db.query('delete from productos where id = $1', [n.productoId]);
    const e = await estadisticas('authenticated', n.id, n.empId);
    assert.equal(e.visitas_productos, 1);
    assert.deepEqual(e.productos, [], 'ya no aparece en el ranking');
  });

  test('solo el dueño y el administrador consultan; los demás reciben un error', async () => {
    const n = await negocioActivoConProducto(admin);
    await visitar('anon', null, { empId: n.empId, tipo: 'perfil' });
    assert.equal((await estadisticas('authenticated', n.id, n.empId)).visitas_perfil, 1);
    assert.equal((await estadisticas('authenticated', admin, n.empId)).visitas_perfil, 1);

    const curioso = await crearUsuario(correo('curioso'));
    await assert.rejects(estadisticas('authenticated', curioso, n.empId), /No tienes acceso/);
    await assert.rejects(estadisticas('anon', null, n.empId), /permission denied/);
    const inexistente = '00000000-0000-4000-8000-000000000997';
    await assert.rejects(estadisticas('authenticated', admin, inexistente), /No tienes acceso/);
  });
});
