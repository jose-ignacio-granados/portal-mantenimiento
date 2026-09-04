// Pequenos helpers de formulario para replicar el markup del portal
// original sin repetir clases en cada input.
import type { ReactNode } from 'react'
import { Check, type LucideIcon } from './icons'

// Controles propios (sin nativos del navegador).
export { Dropdown, Select } from './Dropdown'
export { DatePicker, DateField } from './DatePicker'
export type { Option } from './Dropdown'

/** Casilla propia (sin checkbox nativo). Teclado: Espacio/Enter. */
export function Checkbox({ checked, onChange, label, className = '' }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; className?: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className={`cbx ${checked ? 'on' : ''} ${className}`} onClick={() => onChange(!checked)}>
      <span className="cbx-box">{checked && <Check size={12} strokeWidth={3.5} />}</span>
      <span className="cbx-lbl">{label}</span>
    </button>
  )
}

/** Encabezado de paso: icono + "Paso N" + titulo + subtitulo. */
export function CardHead({ step, icon: Icon, title, sub }: { step: number; icon: LucideIcon; title: ReactNode; sub: ReactNode }) {
  return (
    <div className="card-hd">
      <div className="card-ico"><Icon className="ico-sm" strokeWidth={2} /></div>
      <div>
        <div className="card-kicker">Paso {step}</div>
        <div className="card-title">{title}</div>
        <div className="card-sub">{sub}</div>
      </div>
    </div>
  )
}

interface TextProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  full?: boolean
  type?: string
}

export function Text({ label, value, onChange, placeholder, full, type = 'text' }: TextProps) {
  return (
    <div className={full ? 'field full' : 'field'}>
      <label>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

interface AreaProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function Area({ label, value, onChange, placeholder }: AreaProps) {
  return (
    <div className="field full">
      <label>{label}</label>
      <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
