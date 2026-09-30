import { FiTrash2, FiUser, FiPhone, FiBriefcase, FiUserCheck, FiLock, FiAward } from 'react-icons/fi'
import { getEndTimeSlot } from './TimeSlots'

export default function AppointmentCard({ appointment, onDelete, onAssignDirector, isAdmin }) {
  const { time, agenda, corretor, gerente, cliente, telefone, agencia, diretor } = appointment
  const endTime = getEndTimeSlot(time)

  return (
    <div className="appointment-card">
      <div className={`appointment-accent ${agenda}`} />
      <div className="appointment-content">
        <div className="appointment-time">
          <span className="appointment-time-value">{time}</span>
          <span className="appointment-time-label">até {endTime}</span>
        </div>

        <div className="appointment-details">
          {isAdmin ? (
            <>
              <div className="appointment-client">{cliente}</div>
              <div className="appointment-meta">
                <span className="appointment-meta-item">
                  <FiUser /> Corretor: {corretor}
                </span>
                <span className="appointment-meta-item">
                  <FiUserCheck /> Gerente: {gerente}
                </span>
                <span className="appointment-meta-item">
                  <FiPhone /> {telefone}
                </span>
                <span className="appointment-meta-item">
                  <FiBriefcase /> {agencia}
                </span>
                {diretor && (
                  <span className="appointment-meta-item" style={{ color: 'var(--warning-400)', fontWeight: 600 }}>
                    <FiAward /> Diretor: {diretor}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="appointment-client" style={{ color: 'rgba(255, 255, 255, 0.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiLock style={{ color: 'var(--warning-400)' }} /> Horário Reservado
              </div>
              <div className="appointment-meta" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                <span>Status: Indisponível para novos agendamentos</span>
              </div>
            </>
          )}
        </div>

        {isAdmin && (
          <div className="appointment-actions" style={{ display: 'flex', gap: '8px' }}>
            <button
              className="appointment-delete"
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-400)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              onClick={() => onDelete(appointment)}
              title="Excluir agendamento"
              aria-label="Excluir agendamento"
            >
              <FiTrash2 />
            </button>
            <button
              className="appointment-delete"
              style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-400)', borderColor: 'rgba(99, 102, 241, 0.2)' }}
              onClick={() => onAssignDirector(appointment)}
              title="Designar Diretor"
              aria-label="Designar Diretor"
            >
              <FiAward />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
