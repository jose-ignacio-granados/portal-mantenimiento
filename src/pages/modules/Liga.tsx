import { useEffect, useState } from 'react'
import {
  ArrowRight, BookOpen, Boxes, CalendarDays, Check, ClipboardList,
  FileText, Link2, Plus, Workflow,
} from '../../components/icons'
import { CardHead, DatePicker } from '../../components/ui'
import { crearLiga, listarLigas, listarRutinas, obtenerOCrearPlan } from '../../data/db'
import type { Equipo, Plan, Rutina } from '../../lib/types'

interface Props {
  equipo: Equipo | null
  onNewEquipo: () => void
  onDone: () => void
  goNext: () => void
}

const DIAS: Record<string, number> = {
  diario: 1, semanal: 7, quincenal: 15, mensual: 30,
  trimestral: 90, semestral: 180, anual: 365,
}

function proximaFecha(base: string, frecuencia: string): string {
  const key = (frecuencia || '').toLowerCase().trim()
  const dias = DIAS[key]
  if (!dias) return '—'
  const d = base ? new Date(base) : new Date()
  d.setDate(d.getDate() + dias)
  return d.toLocaleDateString('es-VE')
}

const FLOW = [
  { Icon: Boxes, t: 'Catálogo de Equipos (AME)', s: 'Equipo registrado con ficha técnica completa' },
  { Icon: ClipboardList, t: 'Plan de Mantenimiento', s: 'Rutinas, frecuencias y actividades definidas' },
  { Icon: Link2, t: 'Liga Equipo ↔ Plan', s: 'Se asigna el plan al equipo con fecha de inicio' },
  { Icon: CalendarDays, t: 'Generación del calendario', s: 'El sistema calcula todos los próximos mantenimientos' },
  { Icon: FileText, t: 'Emisión de OT Preventiva', s: 'Orden de trabajo generada para ejecutar' },
  { Icon: BookOpen, t: 'Bitácora e historial', s: 'Registro histórico del equipo actualizado' },
]

export function Liga({ equipo, onNewEquipo, onDone, goNext }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10))
  const [ligado, setLigado] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgErr, setMsgErr] = useState(false)

  useEffect(() => {
    if (!equipo) { setPlan(null); setRutinas([]); setLigado(false); return }
    obtenerOCrearPlan(equipo.id, `Plan de ${equipo.nombre || equipo.codigo || 'equipo'}`)
      .then(async (p) => {
        setPlan(p)
        setRutinas(await listarRutinas(p.id))
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
      setLigado(true); setMsgErr(false); setMsg('Plan ligado al equipo. El calendario se generó abajo.')
    } catch (err) { setMsgErr(true); setMsg(err instanceof Error ? err.message : 'Error al ligar') } finally { setBusy(false) }
  }

  return (
    <>
      <div className="sec-head">
        <div className="sec-ico"><Workflow className="ico" strokeWidth={1.75} /></div>
        <div>
          <div className="sec-eyebrow">Módulo 04</div>
          <h2>Liga equipo con plan de mantenimiento</h2>
          <p>Conecta cada equipo con su plan. A partir de aquí el sistema genera automáticamente el calendario de actividades y las próximas fechas de intervención.</p>
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
                    rutinas.map((r) => (
                      <tr key={r.id}>
                        <td>{r.nombre}</td>
                        <td className="mono">{r.frecuencia}</td>
                        <td className="mono">{proximaFecha(fechaInicio, r.frecuencia ?? '')}</td>
                        <td><span className={`tag ${ligado ? 't-good' : 't-mute'}`}>{ligado ? 'Programado' : 'Sin ligar'}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="nav-foot">
        <button className="btn btn-good" onClick={onDone}><Check className="ico-sm" /> Completado</button>
        <button className="btn btn-dark" onClick={goNext}>Órdenes de Trabajo <ArrowRight className="ico-sm" /></button>
      </div>
    </>
  )
}
