import Dexie, { type Table } from 'dexie'
import type {
  Componente, Equipo, EquipoPlan, KpiPeriodo, OrdenTrabajo, Plan, Rutina,
} from '../lib/types'

// Base local (IndexedDB vía Dexie). Todos los datos del portal viven
// en este navegador; no hay backend ni multitenant.

export interface Meta { key: string; value: unknown }

class PortalDB extends Dexie {
  equipos!: Table<Equipo, string>
  componentes!: Table<Componente, string>
  planes!: Table<Plan, string>
  rutinas!: Table<Rutina, string>
  equipo_plan!: Table<EquipoPlan, string>
  ordenes_trabajo!: Table<OrdenTrabajo, string>
  kpi_periodos!: Table<KpiPeriodo, string>
  meta!: Table<Meta, string>

  constructor() {
    super('portal_mantenimiento')
    this.version(1).stores({
      equipos: 'id, created_at',
      componentes: 'id, equipo_id, created_at',
      planes: 'id, equipo_id',
      rutinas: 'id, plan_id, created_at',
      equipo_plan: 'id, equipo_id, created_at',
      ordenes_trabajo: 'id, equipo_id, created_at',
      kpi_periodos: 'id, equipo_id, created_at',
      meta: 'key',
    })
  }
}

export const db = new PortalDB()

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Marca de tiempo creciente para conservar el orden de inserción.
let _tick = Date.now()
export function ts(): string { return new Date(_tick++).toISOString() }

// ── Seed del ejemplo (Transportador Sin Fin SC-61) ──────────
// Se carga una sola vez, si la base está vacía, para que el portal
// abra poblado como el ejemplo original.
let _seeding: Promise<void> | null = null
export function seedIfEmpty(): Promise<void> {
  if (!_seeding) _seeding = _doSeed()
  return _seeding
}

async function _doSeed(): Promise<void> {
  const count = await db.equipos.count()
  if (count > 0) return

  const equipoId = uid()
  const planId = uid()

  await db.transaction('rw',
    [db.equipos, db.componentes, db.planes, db.rutinas, db.equipo_plan, db.ordenes_trabajo, db.kpi_periodos],
    async () => {
      await db.equipos.add({
        id: equipoId, codigo: 'SC-61', nombre: 'Transportador Sin Fin SC-61', criticidad: 'Alta', created_at: ts(),
        data: {
          sistema: 'Sistema de Transporte', subsistema: 'Línea de Producción A', codigo_posicion: 'TRN-001',
          tipo_activo: 'Mecánico', familia: 'Transportadores', clase_mant: 'Preventivo',
          planta: 'Planta Principal', area: 'Área de Producción', linea: 'Línea 1', departamento: 'Mantenimiento',
          ubicacion_fisica: 'Nave A, columna 12, nivel 2',
          marca: 'Siemens', modelo: 'SC-Series 61', serial: 'SN-2019-4872', anio_fab: '2019', anio_inst: '2020',
          fabricante: 'Siemens AG', proveedor: 'Tecnomec C.A.', costo: '$12,500', vida_util: '15', garantia: '2024-12-31', centro_costos: 'CC-PROD-01',
          potencia: '7.5', voltaje: '440', amperios: '15.2', fases: '3', frecuencia: '60', capacidad: '500 kg/h',
          electricidad: 'Sí / 15.2 A', aire: 'No', lubricacion: 'Grasa SKF LGMT2 / Mensual', agua: 'No', vapor: 'No', gas: 'No',
          descripcion: 'Transportador de tornillo sin fin que traslada material a granel en la Línea de Producción A. Opera en régimen continuo a 500 kg/h; el motor acciona un reductor acoplado al sinfín.',
          docs: { manual_op: true, manual_mant: true, planos: true, diagrama: true, catalogo: false },
        },
      })

      await db.componentes.bulkAdd([
        ['SC61-MOT', 'Motor eléctrico principal', 'Sistema', 'Mecánico-eléctrico', 'Alto'],
        ['SC61-MOT-ROD', 'Rodamientos del motor', 'Componente', 'Mecánico', 'Alto'],
        ['SC61-MOT-BOB', 'Bobinado del motor', 'Componente', 'Eléctrico', 'Alto'],
        ['SC61-RED', 'Reductor de velocidad', 'Sistema', 'Mecánico', 'Alto'],
        ['SC61-RED-ACE', 'Aceite del reductor', 'Componente', 'Lubricación', 'Medio'],
        ['SC61-SIN', 'Tornillo sin fin', 'Sistema', 'Mecánico', 'Alto'],
        ['SC61-SIN-SEL', 'Sellos y empaquetaduras', 'Componente', 'Sellado', 'Medio'],
        ['SC61-ELE', 'Sistema eléctrico / control', 'Sistema', 'Eléctrico', 'Alto'],
      ].map(([codigo, nombre, nivel, tipo, critico]) => ({
        id: uid(), equipo_id: equipoId, codigo, nombre, nivel, tipo, critico, created_at: ts(),
      })))

      await db.planes.add({ id: planId, equipo_id: equipoId, nombre: 'Plan de Transportador Sin Fin SC-61', created_at: ts() })

      await db.rutinas.bulkAdd([
        { frecuencia: 'Diario', nombre: 'Inspección visual: temperatura, ruidos, vibración del motor', tipo: 'fecha', actividades: [] },
        { frecuencia: 'Semanal', nombre: 'Verificación de alineación del tornillo sin fin y estado de sellos', tipo: 'fecha', actividades: [] },
        {
          frecuencia: 'Mensual', nombre: 'Lubricación de rodamientos — Grasa SKF LGMT2 (20 gr)', tipo: 'fecha',
          actividades: [
            'Detener el equipo y bloquear la energía (procedimiento LOTO)',
            'Verificar temperatura del motor con termómetro infrarrojo (máx. 80°C)',
            'Aplicar 10 gr de grasa SKF LGMT2 en rodamiento delantero',
            'Aplicar 10 gr de grasa SKF LGMT2 en rodamiento trasero',
            'Verificar estado visual de cables y conexiones eléctricas',
            'Registrar lecturas del variador de frecuencia',
            'Retirar bloqueo, energizar y verificar operación normal',
            'Documentar la actividad en la bitácora del equipo',
          ],
        },
        { frecuencia: '500 h', nombre: 'Cambio de aceite del reductor — ISO VG 220', tipo: 'lectura', actividades: [] },
        { frecuencia: 'Trimestral', nombre: 'Inspección eléctrica: conexiones, protecciones, variador', tipo: 'fecha', actividades: [] },
        { frecuencia: 'Anual', nombre: 'Revisión general completa — parada programada', tipo: 'ambas', actividades: [] },
      ].map((r) => ({ id: uid(), plan_id: planId, created_at: ts(), ...r })))

      await db.equipo_plan.add({ id: uid(), equipo_id: equipoId, plan_id: planId, fecha_inicio: '2026-06-01', created_at: ts() })

      await db.ordenes_trabajo.bulkAdd([
        {
          id: uid(), equipo_id: equipoId, codigo: 'OT-2026-0142', tipo: 'preventivo', estado: 'abierta', created_at: ts(),
          data: {
            fecha_emision: '2026-06-08', fecha_planificada: '2026-06-30', responsable: 'Técnico de turno',
            prioridad: 'Normal', tiempo_estimado: '1.5',
            actividad: 'Lubricación mensual de rodamientos del motor — SKF LGMT2',
            materiales: 'Grasa SKF LGMT2 — 20 gr; Trapos industriales; EPP: guantes y lentes de seguridad',
          },
        },
        {
          id: uid(), equipo_id: equipoId, codigo: 'OT-2026-0139', tipo: 'correctivo', estado: 'cerrada', created_at: ts(),
          data: {
            falla: 'Ruido anormal en rodamiento trasero', fecha_falla: '2026-06-03', tiempo_paro: '3.5',
            causa_raiz: 'Falta de lubricación. Intervalo de engrase excedido por 15 días. Rodamiento SKF 6205 con desgaste severo.',
            accion: 'Sustitución de rodamiento trasero SKF 6205. Reengrase completo. Se ajusta el plan preventivo a un ciclo cada 25 días.',
          },
        },
      ])

      await db.kpi_periodos.add({
        id: uid(), equipo_id: equipoId, horas_totales: 720, num_fallas: 4, horas_paro: 14, horas_reparacion: 14,
        resultados: {}, created_at: ts(),
      })
    },
  )
}
