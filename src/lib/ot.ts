// Ciclo de vida de una Orden de Trabajo, compartido entre el módulo de OT
// y la bitácora. Refleja el flujo real de un CMMS:
//   Programada -> Abierta -> En ejecución -> Cerrada

export interface EstadoOT {
  value: string
  label: string
  tag: string // clase de color del tag (ver index.css)
}

export const OT_ESTADOS: EstadoOT[] = [
  { value: 'programada', label: 'Programada', tag: 't-info' },
  { value: 'abierta', label: 'Abierta', tag: 't-good' },
  { value: 'en_ejecucion', label: 'En ejecución', tag: 't-warn' },
  { value: 'cerrada', label: 'Cerrada', tag: 't-mute' },
]

export function estadoMeta(value?: string | null): EstadoOT {
  return OT_ESTADOS.find((e) => e.value === value) ?? OT_ESTADOS[1]
}

/** Siguiente paso del flujo y la etiqueta del botón que lo dispara. */
export function siguientePaso(value?: string | null): { estado: string; label: string } | null {
  switch (value) {
    case 'programada':
    case 'abierta':
      return { estado: 'en_ejecucion', label: 'Iniciar trabajo' }
    case 'en_ejecucion':
      return { estado: 'cerrada', label: 'Cerrar orden' }
    default:
      return null // cerrada: no avanza (se reabre aparte)
  }
}
