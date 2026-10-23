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
        `insert into emprendimientos (usuario_id, nombre, descripcion, categoria_slug, whatsapp, estado, vistas, activo_hasta)
         values ($1, 'Negocio', 'Descripción de prueba', 'comida', '+51900000002', 'activo', 999, now() + interval '5 years')
         returning estado, vistas, activo_hasta`,
        [id],
      ),
    );
    assert.deepEqual({ ...emp }, { estado: 'pendiente', vistas: 0, activo_hasta: null });
  });

  test('no puede activarse, ni darse vigencia, ni inflar las vistas', async () => {
    const v = await crearVendedor();
    for (const set of [`estado = 'activo'`, `activo_hasta = now() + interval '1 year'`, 'vistas = 999999']) {
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
