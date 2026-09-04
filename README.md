# Portal de Gestión de Mantenimiento — SmartMant LLC

Portal **local-first** que reconstruye, con mejor arquitectura, el demo
educativo original de gestión de mantenimiento. Todos los datos viven en el
navegador de cada persona; no hay backend ni cuentas en la nube.

## Stack

- **Vite + React + TypeScript** (SPA).
- **Dexie (IndexedDB)** para la persistencia local.
- Sin backend, sin Supabase, sin multitenant. El "login" es local y decorativo
  (solo pide un nombre y guarda una sesión en este navegador).

## Estructura

```
src/
  lib/        types.ts (entidades), kpis.ts (cálculo + análisis)
  data/       local.ts (base Dexie + seed del ejemplo) · db.ts (API de datos)
  auth/       AuthProvider (sesión local) + RequireAuth (guard)
  components/ AppShell, icons, Dropdown, DatePicker, ui (controles propios)
  pages/      Login, Portal + pages/modules/ (los 6 módulos)
reference/
  original-portal.html — diseño original (referencia, no se sirve)
```

Los 6 módulos: AME (equipos) · Despiece · Plan de Mantenimiento ·
Liga Equipo-Plan · Órdenes de Trabajo · KPIs.

## Correr en local

```bash
npm install
npm run dev
```

La primera vez, la base se **siembra automáticamente** con el equipo de ejemplo
(Transportador Sin Fin SC-61) para que el portal abra poblado como el demo. Si
borras ese equipo, no se vuelve a sembrar.

## Datos

- Todo se guarda en IndexedDB (base `portal_mantenimiento`) de tu navegador.
- Para empezar de cero: borra los datos del sitio / IndexedDB desde las
  herramientas del navegador.

## Build

```bash
npm run build     # tsc + vite build → dist/
```

`dist/` es estático: se publica en cualquier hosting (Vercel, Netlify,
Cloudflare Pages) sin variables de entorno ni servicios externos.
