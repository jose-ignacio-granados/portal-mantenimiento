import { useCallback, useEffect, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { getProgreso, guardarProgreso, listarEquipos } from '../data/db'
import { seedIfEmpty } from '../data/local'
import type { Equipo } from '../lib/types'
import { AME } from './modules/AME'
import { Despiece } from './modules/Despiece'
import { PlanMant } from './modules/PlanMant'
import { Liga } from './modules/Liga'
import { OT } from './modules/OT'
import { Kpis } from './modules/Kpis'

export function Portal() {
  const [cur, setCur] = useState(0)
  const [done, setDone] = useState<boolean[]>([false, false, false, false, false, false])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [activoId, setActivoId] = useState<string | null>(null)
  const [newSignal, setNewSignal] = useState(0)

  const refreshEquipos = useCallback(async () => {
    try {
      const lista = await listarEquipos()
      setEquipos(lista)
      setActivoId((prev) => (prev && lista.some((e) => e.id === prev) ? prev : (lista[0]?.id ?? null)))
    } catch (err) {
      console.error('No se pudieron cargar los equipos:', err)
    }
  }, [])

  useEffect(() => {
    // Carga el ejemplo la primera vez y luego los datos locales.
    seedIfEmpty()
      .then(refreshEquipos)
      .catch((err) => console.error('Inicialización local:', err))
    getProgreso()
      .then((p) => { if (p) setDone(p) })
      .catch((err) => console.error('No se pudo cargar el progreso:', err))
  }, [refreshEquipos])

  function goTo(n: number) {
    setCur(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function nuevoEquipo() {
    setNewSignal((n) => n + 1)
    goTo(0)
  }

  async function markDone(n: number) {
    const next = done.map((d, i) => (i === n ? true : d))
    setDone(next)
    try { await guardarProgreso(next) } catch (err) { console.error('No se pudo guardar el progreso:', err) }
  }

  const activo = equipos.find((e) => e.id === activoId) ?? null

  return (
    <AppShell cur={cur} done={done} onNavigate={goTo} equipos={equipos} activoId={activoId} onSelectEquipo={setActivoId} onNewEquipo={nuevoEquipo}>
      <div className="panel" key={cur}>
        {cur === 0 && (
          <AME equipos={equipos} activoId={activoId} newSignal={newSignal} onSelect={setActivoId} onChanged={refreshEquipos} onDone={() => markDone(0)} goNext={() => goTo(1)} />
        )}
        {cur === 1 && <Despiece equipo={activo} onNewEquipo={nuevoEquipo} onDone={() => markDone(1)} goNext={() => goTo(2)} />}
        {cur === 2 && <PlanMant equipo={activo} onNewEquipo={nuevoEquipo} onDone={() => markDone(2)} goNext={() => goTo(3)} />}
        {cur === 3 && <Liga equipo={activo} onNewEquipo={nuevoEquipo} onDone={() => markDone(3)} goNext={() => goTo(4)} />}
        {cur === 4 && <OT equipo={activo} onNewEquipo={nuevoEquipo} onDone={() => markDone(4)} goNext={() => goTo(5)} />}
        {cur === 5 && <Kpis equipo={activo} onDone={() => markDone(5)} />}
      </div>
    </AppShell>
  )
}
