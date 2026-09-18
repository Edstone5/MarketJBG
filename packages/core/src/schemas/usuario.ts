import { z } from 'zod';
import { DOMINIO_INSTITUCIONAL, ROLES } from '../constants/roles';

/**
 * Perfil extendido del usuario (tabla `perfiles`, 1:1 con `auth.users` de Supabase).
 */
export const perfilSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  nombreCompleto: z.string().min(3).max(120),
  rol: z.enum(ROLES).default('consumidor'),
  escuelaProfesional: z.string().max(120).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  telefonoWhatsapp: z
    .string()
    .regex(/^\+?[0-9]{9,15}$/, 'Número de WhatsApp inválido')
    .nullable()
    .optional(),
  creadoEn: z.string().datetime().optional(),
});

export type Perfil = z.infer<typeof perfilSchema>;

/** Valida que el correo pertenezca al dominio institucional de la UNJBG. */
export const emailInstitucionalSchema = z
  .string()
  .email('Ingresa un correo válido')
  .toLowerCase()
  .refine((email) => email.endsWith(DOMINIO_INSTITUCIONAL), {
    message: `El correo debe pertenecer al dominio ${DOMINIO_INSTITUCIONAL}`,
  });

export const registroSchema = z.object({
  email: emailInstitucionalSchema,
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombreCompleto: z.string().min(3).max(120),
});

export type RegistroInput = z.infer<typeof registroSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export type LoginInput = z.infer<typeof loginSchema>;
