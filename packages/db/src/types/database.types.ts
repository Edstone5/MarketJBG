/**
 * Tipos de la base de datos, escritos a mano para reflejar
 * supabase/migrations/*.sql (0001 a 0006).
 *
 * En cuanto el proyecto tenga una instancia real de Supabase, reemplaza
 * este archivo generándolo automáticamente con:
 *   pnpm --filter @emprende/db gen:types
 * (requiere la Supabase CLI y `supabase start` corriendo localmente).
 */
export type Rol = 'consumidor' | 'emprendedor' | 'admin';
export type EstadoEmprendimiento = 'activo' | 'pendiente' | 'vencido' | 'suspendido';
export type EstadoPago = 'pendiente' | 'validado';
export type TipoProducto = 'producto' | 'servicio';
export type TipoVisita = 'perfil' | 'producto' | 'contacto';

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: {
      /** Valida un pago pendiente y activa el emprendimiento un mes (solo administradores). */
      validar_pago: {
        Args: { p_pago_id: string };
        Returns: Database['public']['Tables']['pagos']['Row'];
      };
      /** Cuenta una visita (cualquiera, también sin cuenta). Devuelve si se contó. */
      registrar_visita: {
        Args: {
          p_emprendimiento_id: string;
          p_tipo: TipoVisita;
          p_producto_id?: string | null;
          p_visitante?: string | null;
        };
        Returns: boolean;
      };
      /** Estadísticas de un emprendimiento (solo su dueño o un administrador). Ver `estadisticasSchema` en core. */
      estadisticas_emprendimiento: {
        Args: { p_emprendimiento_id: string; p_dias?: number };
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      categorias: {
        Row: { slug: string; nombre: string; icono: string };
        Insert: { slug: string; nombre: string; icono: string };
        Update: Partial<{ slug: string; nombre: string; icono: string }>;
        Relationships: [];
      };
      perfiles: {
        Row: {
          id: string;
          email: string;
          nombre_completo: string;
          rol: Rol;
          escuela_profesional: string | null;
          avatar_url: string | null;
          telefono_whatsapp: string | null;
          creado_en: string;
        };
        Insert: {
          id: string;
          email: string;
          nombre_completo: string;
          rol?: Rol;
          escuela_profesional?: string | null;
          avatar_url?: string | null;
          telefono_whatsapp?: string | null;
        };
        Update: Partial<Database['public']['Tables']['perfiles']['Insert']>;
        Relationships: [];
      };
      emprendimientos: {
        Row: {
          id: string;
          usuario_id: string;
          nombre: string;
          descripcion: string;
          categoria_slug: string;
          logo_url: string | null;
          whatsapp: string;
          estado: EstadoEmprendimiento;
          /** Fin de la suscripción vigente; sin ella (o vencida) el negocio no es público. */
          activo_hasta: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          nombre: string;
          descripcion: string;
          categoria_slug: string;
          logo_url?: string | null;
          whatsapp: string;
          estado?: EstadoEmprendimiento;
          activo_hasta?: string | null;
        };
        Update: Partial<Database['public']['Tables']['emprendimientos']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'emprendimientos_usuario_id_fkey';
            columns: ['usuario_id'];
            isOneToOne: true;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'emprendimientos_categoria_slug_fkey';
            columns: ['categoria_slug'];
            isOneToOne: false;
            referencedRelation: 'categorias';
            referencedColumns: ['slug'];
          },
        ];
      };
      productos: {
        Row: {
          id: string;
          emprendimiento_id: string;
          tipo: TipoProducto;
          nombre: string;
          descripcion: string;
          precio: number;
          categoria_slug: string;
          imagenes: string[];
          disponible: boolean;
          creado_en: string;
        };
        Insert: {
          id?: string;
          emprendimiento_id: string;
          tipo?: TipoProducto;
          nombre: string;
          descripcion: string;
          precio: number;
          categoria_slug: string;
          imagenes?: string[];
          disponible?: boolean;
        };
        Update: Partial<Database['public']['Tables']['productos']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'productos_emprendimiento_id_fkey';
            columns: ['emprendimiento_id'];
            isOneToOne: false;
            referencedRelation: 'emprendimientos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'productos_categoria_slug_fkey';
            columns: ['categoria_slug'];
            isOneToOne: false;
            referencedRelation: 'categorias';
            referencedColumns: ['slug'];
          },
        ];
      };
      pagos: {
        Row: {
          id: string;
          emprendimiento_id: string;
          metodo: 'yape';
          monto_reportado: number;
          comprobante_url: string;
          estado: EstadoPago;
          periodo_inicio: string | null;
          periodo_fin: string | null;
          revisado_por: string | null;
          revisado_en: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          emprendimiento_id: string;
          metodo?: 'yape';
          monto_reportado: number;
          comprobante_url: string;
          estado?: EstadoPago;
          periodo_inicio?: string | null;
          periodo_fin?: string | null;
        };
        Update: Partial<Database['public']['Tables']['pagos']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'pagos_emprendimiento_id_fkey';
            columns: ['emprendimiento_id'];
            isOneToOne: false;
            referencedRelation: 'emprendimientos';
            referencedColumns: ['id'];
          },
        ];
      };
      /** Solo se escribe con `registrar_visita()`; el dueño y el administrador la leen. */
      visitas: {
        Row: {
          id: number;
          emprendimiento_id: string;
          producto_id: string | null;
          tipo: TipoVisita;
          visitante: string | null;
          visitado_en: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'visitas_emprendimiento_id_fkey';
            columns: ['emprendimiento_id'];
            isOneToOne: false;
            referencedRelation: 'emprendimientos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'visitas_producto_id_fkey';
            columns: ['producto_id'];
            isOneToOne: false;
            referencedRelation: 'productos';
            referencedColumns: ['id'];
          },
        ];
      };
    };
  };
}
