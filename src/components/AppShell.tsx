import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import type { Equipo } from '../lib/types'
import { Check, Cog, LogOut, MODULE_ICONS, PanelLeftClose, PanelLeftOpen, Plus } from './icons'
import { Dropdown } from './Dropdown'

export const MODULES = [
  { n: '01', label: 'AME — Equipos' },
  { n: '02', label: 'Despiece' },
  { n: '03', label: 'Plan de Mantenimiento' },
  { n: '04', label: 'Liga Equipo-Plan' },
  { n: '05', label: 'Órdenes de Trabajo' },
  { n: '06', label: 'KPIs + IA' },
]

interface Props {
  cur: number
  done: boolean[]
  onNavigate: (i: number) => void
  equipos: Equipo[]
  activoId: string | null
  onSelectEquipo: (id: string) => void
  onNewEquipo: () => void
  children: ReactNode
}

export function AppShell({ cur, done, onNavigate, equipos, activoId, onSelectEquipo, onNewEquipo, children }: Props) {
  const { user, signOut } = useAuth()
  const completados = done.filter(Boolean).length

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('sb_collapsed') === '1' } catch { return false }
  })
  function toggle() {
    setCollapsed((v) => {
      const n = !v
      try { localStorage.setItem('sb_collapsed', n ? '1' : '0') } catch { /* ignore */ }
      return n
    })
  }

  return (
    <div className={`app${collapsed ? ' collapsed' : ''}`}>
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="sb-mark"><Cog className="ico" strokeWidth={2} /></div>
          <div className="sb-brand-txt">
            <div className="sb-brand-name">Mantenimiento</div>
            <div className="sb-brand-sub">SmartMant LLC</div>
          </div>
        </div>

        <div className="sb-eyebrow">Flujo de gestión</div>
        <nav className="rail">
          {MODULES.map((m, i) => {
            const Icon = MODULE_ICONS[i]
            const cls = `rail-item${i === cur ? ' active' : ''}${done[i] ? ' done' : ''}`
            return (
              <button key={m.n} className={cls} onClick={() => onNavigate(i)} title={m.label}>
                <span className="rail-node">
                  <Icon className="ico-sm" strokeWidth={2} />
                  {done[i] && <span className="rail-check"><Check size={9} strokeWidth={3.5} /></span>}
                </span>
                <span className="rail-txt">
                  <span className="rail-kicker">{m.n}</span>
                  <span className="rail-label">{m.label}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="sb-progress">
          <div className="sb-progress-row">
            <span className="sb-progress-lbl">Progreso</span>
            <span className="sb-progress-val">{completados} / 6</span>
          </div>
          <div className="sb-track"><div className="sb-fill" style={{ width: `${Math.round((completados / 6) * 100)}%` }} /></div>
          <div className="sb-foot">
            <a href="https://www.smartmant.com" target="_blank" rel="noreferrer">www.smartmant.com</a>
            <div className="tel">+1.786.543.8002</div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main">
        <header className="topbar">
          <button className="topbar-toggle" onClick={toggle} title={collapsed ? 'Expandir menú' : 'Recoger menú'} aria-label={collapsed ? 'Expandir menú' : 'Recoger menú'}>
            {collapsed ? <PanelLeftOpen className="ico" /> : <PanelLeftClose className="ico" />}
          </button>
          <div className="topbar-title">
            <span className="topbar-kicker">Módulo {MODULES[cur].n}</span>
            <span className="topbar-h">{MODULES[cur].label}</span>
          </div>
          <div className="topbar-spacer" />
          <div className="topbar-equipo">
            {equipos.length > 0 ? (
              <>
                <span className="lbl">Equipo</span>
                <Dropdown
                  className="dd-topbar"
                  value={activoId ?? ''}
                  onChange={onSelectEquipo}
                  ariaLabel="Equipo activo"
                  options={equipos.map((e) => ({ value: e.id, label: `${e.codigo ? `${e.codigo} · ` : ''}${e.nombre || 'Sin nombre'}` }))}
                />
                <button className="topbar-new" onClick={onNewEquipo} title="Registrar un equipo nuevo" aria-label="Nuevo equipo"><Plus className="ico-sm" /></button>
              </>
            ) : (
              <button className="topbar-new" onClick={onNewEquipo}><Plus className="ico-sm" /> Crear equipo</button>
            )}
          </div>
          {user && (
            <div className="topbar-user">
              <span className="topbar-email" title={user.name}>{user.name}</span>
              <button className="topbar-logout" onClick={() => signOut()}><LogOut className="ico-sm" /> Salir</button>
            </div>
          )}
        </header>

        <main className="content">
          <div className="content-inner">{children}</div>
        </main>
      </div>
    </div>
  )
}
