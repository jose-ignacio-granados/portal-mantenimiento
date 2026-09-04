import { Cog, MODULE_ICONS } from '../components/icons'
import { MODULES } from '../components/AppShell'

/** Panel de marca (navy + foto) que acompaña al login. */
export function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="sb-brand auth-brand-in">
        <div className="sb-mark"><Cog className="ico" strokeWidth={2} /></div>
        <div className="sb-brand-txt">
          <div className="sb-brand-name">SmartMant LLC</div>
          <div className="sb-brand-sub">Gestión de Mantenimiento</div>
        </div>
      </div>

      <div className="auth-lead auth-lead-in">
        <h1>Tu mantenimiento, de principio a fin.</h1>
        <p>Registra equipos, arma sus planes, liga rutinas, emite órdenes y mide tus KPIs — todo en un solo lugar.</p>
      </div>

      <div className="auth-steps">
        <div className="auth-steps-eyebrow">El recorrido — 6 módulos</div>
        {MODULES.map((m, i) => {
          const Icon = MODULE_ICONS[i]
          return (
            <div className="row" key={m.n} style={{ animationDelay: `${0.16 + i * 0.06}s` }}>
              <span className="n"><Icon className="ico-sm" strokeWidth={2} /></span>
              <span className="row-num">{m.n}</span>
              <span className="row-lbl">{m.label}</span>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
