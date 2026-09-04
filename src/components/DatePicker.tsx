import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from './icons'

// Formato de valor: ISO 'YYYY-MM-DD'. Se parsea en hora local para
// evitar corrimientos de zona horaria.
function parse(iso: string): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmt(d: Date): string {
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const MES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

interface Props {
  value: string
  onChange: (v: string) => void
  className?: string
  placeholder?: string
  ariaLabel?: string
}

/** Selector de fecha propio (calendario, sin input date nativo). */
export function DatePicker({ value, onChange, className = '', placeholder = 'Seleccionar fecha', ariaLabel }: Props) {
  const sel = parse(value)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<Date>(() => sel ?? new Date())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { const s = parse(value); if (s) setView(s) }, [value])
  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [open])

  const year = view.getFullYear()
  const month = view.getMonth()
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7 // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayISO = toISO(new Date())

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function pick(d: number) { onChange(toISO(new Date(year, month, d))); setOpen(false) }

  return (
    <div className={`dd dp ${className}`} ref={ref}>
      <button type="button" className="dd-trigger" aria-haspopup="dialog" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen((o) => !o)}>
        <CalendarDays className="ico-sm dd-lead" />
        <span className={sel ? 'dd-val' : 'dd-ph'}>{sel ? fmt(sel) : placeholder}</span>
      </button>
      {open && (
        <div className="dp-pop" role="dialog" aria-label="Calendario">
          <div className="dp-head">
            <button type="button" className="dp-nav" onClick={() => setView(new Date(year, month - 1, 1))} aria-label="Mes anterior"><ChevronLeft className="ico-sm" /></button>
            <span className="dp-title">{MES[month]} {year}</span>
            <button type="button" className="dp-nav" onClick={() => setView(new Date(year, month + 1, 1))} aria-label="Mes siguiente"><ChevronRight className="ico-sm" /></button>
          </div>
          <div className="dp-grid dp-dow">{DOW.map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="dp-grid">
            {cells.map((c, i) => {
              if (c === null) return <span key={i} className="dp-empty" />
              const iso = toISO(new Date(year, month, c))
              return (
                <button key={i} type="button" className={`dp-day${iso === value ? ' sel' : ''}${iso === todayISO ? ' today' : ''}`} onClick={() => pick(c)}>{c}</button>
              )
            })}
          </div>
          <div className="dp-foot">
            <button type="button" className="dp-quick" onClick={() => { onChange(todayISO); setOpen(false) }}>Hoy</button>
            {value && <button type="button" className="dp-quick" onClick={() => { onChange(''); setOpen(false) }}>Limpiar</button>}
          </div>
        </div>
      )}
    </div>
  )
}

/** Selector de fecha con etiqueta, para formularios. */
export function DateField({ label, value, onChange, full }: { label: string; value: string; onChange: (v: string) => void; full?: boolean }) {
  return (
    <div className={full ? 'field full' : 'field'}>
      <label>{label}</label>
      <DatePicker value={value} onChange={onChange} ariaLabel={label} />
    </div>
  )
}
