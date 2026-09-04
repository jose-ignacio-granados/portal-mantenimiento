import { useEffect, useState } from 'react'
import { Area, CardHead, Checkbox, DateField, Select, Text } from '../../components/ui'
import { ArrowRight, Boxes, Check, Factory, FileText, Info, MapPin, Plus, Save, Trash2, Zap } from '../../components/icons'
import { borrarEquipo, guardarEquipo } from '../../data/db'
import type { Equipo } from '../../lib/types'

interface Props {
  equipos: Equipo[]
  activoId: string | null
  newSignal: number
  onSelect: (id: string) => void
  onChanged: () => Promise<void> | void
  onDone: () => void
  goNext: () => void
}

const EMPTY = {
  sistema: '', subsistema: '', codigo_posicion: '', codigo: '', nombre: '',
  tipo_activo: 'Mecánico', criticidad: 'Alta', familia: 'Transportadores', clase_mant: 'Preventivo',
  planta: '', area: '', linea: '', departamento: '', ubicacion_fisica: '',
  marca: '', modelo: '', serial: '', anio_fab: '', anio_inst: '', fabricante: '',
  proveedor: '', costo: '', vida_util: '', garantia: '', centro_costos: '',
  potencia: '', voltaje: '', amperios: '', fases: '', frecuencia: '', capacidad: '',
  electricidad: '', aire: '', lubricacion: '', agua: '', vapor: '', gas: '',
  descripcion: '',
}
type Form = typeof EMPTY

const EMPTY_DOCS = { manual_op: false, manual_mant: false, planos: false, diagrama: false, catalogo: false }
type Docs = typeof EMPTY_DOCS
const DOC_LABELS: [keyof Docs, string][] = [
  ['manual_op', 'Manual de operación'],
  ['manual_mant', 'Manual de mantenimiento'],
  ['planos', 'Planos mecánicos'],
  ['diagrama', 'Diagrama eléctrico'],
  ['catalogo', 'Catálogo de piezas'],
]

export function AME({ equipos, activoId, newSignal, onSelect, onChanged, onDone, goNext }: Props) {
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState<Form>(EMPTY)
  const [docs, setDocs] = useState<Docs>(EMPTY_DOCS)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgErr, setMsgErr] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [showHero, setShowHero] = useState<boolean>(() => {
    try { return localStorage.getItem('portal_onboarded') !== '1' } catch { return true }
  })

  const editId = creating ? null : activoId

  // Llamado de una sola vez: ver el ejemplo y empezar el propio en blanco.
  function crearDesdeCero() {
    try { localStorage.setItem('portal_onboarded', '1') } catch { /* ignore */ }
    setShowHero(false)
    nuevo()
  }

  // El boton "Nuevo equipo" de la barra superior pide un formulario en blanco.
  useEffect(() => {
    if (newSignal > 0) { setCreating(true); setF(EMPTY); setDocs(EMPTY_DOCS); setMsg(''); setConfirmDel(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSignal])

  useEffect(() => {
    setConfirmDel(false)
    if (!editId) { setF(EMPTY); setDocs(EMPTY_DOCS); return }
    const e = equipos.find((x) => x.id === editId)
    if (!e) return
    const raw = (e.data ?? {}) as Record<string, unknown>
    const { docs: rawDocs, ...rest } = raw
    setF({ ...EMPTY, ...(rest as Partial<Form>), codigo: e.codigo ?? '', nombre: e.nombre ?? '', criticidad: e.criticidad ?? 'Alta' })
    setDocs({ ...EMPTY_DOCS, ...((rawDocs as Partial<Docs>) ?? {}) })
  }, [editId, equipos])

  function set<K extends keyof Form>(k: K, v: Form[K]) { setF((prev) => ({ ...prev, [k]: v })) }

  function nuevo() { setCreating(true); setF(EMPTY); setDocs(EMPTY_DOCS); setMsg(''); setConfirmDel(false) }

  async function guardar() {
    setBusy(true); setMsg('')
    try {
      const { codigo, nombre, criticidad, ...rest } = f
      const guardado = await guardarEquipo({ id: editId ?? undefined, codigo, nombre, criticidad, data: { ...rest, docs } })
      await onChanged()
      setCreating(false)
      onSelect(guardado.id)
      setMsgErr(false); setMsg('Equipo guardado.')
    } catch (err) {
      setMsgErr(true); setMsg(err instanceof Error ? err.message : 'Error al guardar')
    } finally { setBusy(false) }
  }

  async function eliminar() {
    if (!editId) return
    setBusy(true)
    try { await borrarEquipo(editId); await onChanged(); nuevo() }
    catch (err) { setMsgErr(true); setMsg(err instanceof Error ? err.message : 'Error al eliminar') }
    finally { setBusy(false) }
  }

  return (
    <>
      <div className="sec-head">
        <div className="sec-ico"><Boxes className="ico" strokeWidth={1.75} /></div>
        <div>
          <div className="sec-eyebrow">Módulo 01</div>
          <h2>Archivo Maestro de Equipos</h2>
          <p>Registra la ficha técnica completa de cada equipo. Es la base de todo el sistema: sin un AME bien estructurado no se puede planificar ni controlar el mantenimiento.</p>
        </div>
      </div>

      {showHero && editId && (
        <div className="onboard">
          <div className="onboard-txt">
            <div className="onboard-title">Estás viendo un equipo de ejemplo</div>
            <div className="onboard-sub">Míralo para entender cómo funciona el portal. Para crear el tuyo, pulsa <strong>Crear mi equipo</strong> aquí abajo — o, más adelante, el botón <strong>+</strong> de la barra superior, arriba a la derecha, junto al selector de equipo. El formulario se vaciará para que lo llenes desde cero.</div>
          </div>
          <button className="btn btn-primary onboard-cta" onClick={crearDesdeCero}><Plus className="ico-sm" /> Crear mi equipo</button>
        </div>
      )}

      <div className="ame-context">
        <Info className="ico-sm" />
        {editId ? (
          <span>Estás editando <strong>{f.codigo || f.nombre || 'este equipo'}</strong>{equipos.length > 0 ? ` · tienes ${equipos.length} en tu catálogo` : ''}. Para registrar otro, pulsa el botón <strong>+</strong> arriba a la derecha, junto al selector de equipo.</span>
        ) : (
          <span>Estás creando {equipos.length > 0 ? 'un equipo nuevo' : 'tu primer equipo'}. Completa la ficha y pulsa <strong>Crear equipo</strong> al final; puedes dejar campos en blanco.</span>
        )}
      </div>

      <div className="card">
        <CardHead step={1} icon={Info} title="Información general" sub="Identifica y clasifica el activo dentro de tu organización" />
        <div className="grid">
          <Text label="Sistema" value={f.sistema} onChange={(v) => set('sistema', v)} placeholder="Ej: Sistema de Transporte" />
          <Text label="Sub-sistema" value={f.subsistema} onChange={(v) => set('subsistema', v)} placeholder="Ej: Línea de Producción A" />
          <Text label="Código de posición" value={f.codigo_posicion} onChange={(v) => set('codigo_posicion', v)} placeholder="Ej: TRN-001" />
          <Text label="Código del equipo" value={f.codigo} onChange={(v) => set('codigo', v)} placeholder="Ej: SC-61" />
          <Text label="Nombre del equipo" full value={f.nombre} onChange={(v) => set('nombre', v)} placeholder="Ej: Transportador Sin Fin SC-61" />
          <Select label="Tipo de activo" value={f.tipo_activo} onChange={(v) => set('tipo_activo', v)} options={['Mecánico', 'Eléctrico', 'Electrónico', 'Neumático', 'Hidráulico', 'Civil']} />
          <Select label="Criticidad" value={f.criticidad} onChange={(v) => set('criticidad', v)} options={['Alta', 'Media', 'Baja']} />
          <Select label="Familia de equipos" value={f.familia} onChange={(v) => set('familia', v)} options={['Transportadores', 'Motores', 'Bombas', 'Compresores', 'Hornos', 'Calderas', 'Otro']} />
          <Select label="Clase de mantenimiento" value={f.clase_mant} onChange={(v) => set('clase_mant', v)} options={['Preventivo', 'Predictivo', 'Correctivo', 'Mixto']} />
        </div>
      </div>

      <div className="card">
        <CardHead step={2} icon={MapPin} title="Ubicación" sub="Dónde está físicamente dentro de la planta" />
        <div className="grid">
          <Text label="Planta" value={f.planta} onChange={(v) => set('planta', v)} placeholder="Ej: Planta Principal" />
          <Text label="Área" value={f.area} onChange={(v) => set('area', v)} placeholder="Ej: Área de Producción" />
          <Text label="Línea de producción" value={f.linea} onChange={(v) => set('linea', v)} placeholder="Ej: Línea 1" />
          <Text label="Departamento" value={f.departamento} onChange={(v) => set('departamento', v)} placeholder="Ej: Mantenimiento" />
          <Text label="Ubicación física exacta" full value={f.ubicacion_fisica} onChange={(v) => set('ubicacion_fisica', v)} placeholder="Ej: Nave A, columna 12, nivel 2" />
        </div>
      </div>

      <div className="card">
        <CardHead step={3} icon={Factory} title="Fabricante y adquisición" sub="Trazabilidad del equipo desde su origen" />
        <div className="grid">
          <Text label="Marca" value={f.marca} onChange={(v) => set('marca', v)} placeholder="Ej: Siemens" />
          <Text label="Modelo" value={f.modelo} onChange={(v) => set('modelo', v)} placeholder="Ej: SC-Series 61" />
          <Text label="Serial / N° de serie" value={f.serial} onChange={(v) => set('serial', v)} placeholder="Ej: SN-2019-4872" />
          <Text label="Año de fabricación" value={f.anio_fab} onChange={(v) => set('anio_fab', v)} placeholder="Ej: 2019" />
          <Text label="Año de instalación" value={f.anio_inst} onChange={(v) => set('anio_inst', v)} placeholder="Ej: 2020" />
          <Text label="Fabricante" value={f.fabricante} onChange={(v) => set('fabricante', v)} placeholder="Ej: Siemens AG" />
          <Text label="Proveedor / Representante" value={f.proveedor} onChange={(v) => set('proveedor', v)} placeholder="Ej: Tecnomec C.A." />
          <Text label="Costo de adquisición" value={f.costo} onChange={(v) => set('costo', v)} placeholder="Ej: $12,500" />
          <Text label="Vida útil estimada (años)" value={f.vida_util} onChange={(v) => set('vida_util', v)} placeholder="Ej: 15" />
          <DateField label="Garantía hasta" value={f.garantia} onChange={(v) => set('garantia', v)} />
          <Text label="Centro de costos" value={f.centro_costos} onChange={(v) => set('centro_costos', v)} placeholder="Ej: CC-PROD-01" />
        </div>
      </div>

      <div className="card">
        <CardHead step={4} icon={Zap} title="Descripción técnica" sub="Parámetros eléctricos, dimensiones y servicios requeridos" />
        <div className="fieldset-lbl">Parámetros eléctricos</div>
        <div className="grid c3">
          <Text label="Potencia (kW)" value={f.potencia} onChange={(v) => set('potencia', v)} placeholder="Ej: 7.5" />
          <Text label="Voltaje (V)" value={f.voltaje} onChange={(v) => set('voltaje', v)} placeholder="Ej: 440" />
          <Text label="Amperios (A)" value={f.amperios} onChange={(v) => set('amperios', v)} placeholder="Ej: 15.2" />
          <Text label="Fases" value={f.fases} onChange={(v) => set('fases', v)} placeholder="Ej: 3" />
          <Text label="Frecuencia (Hz)" value={f.frecuencia} onChange={(v) => set('frecuencia', v)} placeholder="Ej: 60" />
          <Text label="Capacidad" value={f.capacidad} onChange={(v) => set('capacidad', v)} placeholder="Ej: 500 kg/h" />
        </div>
        <div className="fieldset-lbl">Servicios requeridos</div>
        <div className="grid c3">
          <Text label="Electricidad" value={f.electricidad} onChange={(v) => set('electricidad', v)} placeholder="Sí / Amperaje" />
          <Text label="Aire comprimido" value={f.aire} onChange={(v) => set('aire', v)} placeholder="Sí / Bar" />
          <Text label="Lubricación" value={f.lubricacion} onChange={(v) => set('lubricacion', v)} placeholder="Tipo / Frecuencia" />
          <Text label="Agua" value={f.agua} onChange={(v) => set('agua', v)} placeholder="Sí / L/min" />
          <Text label="Vapor" value={f.vapor} onChange={(v) => set('vapor', v)} placeholder="Sí / PSI" />
          <Text label="Gas" value={f.gas} onChange={(v) => set('gas', v)} placeholder="Sí / No" />
        </div>
        <div className="fieldset-lbl">Documentos disponibles</div>
        <div className="checks">
          {DOC_LABELS.map(([k, lbl]) => (
            <Checkbox key={k} className="chip" checked={docs[k]} label={lbl} onChange={(v) => setDocs((p) => ({ ...p, [k]: v }))} />
          ))}
        </div>
      </div>

      <div className="card">
        <CardHead step={5} icon={FileText} title="Descripción de funcionamiento" sub="¿Cómo opera y cuál es su función en el proceso?" />
        <Area label="Funcionamiento y función en el proceso" value={f.descripcion} onChange={(v) => set('descripcion', v)} placeholder="Describe cómo opera el equipo, su función dentro del proceso productivo, condiciones normales de operación y cualquier restricción importante..." />
      </div>

      {msg && <div className={`msg ${msgErr ? 'msg-err' : 'msg-ok'}`}>{msg}</div>}

      <div className="nav-foot">
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button className="btn btn-primary" onClick={guardar} disabled={busy}><Save className="ico-sm" /> {busy ? 'Guardando…' : (editId ? 'Guardar cambios' : 'Crear equipo')}</button>
          <button className="btn btn-good" onClick={onDone}><Check className="ico-sm" /> Completado</button>
        </div>
        <button className="btn btn-dark" onClick={goNext}>Despiece <ArrowRight className="ico-sm" /></button>
      </div>

      {editId && (
        <div className="danger-row">
          {confirmDel ? (
            <>
              <span>¿Eliminar este equipo? No se puede deshacer.</span>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button className="btn btn-danger-solid" onClick={eliminar} disabled={busy}><Trash2 className="ico-sm" /> Sí, eliminar</button>
            </>
          ) : (
            <button className="del-link" onClick={() => setConfirmDel(true)}><Trash2 className="ico-sm" /> Eliminar este equipo</button>
          )}
        </div>
      )}
    </>
  )
}
