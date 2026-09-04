import { useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, CheckCircle2, ClipboardList, FileText, Flag, Gauge, Save, Sparkles, Zap } from '../../components/icons'
import { CardHead } from '../../components/ui'
import { guardarKpi, listarKpis, listarOTs, resumenHistorial } from '../../data/db'
import { estadoMeta } from '../../lib/ot'
import { calcularKpis, type KpiResultado } from '../../lib/kpis'
import type { Equipo, OrdenTrabajo } from '../../lib/types'

interface Props {
  equipo: Equipo | null
  onChanged: () => void
}

type Estado = 'good' | 'warn' | 'crit' | 'info'

function pct(v: string): number { return parseFloat(v) || 0 }
function band(v: number, good: number, warn: number): Estado { return v >= good ? 'good' : v >= warn ? 'warn' : 'crit' }

interface Tile { lbl: string; val: string; unit: string; state: Estado; meter: number | null; feature?: boolean }

function tilesFrom(r: KpiResultado): Tile[] {
  const tmefN = parseFloat(r.tmef)
  const tmefState: Estado = isNaN(tmefN) ? 'good' : band(tmefN, 200, 100)
  const tmprN = parseFloat(r.tmpr) || 0
  const tmprState: Estado = tmprN <= 2 ? 'good' : tmprN <= 4 ? 'warn' : 'crit'
  const mantState: Estado = r.mant === '—' ? 'info' : band(pct(r.mant), 90, 80)
  return [
    { lbl: 'TMEF', val: r.tmef, unit: 'Tiempo medio entre fallas', state: tmefState, meter: null },
    { lbl: 'TMPR', val: r.tmpr, unit: 'Tiempo medio para reparar', state: tmprState, meter: null },
    { lbl: 'Disponibilidad', val: r.disp, unit: '% tiempo operativo', state: band(pct(r.disp), 95, 90), meter: pct(r.disp) },
    { lbl: 'Confiabilidad', val: r.conf, unit: '% sin falla', state: band(pct(r.conf), 90, 75), meter: pct(r.conf) },
    { lbl: 'Mantenibilidad', val: r.mant, unit: '% reparación oportuna', state: mantState, meter: r.mant === '—' ? null : pct(r.mant) },
    { lbl: 'Índice Global', val: r.indice, unit: 'Desempeño general', state: band(pct(r.indice), 90, 80), meter: pct(r.indice), feature: true },
  ]
}

export function Kpis({ equipo, onChanged }: Props) {
  const [ht, setHt] = useState('720')
  const [nf, setNf] = useState('4')
  const [hp, setHp] = useState('14')
  const [hr, setHr] = useState('14')
  const [res, setRes] = useState<KpiResultado | null>(null)
  const [ots, setOts] = useState<OrdenTrabajo[]>([])
  const [verConclusion, setVerConclusion] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgErr, setMsgErr] = useState(false)

  useEffect(() => {
    if (!equipo) { setOts([]); return }
    listarKpis(equipo.id)
      .then((lista) => {
        const ultimo = lista[0]
        if (!ultimo) return
        setHt(String(ultimo.horas_totales ?? 720))
        setNf(String(ultimo.num_fallas ?? 4))
        setHp(String(ultimo.horas_paro ?? 14))
        setHr(String(ultimo.horas_reparacion ?? 14))
        if (ultimo.resultados && Object.keys(ultimo.resultados).length) setRes(ultimo.resultados as unknown as KpiResultado)
      })
      .catch((err) => console.error('KPIs:', err))
    listarOTs(equipo.id).then(setOts).catch((err) => console.error('Bitácora:', err))
  }, [equipo])

  async function cargarDelHistorial() {
    if (!equipo) return
    try {
      const r = await resumenHistorial(equipo.id)
      setNf(String(r.correctivas))
      setHp(String(r.horasParo))
      setHr(String(r.horasReparacion))
      setMsgErr(false)
      setMsg(r.correctivas > 0
        ? `Datos cargados del historial: ${r.correctivas} falla(s) correctiva(s), ${r.horasParo} h de paro. Ajusta las horas del período y pulsa Calcular.`
        : 'No hay órdenes correctivas registradas: el equipo no ha tenido fallas. Registra las horas del período y calcula.')
    } catch (err) { setMsgErr(true); setMsg(err instanceof Error ? err.message : 'Error al leer el historial') }
  }

  function calcular() {
    setRes(calcularKpis({
      horasTotales: parseFloat(ht) || 720,
      numFallas: parseFloat(nf) || 1,
      horasParo: parseFloat(hp) || 0,
      horasReparacion: parseFloat(hr) || 0,
    }))
    setMsg('')
  }

  async function guardar() {
    if (!equipo || !res) return
    setBusy(true); setMsg('')
    try {
      await guardarKpi({
        equipo_id: equipo.id,
        horas_totales: parseFloat(ht) || 720,
        num_fallas: parseInt(nf) || 0,
        horas_paro: parseFloat(hp) || 0,
        horas_reparacion: parseFloat(hr) || 0,
        resultados: res as unknown as Record<string, unknown>,
      })
      setMsgErr(false); setMsg('Período guardado en el historial del equipo.')
      onChanged()
    } catch (err) { setMsgErr(true); setMsg(err instanceof Error ? err.message : 'Error al guardar') } finally { setBusy(false) }
  }

  const tiles = res ? tilesFrom(res) : []
  const TAGS = ['AME completo', 'Despiece estructurado', 'Plan preventivo', 'Liga Equipo-Plan', 'OT Prev. y Corr.', 'KPIs con IA']

  return (
    <>
      <div className="sec-head">
        <div className="sec-ico"><Gauge className="ico" strokeWidth={1.75} /></div>
        <div>
          <div className="sec-eyebrow">Módulo 06</div>
          <h2>Análisis de KPIs</h2>
          <p>Calcula los índices clave de mantenimiento y obtén sugerencias de mejora. Estos indicadores miden el desempeño real de tu gestión frente a los estándares de clase mundial.</p>
        </div>
      </div>

      <div className="card">
        <CardHead step={1} icon={ClipboardList} title="Datos del período" sub="Con estos datos se calculan automáticamente todos los KPIs" />
        <div className="grid">
          <div className="field"><label>Horas totales del período</label><input type="number" value={ht} min="1" onChange={(e) => setHt(e.target.value)} /></div>
          <div className="field"><label>Número de fallas</label><input type="number" value={nf} min="0" onChange={(e) => setNf(e.target.value)} /></div>
          <div className="field"><label>Horas totales de paro</label><input type="number" value={hp} min="0" onChange={(e) => setHp(e.target.value)} /></div>
          <div className="field"><label>Horas de reparación acum.</label><input type="number" value={hr} min="0" onChange={(e) => setHr(e.target.value)} /></div>
        </div>
        {msg && !res && <div className={`msg ${msgErr ? 'msg-err' : 'msg-ok'}`}>{msg}</div>}
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={cargarDelHistorial} disabled={!equipo}><BookOpen className="ico-sm" /> Cargar del historial de OT</button>
          <button className="btn btn-primary" onClick={calcular}><Zap className="ico-sm" /> Calcular KPIs</button>
        </div>
      </div>

      {res && (
        <div className="card">
          <CardHead step={2} icon={Gauge} title={`Resultados${equipo?.codigo ? ` — ${equipo.codigo}` : ''}`} sub="Período analizado" />
          <div className="kpi-grid">
            {tiles.map((t) => (
              <div className={`kpi${t.feature ? ' feature' : ''}`} key={t.lbl}>
                <div className="kpi-hd"><span className="kpi-lbl">{t.lbl}</span><span className={`kpi-dot ${t.state}`} /></div>
                <div className="kpi-val">{t.val}</div>
                <div className="kpi-unit">{t.unit}</div>
                {t.meter !== null && (
                  <div className="kpi-meter"><span className={t.state} style={{ width: `${Math.min(100, Math.max(3, t.meter))}%` }} /></div>
                )}
              </div>
            ))}
          </div>
          <div className="insight">
            <div className="insight-hd"><Sparkles className="ico-sm" /> Análisis — Sugerencias de mejora</div>
            <div className="insight-body" dangerouslySetInnerHTML={{ __html: res.ai }} />
          </div>
          {msg && <div className={`msg ${msgErr ? 'msg-err' : 'msg-ok'}`}>{msg}</div>}
          <div className="btn-row"><button className="btn btn-dark" onClick={guardar} disabled={busy || !equipo}><Save className="ico-sm" /> {busy ? 'Guardando…' : 'Guardar período'}</button></div>
        </div>
      )}

      <div className="card">
        <CardHead step={3} icon={BookOpen} title="Bitácora e historial del equipo" sub="Registro cronológico de las órdenes de trabajo (lo más reciente primero)" />
        {ots.length === 0 ? (
          <div className="empty" style={{ padding: 18 }}>Aún no hay movimientos. Emite órdenes de trabajo para construir el historial del equipo.</div>
        ) : (
          <div className="bitacora">
            {ots.map((ot) => {
              const d = (ot.data ?? {}) as Record<string, string>
              const prev = ot.tipo === 'preventivo'
              const est = estadoMeta(ot.estado)
              const fecha = d.fecha_planificada || d.fecha_falla || d.fecha_emision || ''
              return (
                <div className="bita-row" key={ot.id}>
                  <div className={`bita-ico ${prev ? 'prev' : 'corr'}`}>{prev ? <FileText className="ico-sm" /> : <AlertTriangle className="ico-sm" />}</div>
                  <div className="bita-main">
                    <div className="bita-top"><span className="mono">{ot.codigo}</span><span className={`tag ${est.tag}`}>{est.label}</span></div>
                    <div className="bita-sub">{prev ? (d.actividad || 'Mantenimiento preventivo') : (d.falla || 'Falla correctiva')}</div>
                  </div>
                  <div className="bita-meta">
                    {fecha && <span className="mono">{fecha}</span>}
                    {d.responsable && <span>{d.responsable}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="nav-foot">
        <button className="btn btn-primary" onClick={() => setVerConclusion((v) => !v)}><Flag className="ico-sm" /> Ver conclusión</button>
      </div>

      {verConclusion && (
        <div className="conclusion">
          <h3>Conclusión del módulo</h3>
          <p>
            Acabas de recorrer <strong style={{ color: '#fff' }}>todo el proceso de gestión de mantenimiento</strong> — desde el registro del equipo hasta el análisis de KPIs — y lo hiciste manualmente, uno por uno.
            Imagina gestionar <strong style={{ color: 'var(--brand-300)' }}>50, 100 o 500 equipos</strong> así. Ahí es donde un <strong style={{ color: '#fff' }}>CMMS como Svision</strong> automatiza cada paso, genera las OT solo, calcula los KPIs en tiempo real y mantiene todo organizado y disponible desde cualquier dispositivo.
          </p>
          <div className="conclusion-tags">
            {TAGS.map((t) => <span className="ctag" key={t}><CheckCircle2 size={12} /> {t}</span>)}
          </div>
        </div>
      )}
    </>
  )
}
