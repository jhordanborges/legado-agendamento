import { FiTrash2, FiUser, FiPhone, FiUserCheck, FiLock, FiAward, FiCheckCircle } from 'react-icons/fi'
import { format, parseISO, isPast, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getEndTimeSlot } from './TimeSlots'

export default function AppointmentCard({ appointment, onDelete, onAssignDirector, isAdmin }) {
  const { id, time, date, agenda, corretor, gerente, cliente, telefone, diretor } = appointment
  const endTime = getEndTimeSlot(time)
  const agendaLabel = agenda === 'zona-sul' ? '🏙️ Zona Sul' : '🌴 Santa Mônica'
  const agendaColor = agenda === 'zona-sul'
    ? { color: 'var(--primary-300)', border: 'rgba(99,102,241,0.25)', bg: 'rgba(99,102,241,0.1)' }
    : { color: '#34d399', border: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.1)' }

  // Date formatting
  const parsedDate = date ? parseISO(date) : null
  const formattedDay = parsedDate ? format(parsedDate, "EEEE", { locale: ptBR }) : ''
  const formattedDate = parsedDate ? format(parsedDate, "dd 'de' MMMM", { locale: ptBR }) : ''

  // Check if appointment is in the past (concluded)
  const isConcluded = (() => {
    if (!date || !time) return false
    try {
      const apptDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date())
      return isPast(apptDateTime)
    } catch { return false }
  })()

  return (
    <div className={`appointment-card${isConcluded ? ' concluded' : ''}`}>
      <div className={`appointment-accent ${agenda}`} />
      <div className="appointment-content">
        <div className="appointment-time">
          {parsedDate && (
            <div className="appointment-date-block">
              <span className="appointment-date-day">{formattedDay}</span>
              <span className="appointment-date-value">{formattedDate}</span>
            </div>
          )}
          <div className="appointment-time-row">
            <span className="appointment-time-value">{time}</span>
            <span className="appointment-time-sep">→</span>
            <span className="appointment-time-value">{endTime}</span>
          </div>
          {isConcluded && (
            <span className="appointment-concluded-badge">
              <FiCheckCircle /> Concluído
            </span>
          )}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: agendaColor.color,
              background: agendaColor.bg,
              border: `1px solid ${agendaColor.border}`,
              marginTop: 4,
            }}
          >
            {agendaLabel}
          </span>
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
