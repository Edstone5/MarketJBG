/**
 * Roles del sistema. Un usuario autenticado siempre tiene un rol base
 * ("consumidor") y puede además ser dueño de un emprendimiento, lo que
 * habilita las vistas y permisos de "emprendedor". "admin" se asigna
 * manualmente en Supabase a los moderadores institucionales.
 */
export const ROLES = ['consumidor', 'emprendedor', 'admin'] as const;
export type Rol = (typeof ROLES)[number];

/** Dominio de correo institucional exigido para crear un perfil comercial. */
export const DOMINIO_INSTITUCIONAL = '@unjbg.edu.pe';
