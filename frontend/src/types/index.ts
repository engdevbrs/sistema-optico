export interface Admin {
  id: string
  auth_user_id: string
  nombre: string
  email: string
  rol: 'DUENO' | 'VENDEDOR'
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Configuracion {
  id: string
  nombre_optica: string
  logo_url: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  moneda_local: string
  limite_citas_dia: number
  descuento_maximo: number
  max_cancelaciones_mes: number
}
