export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      cierres_caja: {
        Row: {
          created_at: string
          efectivo_final: number
          efectivo_inicial: number
          fecha: string
          id: string
          notas: string | null
          registrado_por: string
          total_gastos: number
          total_ventas: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          efectivo_final?: number
          efectivo_inicial?: number
          fecha?: string
          id?: string
          notas?: string | null
          registrado_por: string
          total_gastos?: number
          total_ventas?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          efectivo_final?: number
          efectivo_inicial?: number
          fecha?: string
          id?: string
          notas?: string | null
          registrado_por?: string
          total_gastos?: number
          total_ventas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cierres_caja_registrado_por_fkey'
            columns: ['registrado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      gastos: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string | null
          fecha: string
          id: string
          moneda: string
          monto: number
          monto_original: number | null
          registrado_por: string
          tipo_cambio: number | null
          updated_at: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          moneda?: string
          monto?: number
          monto_original?: number | null
          registrado_por: string
          tipo_cambio?: number | null
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          moneda?: string
          monto?: number
          monto_original?: number | null
          registrado_por?: string
          tipo_cambio?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gastos_registrado_por_fkey'
            columns: ['registrado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      pedidos: {
        Row: {
          cantidad: number
          cliente_contacto: string | null
          cliente_nombre: string
          comision_plataforma: number
          created_at: string
          estado: Database['public']['Enums']['estado_pedido']
          fecha: string
          id: string
          metodo_pago: Database['public']['Enums']['metodo_pago'] | null
          monto: number
          monto_neto: number | null
          notas: string | null
          plataforma_id: string
          producto_id: string | null
          registrado_por: string
          updated_at: string
        }
        Insert: {
          cantidad?: number
          cliente_contacto?: string | null
          cliente_nombre: string
          comision_plataforma?: number
          created_at?: string
          estado?: Database['public']['Enums']['estado_pedido']
          fecha?: string
          id?: string
          metodo_pago?: Database['public']['Enums']['metodo_pago'] | null
          monto?: number
          monto_neto?: number | null
          notas?: string | null
          plataforma_id: string
          producto_id?: string | null
          registrado_por: string
          updated_at?: string
        }
        Update: {
          cantidad?: number
          cliente_contacto?: string | null
          cliente_nombre?: string
          comision_plataforma?: number
          created_at?: string
          estado?: Database['public']['Enums']['estado_pedido']
          fecha?: string
          id?: string
          metodo_pago?: Database['public']['Enums']['metodo_pago'] | null
          monto?: number
          monto_neto?: number | null
          notas?: string | null
          plataforma_id?: string
          producto_id?: string | null
          registrado_por?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pedidos_plataforma_id_fkey'
            columns: ['plataforma_id']
            isOneToOne: false
            referencedRelation: 'plataformas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pedidos_producto_id_fkey'
            columns: ['producto_id']
            isOneToOne: false
            referencedRelation: 'productos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pedidos_registrado_por_fkey'
            columns: ['registrado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      plataformas: {
        Row: {
          activa: boolean
          created_at: string
          id: string
          nombre: string
          tipo: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre: string
          tipo?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre?: string
          tipo?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean
          costo: number
          costo_original: number | null
          created_at: string
          id: string
          imagen_url: string | null
          moneda_costo: string
          nombre: string
          notas: string | null
          plataforma_id: string | null
          precio: number
          registrado_por: string
          sku: string | null
          stock: number
          tipo_cambio_costo: number | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          costo?: number
          costo_original?: number | null
          created_at?: string
          id?: string
          imagen_url?: string | null
          moneda_costo?: string
          nombre: string
          notas?: string | null
          plataforma_id?: string | null
          precio?: number
          registrado_por: string
          sku?: string | null
          stock?: number
          tipo_cambio_costo?: number | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          costo?: number
          costo_original?: number | null
          created_at?: string
          id?: string
          imagen_url?: string | null
          moneda_costo?: string
          nombre?: string
          notas?: string | null
          plataforma_id?: string | null
          precio?: number
          registrado_por?: string
          sku?: string | null
          stock?: number
          tipo_cambio_costo?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'productos_plataforma_id_fkey'
            columns: ['plataforma_id']
            isOneToOne: false
            referencedRelation: 'plataformas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'productos_registrado_por_fkey'
            columns: ['registrado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          empresa: string | null
          id: string
          nombre_completo: string
          rol: Database['public']['Enums']['rol_socio']
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email: string
          empresa?: string | null
          id: string
          nombre_completo: string
          rol?: Database['public']['Enums']['rol_socio']
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          nombre_completo?: string
          rol?: Database['public']['Enums']['rol_socio']
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      propuestas_productos: {
        Row: {
          costo_estimado: number | null
          created_at: string
          id: string
          link_proveedor: string | null
          nombre_producto: string
          notas: string | null
          precio_competencia: number | null
          precio_venta_estimado: number | null
          propuesto_por: string
          segmento: string
          updated_at: string
        }
        Insert: {
          costo_estimado?: number | null
          created_at?: string
          id?: string
          link_proveedor?: string | null
          nombre_producto: string
          notas?: string | null
          precio_competencia?: number | null
          precio_venta_estimado?: number | null
          propuesto_por: string
          segmento: string
          updated_at?: string
        }
        Update: {
          costo_estimado?: number | null
          created_at?: string
          id?: string
          link_proveedor?: string | null
          nombre_producto?: string
          notas?: string | null
          precio_competencia?: number | null
          precio_venta_estimado?: number | null
          propuesto_por?: string
          segmento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'propuestas_productos_propuesto_por_fkey'
            columns: ['propuesto_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      ventas_plataforma: {
        Row: {
          comision_plataforma: number
          created_at: string
          fecha: string
          id: string
          monto: number
          monto_neto: number | null
          notas: string | null
          origen: string
          pedido_id: string | null
          pedidos: number
          plataforma_id: string
          registrado_por: string
          updated_at: string
        }
        Insert: {
          comision_plataforma?: number
          created_at?: string
          fecha?: string
          id?: string
          monto?: number
          monto_neto?: number | null
          notas?: string | null
          origen?: string
          pedido_id?: string | null
          pedidos?: number
          plataforma_id: string
          registrado_por: string
          updated_at?: string
        }
        Update: {
          comision_plataforma?: number
          created_at?: string
          fecha?: string
          id?: string
          monto?: number
          monto_neto?: number | null
          notas?: string | null
          origen?: string
          pedido_id?: string | null
          pedidos?: number
          plataforma_id?: string
          registrado_por?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ventas_plataforma_pedido_id_fkey'
            columns: ['pedido_id']
            isOneToOne: false
            referencedRelation: 'pedidos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ventas_plataforma_plataforma_id_fkey'
            columns: ['plataforma_id']
            isOneToOne: false
            referencedRelation: 'plataformas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ventas_plataforma_registrado_por_fkey'
            columns: ['registrado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      estado_pedido: 'pendiente' | 'enviado' | 'entregado' | 'cancelado'
      metodo_pago: 'pix' | 'credito' | 'debito' | 'transferencia' | 'efectivo' | 'otro'
      rol_socio: 'admin' | 'socio'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]

export const Constants = {
  public: {
    Enums: {
      estado_pedido: ['pendiente', 'enviado', 'entregado', 'cancelado'],
      metodo_pago: ['pix', 'credito', 'debito', 'transferencia', 'efectivo', 'otro'],
      rol_socio: ['admin', 'socio'],
    },
  },
} as const
