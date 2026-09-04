import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, FileText, Pencil, Plus, RotateCcw, Save, Trash2, X } from '../../components/icons'
import { CardHead, DatePicker, Dropdown } from '../../components/ui'
import { actualizarOT, agregarOT, borrarOT, listarOTs } from '../../data/db'
import type { Equipo, OrdenTrabajo } from '../../lib/types'

interface Props {
  equipo: Equipo | null
  onNewEquipo: () => void
  onDone: () => void
  goNext: () => void
}

const EMPTY = {
  codigo: '', tipo: 'preventivo', estado: 'abierta',
  fecha_emision: '', fecha_planificada: '', responsable: '', actividad: '', prioridad: 'Normal', tiempo_estimado: '', materiales: '',
  falla: '', fecha_falla: '', tiempo_paro: '', causa_raiz: '', accion: '',
}
type Form = typeof EMPTY

/** Sugiere el siguiente código de OT para que emitir nunca quede bloqueado. */
function sugerirCodigo(n: number): string {
  return `OT-${new Date().getFullYear()}-${String(n + 1).padStart(4, '0')}`
}

export function OT({ equipo, onNewEquipo, onDone, goNext }: Props) {
  const [ots, setOts] = useState<OrdenTrabajo[]>([])
  const [f, setF] = useState<Form>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (!equipo) { setOts([]); setF(EMPTY); setEditId(null); return }
    listarOTs(equipo.id)
      .then((lista) => { setOts(lista); resetForm(lista.length) })
      .catch((err) => console.error('OTs:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipo])

  function set<K extends keyof Form>(k: K, v: Form[K]) { setF((p) => ({ ...p, [k]: v })); setHint('') }

  function resetForm(count: number) {
    setF({ ...EMPTY, codigo: sugerirCodigo(count) })
    setEditId(null)
    setHint('')
  }

  function editar(ot: OrdenTrabajo) {
    const d = (ot.data ?? {}) as Record<string, string>
    setF({ ...EMPTY, ...d, codigo: ot.codigo ?? '', tipo: ot.tipo ?? 'preventivo', estado: ot.estado ?? 'abierta' })
    setEditId(ot.id)
    setConfirmDel(null)
    setHint('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardar() {
    if (!equipo) return
    const codigo = f.codigo.trim() || sugerirCodigo(ots.length)
    setBusy(true); setHint('')
    try {
      const { codigo: _formCodigo, tipo, estado, ...data } = f
      void _formCodigo
      if (editId) {
        await actualizarOT(editId, { codigo, tipo, estado, data })
      } else {
        await agregarOT({ equipo_id: equipo.id, codigo, tipo, estado, data })
      }
      const lista = await listarOTs(equipo.id)
      setOts(lista)
      resetForm(lista.length)
    } catch (err) { console.error('Guardar OT:', err) } finally { setBusy(false) }
  }

  async function toggleEstado(ot: OrdenTrabajo) {
    const nuevo = ot.estado === 'cerrada' ? 'abierta' : 'cerrada'
    try {
      await actualizarOT(ot.id, { estado: nuevo })
      if (equipo) setOts(await listarOTs(equipo.id))
      if (editId === ot.id) set('estado', nuevo)
    } catch (err) { console.error('Estado OT:', err) }
  }

  async function eliminar(id: string) {
    try {
      await borrarOT(id)
      const lista = equipo ? await listarOTs(equipo.id) : []
      setOts(lista)
      setConfirmDel(null)
      if (editId === id) resetForm(lista.length)
    } catch (err) { console.error('Borrar OT:', err) }
  }

  return (
    <>
      <div className="sec-head">
        <div className="sec-ico"><FileText className="ico" strokeWidth={1.75} /></div>
        <div>
          <div className="sec-eyebrow">Módulo 05</div>
          <h2>Órdenes de trabajo</h2>
          <p>La OT es el documento central de control del mantenimiento. Genera y gestiona órdenes <strong>Preventivas</strong> (desde el plan) y <strong>Correctivas</strong> (desde una falla reportada). Cada orden se puede <strong>editar</strong>, <strong>cerrar</strong> al completarla o <strong>reabrir</strong> si hace falta.</p>
        </div>
      </div>

      {!equipo ? (
        <div className="card"><div className="empty">
          <FileText className="ico" />
          <span>Aún no tienes un equipo. Créalo y aquí emitirás sus órdenes de trabajo.</span>
          <button className="btn btn-primary" onClick={onNewEquipo}><Plus className="ico-sm" /> Crear mi primer equipo</button>
        </div></div>
      ) : (
        <>
          <div className="card">
            <CardHead
              step={1}
              icon={editId ? Pencil : FileText}
              title={editId ? 'Editar orden de trabajo' : 'Nueva orden de trabajo'}
              sub={editId ? `Modificando ${f.codigo || 'la orden'}` : `Para ${equipo.codigo || equipo.nombre}`}
            />
            <div className="grid">
              <div className="field"><label>Código OT</label><input value={f.codigo} placeholder="Ej: OT-2026-0142" onChange={(e) => set('codigo', e.target.value)} /></div>
              <div className="field"><label>Tipo</label><Dropdown value={f.tipo} onChange={(v) => set('tipo', v)} ariaLabel="Tipo" options={[{ value: 'preventivo', label: 'Preventivo' }, { value: 'correctivo', label: 'Correctivo' }]} /></div>
              <div className="field"><label>Estado</label><Dropdown value={f.estado} onChange={(v) => set('estado', v)} ariaLabel="Estado" options={[{ value: 'abierta', label: 'Abierta' }, { value: 'cerrada', label: 'Cerrada' }]} /></div>

              {f.tipo === 'preventivo' ? (
                <>
                  <div className="field"><label>Fecha de emisión</label><DatePicker value={f.fecha_emision} onChange={(v) => set('fecha_emision', v)} ariaLabel="Fecha de emisión" /></div>
                  <div className="field"><label>Fecha planificada</label><DatePicker value={f.fecha_planificada} onChange={(v) => set('fecha_planificada', v)} ariaLabel="Fecha planificada" /></div>
                  <div className="field"><label>Responsable</label><input value={f.responsable} placeholder="Técnico asignado" onChange={(e) => set('responsable', e.target.value)} /></div>
                  <div className="field"><label>Prioridad</label><Dropdown value={f.prioridad} onChange={(v) => set('prioridad', v)} ariaLabel="Prioridad" options={['Normal', 'Urgente', 'Diferible']} /></div>
                  <div className="field"><label>Tiempo estimado (h)</label><input value={f.tiempo_estimado} placeholder="Ej: 1.5" onChange={(e) => set('tiempo_estimado', e.target.value)} /></div>
                  <div className="field full"><label>Actividad a realizar</label><input value={f.actividad} placeholder="Ej: Lubricación mensual de rodamientos" onChange={(e) => set('actividad', e.target.value)} /></div>
                  <div className="field full"><label>Materiales requeridos</label><textarea value={f.materiales} placeholder="Grasa SKF LGMT2 — 20 gr; EPP..." onChange={(e) => set('materiales', e.target.value)} /></div>
                </>
              ) : (
                <>
                  <div className="field"><label>Fecha de falla</label><DatePicker value={f.fecha_falla} onChange={(v) => set('fecha_falla', v)} ariaLabel="Fecha de falla" /></div>
                  <div className="field"><label>Tiempo de paro (h)</label><input value={f.tiempo_paro} placeholder="Ej: 3.5" onChange={(e) => set('tiempo_paro', e.target.value)} /></div>
                  <div className="field full"><label>Falla reportada</label><input value={f.falla} placeholder="Ej: Ruido anormal en rodamiento trasero" onChange={(e) => set('falla', e.target.value)} /></div>
                  <div className="field full"><label>Causa raíz (RCFA)</label><textarea value={f.causa_raiz} placeholder="Análisis de causa raíz de la falla..." onChange={(e) => set('causa_raiz', e.target.value)} /></div>
                  <div className="field full"><label>Acción correctiva tomada</label><textarea value={f.accion} placeholder="Qué se hizo para resolver la falla..." onChange={(e) => set('accion', e.target.value)} /></div>
                </>
              )}
            </div>
            {hint && <div className="msg msg-err">{hint}</div>}
            <div className="btn-row">
              <button className="btn btn-primary" onClick={guardar} disabled={busy}>
                {editId ? <><Save className="ico-sm" /> Guardar cambios</> : <><Plus className="ico-sm" /> Emitir OT</>}
              </button>
              {editId && (
                <button className="btn btn-ghost" onClick={() => resetForm(ots.length)} disabled={busy}><X className="ico-sm" /> Cancelar edición</button>
              )}
            </div>
          </div>

          {ots.length === 0 ? (
            <div className="card"><div className="empty">Aún no hay órdenes de trabajo para este equipo.</div></div>
          ) : (
            ots.map((ot) => {
              const d = (ot.data ?? {}) as Record<string, string>
              const prev = ot.tipo === 'preventivo'
              const cerrada = ot.estado === 'cerrada'
              return (
                <div className={`ot-card${editId === ot.id ? ' editing' : ''}`} key={ot.id}>
                  <div className={`ot-head ${prev ? 'prev' : 'corr'}`}>
                    <div className="ot-head-l">
                      {prev ? <FileText className="ico-sm" /> : <AlertTriangle className="ico-sm" />}
                      <span className="ot-code">{ot.codigo}</span>
                      <span className="ot-type">{prev ? 'Preventivo' : 'Correctivo'}</span>
                    </div>
                    <span className={`tag ${cerrada ? 't-mute' : 't-good'}`}>{cerrada ? 'Cerrada' : 'Abierta'}</span>
                  </div>
                  <div className="ot-body">
                    {prev ? (
                      <>
                        {d.actividad && <div className="row"><b>Actividad:</b> {d.actividad}</div>}
                        {d.responsable && <div className="row"><b>Responsable:</b> {d.responsable}</div>}
                        {d.fecha_planificada && <div className="row"><b>Planificada:</b> {d.fecha_planificada}</div>}
                        {d.prioridad && <div className="row"><b>Prioridad:</b> {d.prioridad}</div>}
                        {d.materiales && <div className="row"><b>Materiales:</b> {d.materiales}</div>}
                        {!d.actividad && !d.responsable && !d.fecha_planificada && !d.prioridad && !d.materiales && (
                          <div className="row ot-empty">Sin detalles cargados. Pulsa Editar para completarla.</div>
                        )}
                      </>
                    ) : (
                      <>
                        {d.falla && <div className="row"><b>Falla:</b> {d.falla}</div>}
                        {d.fecha_falla && <div className="row"><b>Fecha de falla:</b> {d.fecha_falla}</div>}
                        {d.tiempo_paro && <div className="row"><b>Tiempo de paro:</b> {d.tiempo_paro} h</div>}
                        {d.causa_raiz && <div className="row"><b>Causa raíz:</b> {d.causa_raiz}</div>}
                        {d.accion && <div className="row"><b>Acción:</b> {d.accion}</div>}
                        {!d.falla && !d.fecha_falla && !d.tiempo_paro && !d.causa_raiz && !d.accion && (
                          <div className="row ot-empty">Sin detalles cargados. Pulsa Editar para completarla.</div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="ot-foot">
                    {confirmDel === ot.id ? (
                      <>
                        <span className="ot-foot-q">¿Eliminar esta orden?</span>
                        <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button>
                        <button className="btn btn-danger-solid" onClick={() => eliminar(ot.id)}><Trash2 className="ico-sm" /> Sí, eliminar</button>
                      </>
                    ) : (
                      <>
                        <button className={`btn ${cerrada ? 'btn-ghost' : 'btn-good'}`} onClick={() => toggleEstado(ot)}>
                          {cerrada ? <><RotateCcw className="ico-sm" /> Reabrir</> : <><Check className="ico-sm" /> Cerrar orden</>}
                        </button>
                        <button className="btn btn-ghost" onClick={() => editar(ot)}><Pencil className="ico-sm" /> Editar</button>
                        <button className="btn btn-ghost ot-del" onClick={() => setConfirmDel(ot.id)}><Trash2 className="ico-sm" /> Eliminar</button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </>
      )}

      <div className="nav-foot">
        <button className="btn btn-good" onClick={onDone}><Check className="ico-sm" /> Completado</button>
        <button className="btn btn-dark" onClick={goNext}>KPIs + IA <ArrowRight className="ico-sm" /></button>
      </div>
    </>
  )
}
