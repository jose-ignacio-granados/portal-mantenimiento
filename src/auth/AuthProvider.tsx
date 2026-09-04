import { createContext, useContext, useState, type ReactNode } from 'react'

// Sesión local y decorativa: solo guarda un nombre en este navegador.
// No hay backend, contraseñas ni multitenant.
interface Session { name: string }
interface AuthState {
  user: Session | null
  signIn: (name: string) => void
  signOut: () => void
}

const KEY = 'portal_user'
const AuthContext = createContext<AuthState | undefined>(undefined)

function load(): Session | null {
  try { const s = localStorage.getItem(KEY); return s ? (JSON.parse(s) as Session) : null } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(() => load())

  function signIn(name: string) {
    const s: Session = { name: name.trim() || 'Invitado' }
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
    setUser(s)
  }
  function signOut() {
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
