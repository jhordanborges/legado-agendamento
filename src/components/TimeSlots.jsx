import { useMemo } from 'react'
import { getDay } from 'date-fns'
import { FiClock, FiLock, FiCheck, FiSlash } from 'react-icons/fi'

// Helper function to get available time slots for a given date (1 hour duration)
export function getTimeSlotsForDate(date) {
  if (!date) return []
  const dayOfWeek = getDay(date) // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado

  // Segunda (1) e Domingo (0): Bloqueados
  if (dayOfWeek === 0 || dayOfWeek === 1) {
    return []
  }

  // Terça (2) a Sexta (5): 14:15 às 19:15 (duração de 1 hora cada)
  if (dayOfWeek >= 2 && dayOfWeek <= 5) {
    return ['14:15', '15:15', '16:15', '17:15', '18:15']
  }

  // Sábado (6): 09:00 às 12:00 (duração de 1 hora cada)
  if (dayOfWeek === 6) {
    return ['09:00', '10:00', '11:00']
  }

  return []
}

// Calculate end time string for 1 hour duration (+1 hour)
export function getEndTimeSlot(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':').map(Number)
  const endHour = String(hours + 1).padStart(2, '0')
  const endMin = String(minutes).padStart(2, '0')
  return `${endHour}:${endMin}`
}

const MAX_PER_SLOT = 1

export default function TimeSlots({ selectedDate, selectedTime, onSelectTime, appointments }) {
  const availableSlots = useMemo(() => getTimeSlotsForDate(selectedDate), [selectedDate])

  const slotCounts = useMemo(() => {
    const counts = {}
    availableSlots.forEach((slot) => {
      counts[slot] = appointments
        ? appointments.filter((a) => a.time === slot).length
        : 0
    })
    return counts
  }, [appointments, availableSlots])

  if (!selectedDate) {
    return null
  }

  const dayOfWeek = getDay(selectedDate)
  const isBlockedDay = dayOfWeek === 0 || dayOfWeek === 1

  return (
    <div className="time-slots-section">
      <div className="time-slots-title">
        <FiClock /> Horários de Atendimento (Duração de 1 hora)
      </div>

      {isBlockedDay ? (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger-400)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <FiSlash style={{ fontSize: '1.2rem', flexShrink: 0 }} />
          <span>
            {dayOfWeek === 1 ? 'Segunda-feira' : 'Domingo'}: <strong>Sem expediente</strong>.
            Horários disponíveis de Terça a Sexta (14:15 às 19:15) e Sábado (09:00 às 12:00).
          </span>
        </div>
      ) : (
        <div className="time-slots-grid">
          {availableSlots.map((slot) => {
            const count = slotCounts[slot] || 0
            const isFull = count >= MAX_PER_SLOT
            const isSelected = selectedTime === slot
            const endTime = getEndTimeSlot(slot)

            let className = 'time-slot'
            if (isSelected) className += ' selected'
            if (isFull) className += ' full'

            return (
              <button
                key={slot}
                type="button"
                className={className}
                onClick={() => {
                  if (!isFull) {
                    onSelectTime(slot)
                  }
                }}
                disabled={isFull}
                title={isFull ? 'Horário Ocupado' : `${slot} às ${endTime}`}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{slot}</span>
                <span className="slot-count">
                  {isFull ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <FiLock size={10} /> Ocupado
                    </span>
                  ) : isSelected ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#fff' }}>
                      <FiCheck size={10} /> até {endTime}
                    </span>
                  ) : (
                    `até ${endTime}`
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
