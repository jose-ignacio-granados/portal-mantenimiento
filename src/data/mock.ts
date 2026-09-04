// Datos de ejemplo (mock) para que el portal se sienta real sin que el
// usuario tenga que configurar catálogos. Con fines educativos.

/** Técnicos de mantenimiento disponibles para asignar a las órdenes. */
export const TECNICOS: string[] = [
  'Ana Pérez',
  'Luis Mendoza',
  'Carlos Rojas',
  'María Gómez',
  'Pedro Salas',
]

/** Devuelve un técnico rotando por la lista (para asignación automática). */
export function tecnicoPorIndice(i: number): string {
  return TECNICOS[i % TECNICOS.length]
}
