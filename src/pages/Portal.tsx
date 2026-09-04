import { useCallback, useEffect, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { estadoFlujo, listarEquipos } from '../data/db'
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
  // Se incrementa cuando cualquier módulo cambia datos; dispara recarga de
  // equipos y recálculo del avance del flujo.
  const [dataVersion, setDataVersion] = useState(0)

  const bump = useCallback(() => setDataVersion((v) => v + 1), [])

  // Carga el ejemplo la primera vez y recarga el catálogo en cada cambio.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await seedIfEmpty()
      const lista = await listarEquipos()
      if (cancelled) return
      setEquipos(lista)
      setActivoId((prev) => (prev && lista.some((e) => e.id === prev) ? prev : (lista[0]?.id ?? null)))
    })().catch((err) => console.error('Inicialización local:', err))
    return () => { cancelled = true }
  }, [dataVersion])

  // El avance refleja lo que realmente existe para el equipo activo.
  useEffect(() => {
    let cancelled = false
    estadoFlujo(activoId)
      .then((d) => { if (!cancelled) setDone(d) })
      .catch((err) => console.error('No se pudo calcular el avance:', err))
    return () => { cancelled = true }
  }, [activoId, dataVersion])

  function goTo(n: number) {
    setCur(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function nuevoEquipo() {
    setNewSignal((n) => n + 1)
    goTo(0)
  }

  const activo = equipos.find((e) => e.id === activoId) ?? null

  return (
    <AppShell cur={cur} done={done} onNavigate={goTo} equipos={equipos} activoId={activoId} onSelectEquipo={setActivoId} onNewEquipo={nuevoEquipo}>
      <div className="panel" key={cur}>
        {cur === 0 && (
          <AME equipos={equipos} activoId={activoId} newSignal={newSignal} onSelect={setActivoId} onChanged={bump} goNext={() => goTo(1)} />
        )}
        {cur === 1 && <Despiece equipo={activo} onNewEquipo={nuevoEquipo} onChanged={bump} goNext={() => goTo(2)} />}
        {cur === 2 && <PlanMant equipo={activo} onNewEquipo={nuevoEquipo} onChanged={bump} goNext={() => goTo(3)} />}
        {cur === 3 && <Liga equipo={activo} onNewEquipo={nuevoEquipo} onChanged={bump} goNext={() => goTo(4)} />}
        {cur === 4 && <OT equipo={activo} onNewEquipo={nuevoEquipo} onChanged={bump} goNext={() => goTo(5)} />}
        {cur === 5 && <Kpis equipo={activo} onChanged={bump} />}
      </div>
    </AppShell>
  )
}
