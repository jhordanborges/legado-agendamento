import { FiX, FiAlertTriangle } from 'react-icons/fi'

export default function ConfirmModal({ isOpen, onClose, onConfirm, appointment }) {
  if (!isOpen || !appointment) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Confirmar Exclusão</span>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">
            Tem certeza que deseja excluir o agendamento de{' '}
            <strong>{appointment.cliente}</strong> no horário{' '}
            <strong>{appointment.time}</strong> do dia{' '}
            <strong>{appointment.date}</strong>?
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={() => onConfirm(appointment.id)}>
            <FiAlertTriangle /> Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
