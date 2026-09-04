// Calculo de KPIs y sugerencias "IA" (logica if/else) portados tal cual
// del portal original. No se altero ninguna formula ni umbral.

export interface KpiResultado {
  tmef: string
  tmpr: string
  disp: string
  conf: string
  mant: string
  indice: string
  ai: string // HTML de las sugerencias
}

export function calcularKpis(entrada: {
  horasTotales: number
  numFallas: number
  horasParo: number
  horasReparacion: number
}): KpiResultado {
  const ht = entrada.horasTotales || 720
  const nf = entrada.numFallas || 1
  const hp = entrada.horasParo || 0
  const hr = entrada.horasReparacion || 0

  const tmef = nf > 0 ? ((ht - hp) / nf).toFixed(1) : '∞'
  const tmpr = nf > 0 ? (hr / nf).toFixed(1) : '0'
  const disp = (((ht - hp) / ht) * 100).toFixed(1) + '%'
  const conf = Math.max(0, 100 - (nf / (ht / 720)) * 100).toFixed(1) + '%'
  const tmefN = parseFloat(tmef) || 999
  const tmprN = parseFloat(tmpr) || 0
  const mant = tmefN > 0 ? Math.min(100, (tmefN / (tmefN + tmprN)) * 100).toFixed(1) + '%' : '—'
  const indice = ((parseFloat(disp) + parseFloat(conf)) / 2).toFixed(1) + '%'

  // ─── Sugerencias IA ───
  const dispN = parseFloat(disp)
  let txt = ''
  if (dispN < 90)
    txt += `<strong>Disponibilidad crítica (${disp}).</strong> Revisar urgentemente el plan preventivo. Posibles causas: frecuencias de mantenimiento inadecuadas o falta de repuestos críticos en almacén. `
  else if (dispN < 95)
    txt += `<strong>Disponibilidad por debajo de clase mundial (${disp}).</strong> Meta recomendada ≥95%. Revisar frecuencias del plan preventivo y analizar componentes con mayor tasa de falla. `
  if (tmprN > 4)
    txt += `<strong>TMPR elevado (${tmpr} h).</strong> El tiempo de reparación es alto. Verificar logística de repuestos, herramientas disponibles y competencias técnicas del equipo. `
  if (tmefN < 100 && tmefN !== 999)
    txt += `<strong>TMEF bajo (${tmef} h).</strong> Las fallas ocurren con frecuencia. Considerar incrementar la lubricación, ajustar el plan preventivo e implementar mantenimiento predictivo (vibración, termografía). `
  if (!txt)
    txt =
      '<strong>Excelente desempeño.</strong> Los KPIs están dentro de los parámetros de clase mundial. Mantén el plan preventivo, documenta las buenas prácticas y considera implementar mantenimiento predictivo para sostener estos resultados.'

  return { tmef: tmef + ' h', tmpr: tmpr + ' h', disp, conf, mant, indice, ai: txt }
}
