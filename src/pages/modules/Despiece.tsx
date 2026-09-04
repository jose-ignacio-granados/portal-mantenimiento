import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, CircleDot, ListTree, Minus, Plus, Trash2 } from '../../components/icons'
import { CardHead, Dropdown } from '../../components/ui'
import { agregarComponente, borrarComponente, listarComponentes } from '../../data/db'
import type { Componente, Equipo } from '../../lib/types'

interface Props {
  equipo: Equipo | null
  onNewEquipo: () => void
  onDone: () => void
  goNext: () => void
}

const NIVELES = ['Sistema', 'Componente', 'Subcomponente']
const CRITICOS = ['Alto', 'Medio', 'Bajo']
const NIVEL_TAG: Record<string, string> = { Sistema: 't-brand', Componente: 't-mute', Subcomponente: 't-mute' }
const CRIT_TAG: Record<string, string> = { Alto: 't-crit', Medio: 't-info', Bajo: 't-mute' }

export function Despiece({ equipo, onNewEquipo, onDone, goNext }: Props) {
  const [items, setItems] = useState<Componente[]>([])
  const [form, setForm] = useState({ codigo: '', nombre: '', nivel: 'Sistema', tipo: '', critico: 'Alto' })
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (!equipo) { setItems([]); return }
    listarComponentes(equipo.id).then(setItems).catch((err) => console.error('Componentes:', err))
  }, [equipo])

  async function agregar() {
    if (!equipo) return
    if (!form.nombre.trim()) { setHint('Escribe el nombre del componente para agregarlo.'); return }
    setBusy(true); setHint('')
    try {
      await agregarComponente({ equipo_id: equipo.id, ...form })
      setItems(await listarComponentes(equipo.id))
      setForm({ codigo: '', nombre: '', nivel: 'Sistema', tipo: '', critico: 'Alto' })
    } catch (err) { console.error('Agregar componente:', err) } finally { setBusy(false) }
  }

  async function eliminar(id: string) {
    try { await borrarComponente(id); if (equipo) setItems(await listarComponentes(equipo.id)) }
    catch (err) { console.error('Borrar componente:', err) }
  }

  return (
    <>
      <div className="sec-head">
        <div className="sec-ico"><ListTree className="ico" strokeWidth={1.75} /></div>
        <div>
          <div className="sec-eyebrow">Módulo 02</div>
          <h2>Despiece del equipo</h2>
          <p>Desglosa el equipo en sus sistemas, componentes y subcomponentes. Esta estructura jerárquica es la base para crear el plan de mantenimiento preventivo.</p>
        </div>
      </div>

      {!equipo ? (
        <div className="card"><div className="empty">
          <ListTree className="ico" />
          <span>Primero necesitas un equipo. Créalo y aquí podrás desglosarlo en sistemas y componentes.</span>
          <button className="btn btn-primary" onClick={onNewEquipo}><Plus className="ico-sm" /> Crear mi primer equipo</button>
        </div></div>
      ) : (
        <>
          <div className="card">
            <CardHead step={1} icon={ListTree} title="Árbol de componentes" sub="Estructura: Equipo → Sistema → Componente → Subcomponente" />

            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Código</th><th>Componente</th><th>Nivel</th><th>Tipo</th><th>Crítico</th><th /></tr></thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty">Aún no hay componentes. Agrega el primero abajo.</div></td></tr>
                  ) : (
                    items.map((c) => (
                      <tr key={c.id}>
                        <td><code className="mono">{c.codigo}</code></td>
                        <td><strong>{c.nombre}</strong></td>
                        <td><span className={`tag ${NIVEL_TAG[c.nivel ?? ''] ?? 't-mute'}`}>{c.nivel}</span></td>
                        <td>{c.tipo}</td>
                        <td><span className={`tag ${CRIT_TAG[c.critico ?? ''] ?? 't-mute'}`}>{c.critico}</span></td>
                        <td style={{ textAlign: 'right' }}><button className="btn btn-danger" onClick={() => eliminar(c.id)} aria-label="Eliminar"><Trash2 className="ico-sm" /></button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid c3" style={{ marginTop: 16 }}>
              <div className="field"><label>Código</label><input value={form.codigo} placeholder="Ej: SC61-MOT" onChange={(e) => setForm({ ...form, codigo: e.target.value })} /></div>
              <div className="field"><label>Componente</label><input value={form.nombre} placeholder="Ej: Motor eléctrico" onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setHint('') }} /></div>
              <div className="field"><label>Tipo</label><input value={form.tipo} placeholder="Ej: Mecánico" onChange={(e) => setForm({ ...form, tipo: e.target.value })} /></div>
              <div className="field"><label>Nivel</label><Dropdown value={form.nivel} onChange={(v) => setForm({ ...form, nivel: v })} options={NIVELES} ariaLabel="Nivel" /></div>
              <div className="field"><label>Crítico</label><Dropdown value={form.critico} onChange={(v) => setForm({ ...form, critico: v })} options={CRITICOS} ariaLabel="Crítico" /></div>
            </div>
            {hint && <div className="msg msg-err">{hint}</div>}
            <div className="btn-row"><button className="btn btn-dark" onClick={agregar} disabled={busy}><Plus className="ico-sm" /> Agregar componente</button></div>
          </div>

          <div className="card">
            <CardHead step={2} icon={AlertTriangle} title="Criterio de criticidad" sub="¿Qué pasa si este componente falla?" />
            <div className="crit-grid">
              <div className="crit-card crit-alto"><div className="crit-hd"><AlertTriangle className="ico-sm" /> Alto</div><div className="crit-desc">Para el proceso o causa riesgo de seguridad inmediato</div></div>
              <div className="crit-card crit-medio"><div className="crit-hd"><CircleDot className="ico-sm" /> Medio</div><div className="crit-desc">Afecta eficiencia pero no detiene el proceso</div></div>
              <div className="crit-card crit-bajo"><div className="crit-hd"><Minus className="ico-sm" /> Bajo</div><div className="crit-desc">Impacto mínimo, no afecta la operación</div></div>
            </div>
          </div>
        </>
      )}

      <div className="nav-foot">
        <button className="btn btn-good" onClick={onDone}><Check className="ico-sm" /> Completado</button>
        <button className="btn btn-dark" onClick={goNext}>Plan de Mantenimiento <ArrowRight className="ico-sm" /></button>
      </div>
    </>
  )
}
