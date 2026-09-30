import { useState, useEffect } from 'react'
import { FiX, FiAward } from 'react-icons/fi'

const DIRETORES = [
  'Pablo',
  'Denise',
  'Caique',
  'Matheus',
  'Pedro',
  'Clovis',
]

export default function AssignDirectorModal({ isOpen, onClose, onConfirm, appointment }) {
  const [diretor, setDiretor] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && appointment) {
      setDiretor(appointment.diretor || '')
    }
  }, [isOpen, appointment])

  if (!isOpen || !appointment) return null

  const handleSubmit = async () => {
    setLoading(true)
    await onConfirm(appointment.id, diretor)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Designar Diretor</span>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">
            Selecione o diretor responsável pelo atendimento de{' '}
            <strong>{appointment.cliente}</strong>:
          </p>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <select
              className="form-input"
              value={diretor}
              onChange={(e) => setDiretor(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione o diretor</option>
              {DIRETORES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner" /> Salvando...
              </>
            ) : (
              <>
                <FiAward /> Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
