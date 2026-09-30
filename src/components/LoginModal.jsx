import { useState } from 'react'
import { FiLock, FiX, FiUser, FiKey, FiCheckCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    // Admin login validation (default admin: admin / admin123 or admin@admin.com)
    if (
      (email.trim().toLowerCase() === 'admin' || email.trim().toLowerCase() === 'admin@admin.com') &&
      password === 'admin123'
    ) {
      setTimeout(() => {
        onLogin({ email: 'admin@agendapro.com', role: 'admin' })
        setLoading(false)
        onClose()
        setEmail('')
        setPassword('')
        toast.success('Login administrativo realizado com sucesso!', {
          style: {
            background: 'rgba(30, 27, 60, 0.95)',
            color: '#fff',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          },
          iconTheme: { primary: '#6366f1', secondary: '#fff' },
        })
      }, 400)
    } else {
      setTimeout(() => {
        setLoading(false)
        toast.error('Usuário ou senha incorretos! (Padrão: admin / admin123)', {
          style: {
            background: 'rgba(30, 27, 60, 0.95)',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          },
        })
      }, 400)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiLock style={{ color: 'var(--primary-400)' }} /> Acesso Administrativo
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ marginBottom: 0 }}>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem' }}>
              Entre como administrador para visualizar todos os detalhes sigilosos e gerenciar os agendamentos.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">
                Usuário / E-mail
              </label>
              <input
                id="admin-email"
                className="form-input"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin"
                autoFocus
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="admin-password">
                Senha
              </label>
              <input
                id="admin-password"
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 4, display: 'block' }}>
                Senha padrão para testes: <strong>admin123</strong>
              </span>
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner" /> Entrando...
                </>
              ) : (
                <>
                  <FiKey /> Entrar como Admin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
