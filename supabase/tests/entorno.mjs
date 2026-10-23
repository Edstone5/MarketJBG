// Entorno de pruebas para las migraciones de Supabase: un Postgres en memoria (PGlite) con lo mínimo
// de Supabase que usan las migraciones (esquemas auth y storage, roles anon/authenticated, auth.uid()
// y los privilegios por defecto). Es una aproximación: no incluye GoTrue ni PostgREST.
import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function crearEntorno() {
  const db = new PGlite();

  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      raw_user_meta_data jsonb default '{}'
    );
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create schema storage;
    create table storage.buckets (
      id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]
    );
    create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql as
      $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    grant usage on schema public, auth, storage to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    grant execute on function storage.foldername(text) to anon, authenticated;
    grant all on all tables in schema storage to anon, authenticated;
    -- Supabase concede todo por defecto sobre lo que se crea en public; RLS y los REVOKE de las
    -- migraciones son lo que restringe.
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
  `);

  const archivos = readdirSync(join(RAIZ, 'migrations')).filter((f) => f.endsWith('.sql')).sort();
  for (const archivo of archivos) {
    const sql = readFileSync(join(RAIZ, 'migrations', archivo), 'utf8')
      // PGlite no trae pgcrypto; gen_random_uuid() ya es nativo desde PostgreSQL 13.
      .replace('create extension if not exists "pgcrypto";', '');
    try {
      await db.exec(sql);
    } catch (error) {
      throw new Error(`Falló la migración ${archivo}: ${error.message}`);
    }
  }
  await db.exec(readFileSync(join(RAIZ, 'seed', 'seed.sql'), 'utf8'));

  /** Ejecuta `fn` como el rol de Supabase indicado (anon/authenticated) y el usuario `uid`. */
  async function como(rol, uid, fn) {
    await db.exec(`set role ${rol}; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
    try {
      return await fn(db);
    } finally {
      await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
    }
  }

  /** Crea un usuario en auth.users (el disparador crea su perfil). */
  async function crearUsuario(email, { admin = false } = {}) {
    const id = randomUUID();
    await db.query('insert into auth.users (id, email) values ($1, $2)', [id, email]);
    if (admin) await db.query(`update perfiles set rol = 'admin' where id = $1`, [id]);
    return id;
  }

  return { db, como, crearUsuario };
}

export const uno = async (db, sql, params) => (await db.query(sql, params)).rows[0];
export const filas = async (db, sql, params) => (await db.query(sql, params)).rows;
