/**
 * Tipos de la base de datos, escritos a mano para reflejar
 * supabase/migrations/0001_init.sql.
 *
 * En cuanto el proyecto tenga una instancia real de Supabase, reemplaza
 * este archivo generándolo automáticamente con:
 *   pnpm --filter @emprende/db gen:types
 * (requiere la Supabase CLI y `supabase start` corriendo localmente).
 */
export type Rol = 'consumidor' | 'emprendedor' | 'admin';
export type EstadoEmprendimiento = 'activo' | 'pendiente' | 'vencido' | 'suspendido';
export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado';

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
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
          vistas: number;
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
          vistas?: number;
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
          nombre: string;
          descripcion: string;
          precio: number;
          categoria_slug: string;
          imagenes: string[];
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
          motivo_rechazo: string | null;
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
    };
  };
}
