// Set de iconos del portal (lucide). Un solo lugar para mantener
// coherencia visual: mismos nombres, mismo grosor de trazo.
import {
  Cog, Boxes, ListTree, ClipboardList, Workflow, FileText, Gauge,
  LogOut, Check, ArrowRight, Plus, Trash2, Save, Zap, Sparkles,
  AlertTriangle, CircleDot, Minus, Link2, Info, CheckCircle2, Flag,
  BookOpen, CalendarDays, PanelLeftClose, PanelLeftOpen, MapPin, Factory,
  ChevronDown, ChevronLeft, ChevronRight, Pencil, RotateCcw, X,
  type LucideIcon,
} from 'lucide-react'

export {
  Cog, Boxes, ListTree, ClipboardList, Workflow, FileText, Gauge,
  LogOut, Check, ArrowRight, Plus, Trash2, Save, Zap, Sparkles,
  AlertTriangle, CircleDot, Minus, Link2, Info, CheckCircle2, Flag,
  BookOpen, CalendarDays, PanelLeftClose, PanelLeftOpen, MapPin, Factory,
  ChevronDown, ChevronLeft, ChevronRight, Pencil, RotateCcw, X,
}
export type { LucideIcon }

/** Iconos de los 6 modulos, en orden del flujo de mantenimiento. */
export const MODULE_ICONS: LucideIcon[] = [
  Boxes,         // 01 AME — inventario de equipos
  ListTree,      // 02 Despiece — arbol de componentes
  ClipboardList, // 03 Plan de mantenimiento
  Workflow,      // 04 Liga equipo-plan
  FileText,      // 05 Ordenes de trabajo
  Gauge,         // 06 KPIs
]
