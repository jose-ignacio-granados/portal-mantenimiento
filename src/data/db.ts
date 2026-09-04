// Capa de acceso a datos — 100% local (Dexie / IndexedDB).
// Mismas funciones que consumían los módulos; sin backend ni multitenant.

import { db, ts, uid } from './local'
import type {
  Componente, Equipo, EquipoPlan, KpiPeriodo, OrdenTrabajo, Plan, Rutina,
} from '../lib/types'

// ===== PROGRESO (en tabla meta) =====
export async function getProgreso(): Promise<boolean[] | null> {
  const row = await db.meta.get('progreso')
  return (row?.value as boolean[]) ?? null
}

export async function guardarProgreso(progreso: boolean[]): Promise<void> {
  await db.meta.put({ key: 'progreso', value: progreso })
}

// ===== MODULO 1: EQUIPOS (AME) =====
export async function listarEquipos(): Promise<Equipo[]> {
  return db.equipos.orderBy('created_at').toArray()
}

export async function guardarEquipo(
  input: { id?: string; codigo: string; nombre: string; criticidad: string; data: Record<string, unknown> },
): Promise<Equipo> {
  if (input.id) {
    const prev = await db.equipos.get(input.id)
    const row: Equipo = {
      id: input.id,
      codigo: input.codigo, nombre: input.nombre, criticidad: input.criticidad, data: input.data,
      created_at: prev?.created_at ?? ts(),
    }
    await db.equipos.put(row)
    return row
  }
  const row: Equipo = { id: uid(), codigo: input.codigo, nombre: input.nombre, criticidad: input.criticidad, data: input.data, created_at: ts() }
  await db.equipos.add(row)
  return row
}

export async function borrarEquipo(id: string): Promise<void> {
  // Cascada manual (Dexie no la hace sola).
  await db.transaction('rw',
    [db.equipos, db.componentes, db.planes, db.rutinas, db.equipo_plan, db.ordenes_trabajo, db.kpi_periodos],
    async () => {
      const planes = await db.planes.where('equipo_id').equals(id).toArray()
      for (const p of planes) await db.rutinas.where('plan_id').equals(p.id).delete()
      await db.planes.where('equipo_id').equals(id).delete()
      await db.componentes.where('equipo_id').equals(id).delete()
      await db.equipo_plan.where('equipo_id').equals(id).delete()
      await db.ordenes_trabajo.where('equipo_id').equals(id).delete()
      await db.kpi_periodos.where('equipo_id').equals(id).delete()
      await db.equipos.delete(id)
    },
  )
}

// ===== MODULO 2: COMPONENTES (DESPIECE) =====
export async function listarComponentes(equipoId: string): Promise<Componente[]> {
  return db.componentes.where('equipo_id').equals(equipoId).sortBy('created_at')
}

export async function agregarComponente(
  input: { equipo_id: string; codigo: string; nombre: string; nivel: string; tipo: string; critico: string },
): Promise<Componente> {
  const row: Componente = { id: uid(), created_at: ts(), ...input }
  await db.componentes.add(row)
  return row
}

export async function borrarComponente(id: string): Promise<void> {
  await db.componentes.delete(id)
}

// ===== MODULO 3: PLAN + RUTINAS =====
export async function obtenerOCrearPlan(equipoId: string, nombre: string): Promise<Plan> {
  const existente = await db.planes.where('equipo_id').equals(equipoId).first()
  if (existente) return existente
  const row: Plan = { id: uid(), equipo_id: equipoId, nombre, created_at: ts() }
  await db.planes.add(row)
  return row
}

export async function listarRutinas(planId: string): Promise<Rutina[]> {
  return db.rutinas.where('plan_id').equals(planId).sortBy('created_at')
}

export async function agregarRutina(
  input: { plan_id: string; frecuencia: string; nombre: string; tipo: string; actividades: string[] },
): Promise<Rutina> {
  const row: Rutina = { id: uid(), created_at: ts(), ...input }
  await db.rutinas.add(row)
  return row
}

export async function borrarRutina(id: string): Promise<void> {
  await db.rutinas.delete(id)
}

// ===== MODULO 4: LIGA EQUIPO-PLAN =====
export async function listarLigas(): Promise<EquipoPlan[]> {
  return (await db.equipo_plan.orderBy('created_at').toArray()).reverse()
}

export async function crearLiga(
  input: { equipo_id: string; plan_id: string; fecha_inicio: string },
): Promise<EquipoPlan> {
  const row: EquipoPlan = { id: uid(), created_at: ts(), ...input }
  await db.equipo_plan.add(row)
  return row
}

// ===== MODULO 5: ORDENES DE TRABAJO =====
export async function listarOTs(equipoId: string): Promise<OrdenTrabajo[]> {
  return (await db.ordenes_trabajo.where('equipo_id').equals(equipoId).sortBy('created_at')).reverse()
}

export async function agregarOT(
  input: { equipo_id: string; codigo: string; tipo: string; estado: string; data: Record<string, unknown> },
): Promise<OrdenTrabajo> {
  const row: OrdenTrabajo = { id: uid(), created_at: ts(), ...input }
  await db.ordenes_trabajo.add(row)
  return row
}

export async function actualizarOT(
  id: string,
  patch: Partial<Pick<OrdenTrabajo, 'codigo' | 'tipo' | 'estado' | 'data'>>,
): Promise<void> {
  await db.ordenes_trabajo.update(id, patch)
}

export async function borrarOT(id: string): Promise<void> {
  await db.ordenes_trabajo.delete(id)
}

// ===== MODULO 6: KPIs =====
export async function listarKpis(equipoId: string): Promise<KpiPeriodo[]> {
  return (await db.kpi_periodos.where('equipo_id').equals(equipoId).sortBy('created_at')).reverse()
}

export async function guardarKpi(
  input: {
    equipo_id: string
    horas_totales: number
    num_fallas: number
    horas_paro: number
    horas_reparacion: number
    resultados: Record<string, unknown>
  },
): Promise<KpiPeriodo> {
  const row: KpiPeriodo = { id: uid(), created_at: ts(), ...input }
  await db.kpi_periodos.add(row)
  return row
}

// ===== FLUJO Y BITÁCORA (derivados del historial real) =====

/** Estado de completitud de los 6 módulos para un equipo, calculado a
 *  partir de los datos que realmente existen. Alimenta la barra de avance. */
export async function estadoFlujo(equipoId: string | null): Promise<boolean[]> {
  const vacio = [false, false, false, false, false, false]
  if (!equipoId) return vacio
  const eq = await db.equipos.get(equipoId)
  if (!eq) return vacio
  const [compCount, ligaCount, otCount, kpiCount] = await Promise.all([
    db.componentes.where('equipo_id').equals(equipoId).count(),
    db.equipo_plan.where('equipo_id').equals(equipoId).count(),
    db.ordenes_trabajo.where('equipo_id').equals(equipoId).count(),
    db.kpi_periodos.where('equipo_id').equals(equipoId).count(),
  ])
  const planes = await db.planes.where('equipo_id').equals(equipoId).toArray()
  let rutinaCount = 0
  for (const p of planes) rutinaCount += await db.rutinas.where('plan_id').equals(p.id).count()
  return [true, compCount > 0, rutinaCount > 0, ligaCount > 0, otCount > 0, kpiCount > 0]
}

export interface HistorialResumen {
  correctivas: number
  preventivas: number
  horasParo: number
  horasReparacion: number
}

/** Agrega las OT del equipo para sugerir los datos del período de KPIs. */
export async function resumenHistorial(equipoId: string): Promise<HistorialResumen> {
  const ots = await db.ordenes_trabajo.where('equipo_id').equals(equipoId).toArray()
  let correctivas = 0, preventivas = 0, horasParo = 0, horasReparacion = 0
  for (const ot of ots) {
    const d = (ot.data ?? {}) as Record<string, string>
    if (ot.tipo === 'correctivo') {
      correctivas++
      horasParo += parseFloat(d.tiempo_paro) || 0
      horasReparacion += parseFloat(d.tiempo_reparacion) || parseFloat(d.tiempo_paro) || 0
    } else {
      preventivas++
    }
  }
  return { correctivas, preventivas, horasParo, horasReparacion }
}
