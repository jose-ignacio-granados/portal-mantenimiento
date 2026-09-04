import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Check, CheckCircle2, ClipboardList, Plus, Trash2 } from '../../components/icons'
import { CardHead, Checkbox, Dropdown } from '../../components/ui'
import { agregarRutina, borrarRutina, listarRutinas, obtenerOCrearPlan } from '../../data/db'
import type { Equipo, Plan, Rutina } from '../../lib/types'

interface Props {
  equipo: Equipo | null
  onNewEquipo: () => void
  onDone: () => void
  goNext: () => void
}

const TIPOS = ['fecha', 'lectura', 'ambas']
const TIPO_TAG: Record<string, { cls: string; lbl: string }> = {
  fecha: { cls: 't-good', lbl: 'Fecha' },
  lectura: { cls: 't-info', lbl: 'Lectura' },
  ambas: { cls: 't-warn', lbl: 'Ambas' },
}

export function PlanMant({ equipo, onNewEquipo, onDone, goNext }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [form, setForm] = useState({ frecuencia: '', nombre: '', tipo: 'fecha', actividades: '' })
  const [selRutina, setSelRutina] = useState<string>('')
  const [checks, setChecks] = useState<Record<number, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (!equipo) { setPlan(null); setRutinas([]); return }
    obtenerOCrearPlan(equipo.id, `Plan de ${equipo.nombre || equipo.codigo || 'equipo'}`)
      .then(async (p) => {
        setPlan(p)
        const rs = await listarRutinas(p.id)
        setRutinas(rs)
        setSelRutina((prev) => prev || (rs[0]?.id ?? ''))
      })
      .catch((err) => console.error('Plan:', err))
  }, [equipo])

  async function agregar() {
    if (!plan) return
    if (!form.nombre.trim()) { setHint('Ponle un nombre a la rutina para agregarla.'); return }
    setBusy(true); setHint('')
    try {
      const actividades = form.actividades.split('\n').map((l) => l.trim()).filter(Boolean)
      await agregarRutina({ plan_id: plan.id, frecuencia: form.frecuencia, nombre: form.nombre, tipo: form.tipo, actividades })
      setRutinas(await listarRutinas(plan.id))
      setForm({ frecuencia: '', nombre: '', tipo: 'fecha', actividades: '' })
    } catch (err) { console.error('Agregar rutina:', err) } finally { setBusy(false) }
  }

  async function eliminar(id: string) {
    try { await borrarRutina(id); if (plan) setRutinas(await listarRutinas(plan.id)) }
    catch (err) { console.error('Borrar rutina:', err) }
  }

  const rutinaSel = rutinas.find((r) => r.id === selRutina) ?? null

  return (
    <>
      <div className="sec-head">
        <div className="sec-ico"><ClipboardList className="ico" strokeWidth={1.75} /></div>
        <div>
          <div className="sec-eyebrow">Módulo 03</div>
          <h2>Plan de mantenimiento preventivo</h2>
          <p>Define las rutinas y actividades para cada componente. Un plan puede combinar frecuencias por <strong>fecha</strong> (Diario, Semanal, Mensual…) y por <strong>lectura</strong> (cada N horas, ciclos o km).</p>
        </div>
      </div>

      {!equipo ? (
        <div className="card"><div className="empty">
          <ClipboardList className="ico" />
          <span>Aún no tienes un equipo. Créalo y aquí armarás su plan de rutinas preventivas.</span>
          <button className="btn btn-primary" onClick={onNewEquipo}><Plus className="ico-sm" /> Crear mi primer equipo</button>
        </div></div>
      ) : (
        <>
          <div className="card">
            <CardHead step={1} icon={CalendarDays} title="Rutinas del plan preventivo" sub="Actividades programadas con frecuencia definida" />

            <div className="freq-legend">
              <div className="grp"><span className="tag t-good">Por fecha</span><span className="desc">Diario · Semanal · Quincenal · Mensual · Trimestral · Semestral · Anual</span></div>
              <div className="grp"><span className="tag t-info">Por lectura</span><span className="desc">Cada N horas · ciclos · km</span></div>
            </div>

            {rutinas.length === 0 ? (
              <div className="empty" style={{ padding: '18px' }}>Aún no hay rutinas. Agrega la primera abajo.</div>
            ) : (
              rutinas.map((r) => (
                <div className="rutina" key={r.id}>
                  <div className="rutina-freq">{r.frecuencia}</div>
                  <div className="rutina-name">{r.nombre}</div>
                  <span className={`tag ${TIPO_TAG[r.tipo ?? 'fecha']?.cls ?? 't-mute'}`}>{TIPO_TAG[r.tipo ?? 'fecha']?.lbl ?? r.tipo}</span>
                  <button className="btn btn-danger" onClick={() => eliminar(r.id)} aria-label="Eliminar"><Trash2 className="ico-sm" /></button>
                </div>
              ))
            )}

            <div className="grid c3" style={{ marginTop: 16 }}>
              <div className="field"><label>Frecuencia</label><input value={form.frecuencia} placeholder="Ej: Mensual / 500 h" onChange={(e) => setForm({ ...form, frecuencia: e.target.value })} /></div>
              <div className="field"><label>Tipo</label><Dropdown value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} ariaLabel="Tipo" options={TIPOS.map((t) => ({ value: t, label: TIPO_TAG[t].lbl }))} /></div>
              <div className="field full"><label>Actividad / rutina</label><input value={form.nombre} placeholder="Ej: Lubricación de rodamientos — Grasa SKF LGMT2" onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setHint('') }} /></div>
              <div className="field full"><label>Pasos del checklist (uno por línea)</label><textarea value={form.actividades} placeholder={'Detener y bloquear energía (LOTO)\nAplicar 10 gr de grasa en rodamiento delantero\nRegistrar lecturas del variador'} onChange={(e) => setForm({ ...form, actividades: e.target.value })} /></div>
            </div>
            {hint && <div className="msg msg-err">{hint}</div>}
            <div className="btn-row"><button className="btn btn-dark" onClick={agregar} disabled={busy}><Plus className="ico-sm" /> Agregar rutina</button></div>
          </div>

          <div className="card">
            <CardHead step={2} icon={CheckCircle2} title="Checklist de la rutina" sub="Pasos para ejecutar la rutina seleccionada" />
            {rutinas.length === 0 ? (
              <div className="empty" style={{ padding: '18px' }}>Agrega una rutina con pasos para ver su checklist.</div>
            ) : (
              <>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label>Rutina</label>
                  <Dropdown value={selRutina} ariaLabel="Rutina" onChange={(v) => { setSelRutina(v); setChecks({}) }}
                    options={rutinas.map((r) => ({ value: r.id, label: `${r.frecuencia} — ${r.nombre}` }))} />
                </div>
                {(rutinaSel?.actividades ?? []).length === 0 ? (
                  <div className="empty" style={{ padding: '18px' }}>Esta rutina no tiene pasos de checklist.</div>
                ) : (
                  (rutinaSel?.actividades ?? []).map((a, i) => (
                    <Checkbox key={i} className="row" checked={!!checks[i]} label={a} onChange={(v) => setChecks((p) => ({ ...p, [i]: v }))} />
                  ))
                )}
              </>
            )}
          </div>
        </>
      )}

      <div className="nav-foot">
        <button className="btn btn-good" onClick={onDone}><Check className="ico-sm" /> Completado</button>
        <button className="btn btn-dark" onClick={goNext}>Liga Equipo-Plan <ArrowRight className="ico-sm" /></button>
      </div>
    </>
  )
}
