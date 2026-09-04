// Tipos de las entidades del portal. Coinciden con las tablas locales
// de Dexie (src/data/local.ts). Todos los datos viven en el navegador.

export interface Perfil {
  id: string
  nombre: string | null
  progreso: boolean[]
  created_at: string
}

export interface Equipo {
  id: string
  codigo: string | null
  nombre: string | null
  criticidad: string | null
  data: Record<string, unknown>
  created_at: string
}

export interface Componente {
  id: string
  equipo_id: string | null
  codigo: string | null
  nombre: string | null
  nivel: string | null
  tipo: string | null
  critico: string | null
  created_at: string
}

export interface Plan {
  id: string
  equipo_id: string | null
  nombre: string | null
  created_at: string
}

export interface Rutina {
  id: string
  plan_id: string | null
  frecuencia: string | null
  nombre: string | null
  tipo: string | null
  actividades: string[]
  created_at: string
}

export interface EquipoPlan {
  id: string
  equipo_id: string | null
  plan_id: string | null
  fecha_inicio: string | null
  created_at: string
}

export interface OrdenTrabajo {
  id: string
  equipo_id: string | null
  codigo: string | null
  tipo: string | null
  estado: string | null
  data: Record<string, unknown>
  created_at: string
}

export interface KpiPeriodo {
  id: string
  equipo_id: string | null
  horas_totales: number | null
  num_fallas: number | null
  horas_paro: number | null
  horas_reparacion: number | null
  resultados: Record<string, unknown>
  created_at: string
}
