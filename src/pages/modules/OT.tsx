import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, FileText, Pencil, Plus, RotateCcw, Save, Trash2, X, Zap } from '../../components/icons'
import { CardHead, DatePicker, Dropdown } from '../../components/ui'
import { actualizarOT, agregarOT, borrarOT, listarOTs } from '../../data/db'
import { TECNICOS } from '../../data/mock'
import { OT_ESTADOS, estadoMeta, siguientePaso } from '../../lib/ot'
import type { Equipo, OrdenTrabajo } from '../../lib/types'

interface Props {
  equipo: Equipo | null
  onNewEquipo: () => void
  onChanged: () => void
  goNext: () => void
}

const EMPTY = {
  codigo: '', tipo: 'preventivo', estado: 'abierta',
  responsable: '', repuestos: '',
  fecha_emision: '', fecha_planificada: '', actividad: '', prioridad: 'Normal', tiempo_estimado: '', materiales: '',
  falla: '', fecha_falla: '', tiempo_paro: '', tiempo_reparacion: '', causa_raiz: '', accion: '',
}
type Form = typeof EMPTY

/** Sugiere el siguiente código de OT para que emitir nunca quede bloqueado. */
function sugerirCodigo(n: number): string {
  return `OT-${new Date().getFullYear()}-${String(n + 1).padStart(4, '0')}`
}

export function OT({ equipo, onNewEquipo, onChanged, goNext }: Props) {
  const [ots, setOts] = useState<OrdenTrabajo[]>([])
  const [f, setF] = useState<Form>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!equipo) { setOts([]); setF(EMPTY); setEditId(null); return }
    listarOTs(equipo.id)
      .then((lista) => { setOts(lista); resetForm(lista.length) })
      .catch((err) => console.error('OTs:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipo])

  function set<K extends keyof Form>(k: K, v: Form[K]) { setF((p) => ({ ...p, [k]: v })) }

  function resetForm(count: number) {
    setF({ ...EMPTY, codigo: sugerirCodigo(count) })
    setEditId(null)
  }

  function editar(ot: OrdenTrabajo) {
    const d = (ot.data ?? {}) as Record<string, string>
    setF({ ...EMPTY, ...d, codigo: ot.codigo ?? '', tipo: ot.tipo ?? 'preventivo', estado: ot.estado ?? 'abierta' })
    setEditId(ot.id)
    setConfirmDel(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardar() {
    if (!equipo) return
    const codigo = f.codigo.trim() || sugerirCodigo(ots.length)
    setBusy(true)
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
      onChanged()
    } catch (err) { console.error('Guardar OT:', err) } finally { setBusy(false) }
  }

  async function avanzar(ot: OrdenTrabajo, nuevoEstado: string) {
    try {
      await actualizarOT(ot.id, { estado: nuevoEstado })
      if (equipo) setOts(await listarOTs(equipo.id))
      if (editId === ot.id) set('estado', nuevoEstado)
      onChanged()
    } catch (err) { console.error('Estado OT:', err) }
  }

  async function eliminar(id: string) {
    try {
      await borrarOT(id)
      const lista = equipo ? await listarOTs(equipo.id) : []
      setOts(lista)
      setConfirmDel(null)
      if (editId === id) resetForm(lista.length)
      onChanged()
    } catch (err) { console.error('Borrar OT:', err) }
  }

  // El técnico guardado puede no estar en la lista mock: lo incluimos como opción.
  const tecnicoOpts = Array.from(new Set([...TECNICOS, ...(f.responsable ? [f.responsable] : [])]))

  return (
    <>
      <div className="sec-head">
        <div className="sec-ico"><FileText className="ico" strokeWidth={1.75} /></div>
        <div>
          <div className="sec-eyebrow">Módulo 05</div>
          <h2>Órdenes de trabajo</h2>
          <p>La OT es el documento central de control del mantenimiento. Gestiona órdenes <strong>Preventivas</strong> (desde el plan) y <strong>Correctivas</strong> (desde una falla), y llévalas por su ciclo real: <strong>Programada → En ejecución → Cerrada</strong>.</p>
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
              <div className="field"><label>Estado</label><Dropdown value={f.estado} onChange={(v) => set('estado', v)} ariaLabel="Estado" options={OT_ESTADOS.map((e) => ({ value: e.value, label: e.label }))} /></div>
              <div className="field"><label>Técnico asignado</label><Dropdown value={f.responsable} onChange={(v) => set('responsable', v)} ariaLabel="Técnico asignado" placeholder="Sin asignar" options={tecnicoOpts} /></div>

              {f.tipo === 'preventivo' ? (
                <>
                  <div className="field"><label>Fecha de emisión</label><DatePicker value={f.fecha_emision} onChange={(v) => set('fecha_emision', v)} ariaLabel="Fecha de emisión" /></div>
                  <div className="field"><label>Fecha planificada</label><DatePicker value={f.fecha_planificada} onChange={(v) => set('fecha_planificada', v)} ariaLabel="Fecha planificada" /></div>
                  <div className="field"><label>Prioridad</label><Dropdown value={f.prioridad} onChange={(v) => set('prioridad', v)} ariaLabel="Prioridad" options={['Normal', 'Urgente', 'Diferible']} /></div>
                  <div className="field"><label>Tiempo estimado (h)</label><input value={f.tiempo_estimado} placeholder="Ej: 1.5" onChange={(e) => set('tiempo_estimado', e.target.value)} /></div>
                  <div className="field full"><label>Actividad a realizar</label><input value={f.actividad} placeholder="Ej: Lubricación mensual de rodamientos" onChange={(e) => set('actividad', e.target.value)} /></div>
                  <div className="field full"><label>Materiales requeridos</label><textarea value={f.materiales} placeholder="Grasa SKF LGMT2 — 20 gr; EPP..." onChange={(e) => set('materiales', e.target.value)} /></div>
                </>
              ) : (
                <>
                  <div className="field"><label>Fecha de falla</label><DatePicker value={f.fecha_falla} onChange={(v) => set('fecha_falla', v)} ariaLabel="Fecha de falla" /></div>
                  <div className="field"><label>Tiempo de paro (h)</label><input value={f.tiempo_paro} placeholder="Ej: 3.5" onChange={(e) => set('tiempo_paro', e.target.value)} /></div>
                  <div className="field"><label>Tiempo de reparación (h)</label><input value={f.tiempo_reparacion} placeholder="Ej: 2.0" onChange={(e) => set('tiempo_reparacion', e.target.value)} /></div>
                  <div className="field full"><label>Falla reportada</label><input value={f.falla} placeholder="Ej: Ruido anormal en rodamiento trasero" onChange={(e) => set('falla', e.target.value)} /></div>
                  <div className="field full"><label>Causa raíz (RCFA)</label><textarea value={f.causa_raiz} placeholder="Análisis de causa raíz de la falla..." onChange={(e) => set('causa_raiz', e.target.value)} /></div>
                  <div className="field full"><label>Acción correctiva tomada</label><textarea value={f.accion} placeholder="Qué se hizo para resolver la falla..." onChange={(e) => set('accion', e.target.value)} /></div>
                </>
              )}
              <div className="field full"><label>Repuestos / consumibles usados (uno por línea)</label><textarea value={f.repuestos} placeholder={'1 x Rodamiento SKF 6205\n20 gr Grasa SKF LGMT2'} onChange={(e) => set('repuestos', e.target.value)} /></div>
            </div>
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
              const est = estadoMeta(ot.estado)
              const paso = siguientePaso(ot.estado)
              const repuestos = (d.repuestos ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
              return (
                <div className={`ot-card${editId === ot.id ? ' editing' : ''}`} key={ot.id}>
                  <div className={`ot-head ${prev ? 'prev' : 'corr'}`}>
                    <div className="ot-head-l">
                      {prev ? <FileText className="ico-sm" /> : <AlertTriangle className="ico-sm" />}
                      <span className="ot-code">{ot.codigo}</span>
                      <span className="ot-type">{prev ? 'Preventivo' : 'Correctivo'}</span>
                    </div>
                    <span className={`tag ${est.tag}`}>{est.label}</span>
                  </div>
                  <div className="ot-body">
                    {d.responsable && <div className="row"><b>Técnico:</b> {d.responsable}</div>}
                    {prev ? (
                      <>
                        {d.actividad && <div className="row"><b>Actividad:</b> {d.actividad}</div>}
                        {d.fecha_planificada && <div className="row"><b>Planificada:</b> {d.fecha_planificada}</div>}
                        {d.prioridad && <div className="row"><b>Prioridad:</b> {d.prioridad}</div>}
                        {d.materiales && <div className="row"><b>Materiales:</b> {d.materiales}</div>}
                      </>
                    ) : (
                      <>
                        {d.falla && <div className="row"><b>Falla:</b> {d.falla}</div>}
                        {d.fecha_falla && <div className="row"><b>Fecha de falla:</b> {d.fecha_falla}</div>}
                        {d.tiempo_paro && <div className="row"><b>Tiempo de paro:</b> {d.tiempo_paro} h</div>}
                        {d.tiempo_reparacion && <div className="row"><b>Tiempo de reparación:</b> {d.tiempo_reparacion} h</div>}
                        {d.causa_raiz && <div className="row"><b>Causa raíz:</b> {d.causa_raiz}</div>}
                        {d.accion && <div className="row"><b>Acción:</b> {d.accion}</div>}
                      </>
                    )}
                    {repuestos.length > 0 && <div className="row"><b>Repuestos:</b> {repuestos.join(' · ')}</div>}
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
                        {paso && (
                          <button className="btn btn-good" onClick={() => avanzar(ot, paso.estado)}>
                            {paso.estado === 'cerrada' ? <Check className="ico-sm" /> : <Zap className="ico-sm" />} {paso.label}
                          </button>
                        )}
                        {ot.estado === 'cerrada' && (
                          <button className="btn btn-ghost" onClick={() => avanzar(ot, 'abierta')}><RotateCcw className="ico-sm" /> Reabrir</button>
                        )}
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
        <button className="btn btn-dark" onClick={goNext}>Siguiente: KPIs + IA <ArrowRight className="ico-sm" /></button>
      </div>
    </>
  )
}
