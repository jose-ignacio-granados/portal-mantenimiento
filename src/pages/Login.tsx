import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { AuthAside } from './AuthAside'
import { Cog } from '../components/icons'

export function Login() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')

  if (user) return <Navigate to="/" replace />

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    signIn(name)
    navigate('/')
  }

  return (
    <div className="auth">
      <AuthAside />
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-card-brand">
            <div className="sb-mark"><Cog className="ico" strokeWidth={2} /></div>
            <div>
              <div className="name">SmartMant</div>
              <div className="sub">Mantenimiento</div>
            </div>
          </div>
          <div className="auth-title">Bienvenido</div>
          <div className="auth-sub">Escribe tu nombre para entrar. Todo lo que hagas se guarda en este navegador — sin registros ni contraseñas.</div>
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="field"><label>Tu nombre</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ana Pérez" autoFocus /></div>
            <button className="btn btn-primary btn-block" type="submit">Entrar al portal</button>
          </form>
          <div className="auth-foot">Tus datos viven solo en este equipo.</div>
        </div>
      </div>
    </div>
  )
}
