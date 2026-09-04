import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from './icons'

export type Option = string | { value: string; label: string }
function norm(o: Option) { return typeof o === 'string' ? { value: o, label: o } : o }

interface DropdownProps {
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  ariaLabel?: string
}

/** Desplegable propio (sin <select> nativo). Teclado: flechas, Enter, Esc. */
export function Dropdown({ value, onChange, options, placeholder = 'Seleccionar', className = '', ariaLabel }: DropdownProps) {
  const opts = options.map(norm)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const selected = opts.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (open) setActive(Math.max(0, opts.findIndex((o) => o.value === value)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function choose(v: string) { onChange(v); setOpen(false) }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); else setActive((a) => Math.min(opts.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (open && opts[active]) choose(opts[active].value); else setOpen(true) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div className={`dd ${className}`} ref={ref}>
      <button type="button" className="dd-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen((o) => !o)} onKeyDown={onKey}>
        <span className={selected ? 'dd-val' : 'dd-ph'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="ico-sm dd-caret" />
      </button>
      {open && (
        <ul className="dd-menu" role="listbox">
          {opts.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`dd-opt${o.value === value ? ' sel' : ''}${i === active ? ' active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o.value)}
            >
              <span>{o.label}</span>
              {o.value === value && <Check className="ico-sm" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Desplegable con etiqueta, para formularios. */
export function Select({ label, value, onChange, options, full }: { label: string; value: string; onChange: (v: string) => void; options: Option[]; full?: boolean }) {
  return (
    <div className={full ? 'field full' : 'field'}>
      <label>{label}</label>
      <Dropdown value={value} onChange={onChange} options={options} ariaLabel={label} />
    </div>
  )
}
