import { useEffect, useState } from 'react'
import {
  ArrowRight, BookOpen, Boxes, CalendarDays, CheckCircle2, ClipboardList,
  FileText, Link2, Plus, Workflow,
} from '../../components/icons'
import { CardHead, DatePicker } from '../../components/ui'
import { agregarOT, crearLiga, listarLigas, listarOTs, listarRutinas, obtenerOCrearPlan } from '../../data/db'
import { tecnicoPorIndice } from '../../data/mock'
import type { Equipo, OrdenTrabajo, Plan, Rutina } from '../../lib/types'

interface Props {
  equipo: Equipo | null
  onNewEquipo: () => void
  onChanged: () => void
  goNext: () => void
}

const DIAS: Record<string, number> = {
  diario: 1, semanal: 7, quincenal: 15, mensual: 30,
  trimestral: 90, semestral: 180, anual: 365,
}

function proximaDate(base: string, frecuencia: string): Date | null {
  const dias = DIAS[(frecuencia || '').toLowerCase().trim()]
  if (!dias) return null
  const d = base ? new Date(base) : new Date()
  d.setDate(d.getDate() + dias)
  return d
}
function proximaFechaTxt(base: string, frecuencia: string): string {
  const d = proximaDate(base, frecuencia)
  return d ? d.toLocaleDateString('es-VE') : 'Por lectura'
}
function proximaFechaISO(base: string, frecuencia: string): string {
  const d = proximaDate(base, frecuencia)
  return d ? d.toISOString().slice(0, 10) : ''
}

const FLOW = [
  { Icon: Boxes, t: 'Catálogo de Equipos (AME)', s: 'Equipo registrado con ficha técnica completa' },
  { Icon: ClipboardList, t: 'Plan de Mantenimiento', s: 'Rutinas, frecuencias y actividades definidas' },
  { Icon: Link2, t: 'Liga Equipo ↔ Plan', s: 'Se asigna el plan al equipo con fecha de inicio' },
  { Icon: CalendarDays, t: 'Generación del calendario', s: 'El sistema calcula todos los próximos mantenimientos' },
  { Icon: FileText, t: 'Emisión de OT Preventiva', s: 'Orden de trabajo generada para ejecutar' },
  { Icon: BookOpen, t: 'Bitácora e historial', s: 'Registro histórico del equipo actualizado' },
]

export function Liga({ equipo, onNewEquipo, onChanged, goNext }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [ots, setOts] = useState<OrdenTrabajo[]>([])
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10))
  const [ligado, setLigado] = useState(false)
  const [busy, setBusy] = useState(false)
  const [genBusy, setGenBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgErr, setMsgErr] = useState(false)

  useEffect(() => {
    if (!equipo) { setPlan(null); setRutinas([]); setOts([]); setLigado(false); return }
    obtenerOCrearPlan(equipo.id, `Plan de ${equipo.nombre || equipo.codigo || 'equipo'}`)
      .then(async (p) => {
        setPlan(p)
        setRutinas(await listarRutinas(p.id))
        setOts(await listarOTs(equipo.id))
        const ligas = await listarLigas()
        const existente = ligas.find((l) => l.equipo_id === equipo.id)
        if (existente) { setLigado(true); if (existente.fecha_inicio) setFechaInicio(existente.fecha_inicio) }
        else setLigado(false)
      })
      .catch((err) => console.error('Liga:', err))
  }, [equipo])

  async function ligar() {
    if (!equipo || !plan) return
    setBusy(true); setMsg('')
    try {
      await crearLiga({ equipo_id: equipo.id, plan_id: plan.id, fecha_inicio: fechaInicio })
      setLigado(true); setMsgErr(false); setMsg('Plan ligado al equipo. El calendario se generó abajo; ya puedes emitir las órdenes preventivas.')
      onChanged()
    } catch (err) { setMsgErr(true); setMsg(err instanceof Error ? err.message : 'Error al ligar') } finally { setBusy(false) }
  }

  // Emite una OT preventiva por cada rutina del calendario, evitando duplicar.
  async function generarOTs() {
    if (!equipo || rutinas.length === 0) return
    setGenBusy(true); setMsg('')
    try {
      const existentes = await listarOTs(equipo.id)
      const yaGeneradas = new Set(
        existentes.map((o) => (o.data as Record<string, unknown> | undefined)?.rutina_id as string | undefined).filter(Boolean),
      )
      const year = new Date().getFullYear()
      let creadas = 0
      for (let i = 0; i < rutinas.length; i++) {
        const r = rutinas[i]
        if (yaGeneradas.has(r.id)) continue
        await agregarOT({
          equipo_id: equipo.id,
          codigo: `OT-${year}-${String(existentes.length + creadas + 1).padStart(4, '0')}`,
          tipo: 'preventivo',
          estado: 'programada',
          data: {
            fecha_emision: fechaInicio,
            fecha_planificada: proximaFechaISO(fechaInicio, r.frecuencia ?? ''),
            actividad: r.nombre ?? '',
            responsable: tecnicoPorIndice(i),
            prioridad: 'Normal',
            frecuencia: r.frecuencia ?? '',
            rutina_id: r.id,
            origen: 'plan',
          },
        })
        creadas++
      }
      setOts(await listarOTs(equipo.id))
      onChanged()
      setMsgErr(false)
      setMsg(creadas > 0
        ? `Se emitieron ${creadas} orden(es) preventiva(s) del calendario, asignadas a técnicos. Gestiónalas en el módulo Órdenes de trabajo.`
        : 'El calendario ya tiene todas sus órdenes preventivas emitidas.')
    } catch (err) { setMsgErr(true); setMsg(err instanceof Error ? err.message : 'Error al generar las órdenes') } finally { setGenBusy(false) }
  }

  const generadas = new Set(
    ots.map((o) => (o.data as Record<string, unknown> | undefined)?.rutina_id as string | undefined).filter(Boolean),
  )

  return (
    <>
      <div className="sec-head">
        <div className="sec-ico"><Workflow className="ico" strokeWidth={1.75} /></div>
        <div>
          <div className="sec-eyebrow">Módulo 04</div>
          <h2>Liga equipo con plan de mantenimiento</h2>
          <p>Conecta cada equipo con su plan. A partir de aquí el sistema genera el calendario de actividades y, con un clic, <strong>emite las órdenes de trabajo preventivas</strong> ya asignadas a un técnico.</p>
        </div>
      </div>

      {!equipo ? (
        <div className="card"><div className="empty">
          <Workflow className="ico" />
          <span>Necesitas un equipo con su plan. Créalo y aquí los ligarás para generar el calendario.</span>
          <button className="btn btn-primary" onClick={onNewEquipo}><Plus className="ico-sm" /> Crear mi primer equipo</button>
        </div></div>
      ) : (
        <>
          <div className="card">
            <CardHead step={1} icon={Workflow} title="Flujo del ciclo preventivo" sub="Así funciona el proceso automático de mantenimiento" />
            <div className="flow">
              {FLOW.map(({ Icon, t, s }, i) => (
                <div key={t}>
                  <div className="flow-step">
                    <div className="flow-ico"><Icon className="ico-sm" strokeWidth={2} /></div>
                    <div className="flow-txt"><strong>{t}</strong><span>{s}</span></div>
                  </div>
                  {i < FLOW.length - 1 && <div className="flow-arrow" />}
                </div>
              ))}
            </div>

            <div className="grid" style={{ marginTop: 18 }}>
              <div className="field"><label>Fecha de inicio del plan</label><DatePicker value={fechaInicio} onChange={setFechaInicio} ariaLabel="Fecha de inicio del plan" /></div>
              <div className="field"><label>Estado</label><input value={ligado ? 'Plan ligado' : 'Sin ligar'} readOnly /></div>
            </div>
            {msg && <div className={`msg ${msgErr ? 'msg-err' : 'msg-ok'}`}>{msg}</div>}
            <div className="btn-row"><button className="btn btn-primary" onClick={ligar} disabled={busy}><Link2 className="ico-sm" /> {ligado ? 'Actualizar liga' : 'Ligar plan al equipo'}</button></div>
          </div>

          <div className="card">
            <CardHead step={2} icon={CalendarDays} title={`Plan maestro — Próximos mantenimientos${equipo.codigo ? ` (${equipo.codigo})` : ''}`} sub="Calendario generado automáticamente al ligar el plan" />
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Actividad</th><th>Frecuencia</th><th>Próxima fecha</th><th>Estado</th></tr></thead>
                <tbody>
                  {rutinas.length === 0 ? (
                    <tr><td colSpan={4}><div className="empty">Define rutinas en el módulo Plan para ver el calendario.</div></td></tr>
                  ) : (
                    rutinas.map((r) => {
                      const emitida = generadas.has(r.id)
                      return (
                        <tr key={r.id}>
                          <td>{r.nombre}</td>
                          <td className="mono">{r.frecuencia}</td>
                          <td className="mono">{proximaFechaTxt(fechaInicio, r.frecuencia ?? '')}</td>
                          <td><span className={`tag ${emitida ? 't-good' : ligado ? 't-info' : 't-mute'}`}>{emitida ? 'OT emitida' : ligado ? 'Programado' : 'Sin ligar'}</span></td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            {rutinas.length > 0 && (
              <div className="btn-row">
                <button className="btn btn-dark" onClick={generarOTs} disabled={genBusy || !ligado} title={!ligado ? 'Primero liga el plan al equipo' : undefined}>
                  <FileText className="ico-sm" /> {genBusy ? 'Emitiendo…' : 'Emitir órdenes preventivas del calendario'}
                </button>
              </div>
            )}
            {ligado && rutinas.length > 0 && (
              <div className="hint-line"><CheckCircle2 className="ico-sm" /> Cada rutina genera una OT preventiva en estado <strong>Programada</strong>, asignada a un técnico. Se evita duplicar las ya emitidas.</div>
            )}
          </div>
        </>
      )}

      <div className="nav-foot">
        <button className="btn btn-dark" onClick={goNext}>Siguiente: Órdenes de Trabajo <ArrowRight className="ico-sm" /></button>
      </div>
    </>
  )
}
