import { useState, useMemo, useCallback } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  getDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function Calendar({ selectedDate, onSelectDate, appointments }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const getAppointmentCountForDay = useCallback(
    (day) => {
      if (!appointments) return 0
      const dayStr = format(day, 'yyyy-MM-dd')
      return appointments.filter((a) => a.date === dayStr).length
    },
    [appointments]
  )

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button className="calendar-nav-btn" onClick={handlePrevMonth} aria-label="Mês anterior">
          <FiChevronLeft />
        </button>
        <span className="calendar-month-year">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button className="calendar-nav-btn" onClick={handleNextMonth} aria-label="Próximo mês">
          <FiChevronRight />
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="calendar-weekday">
            {d}
          </div>
        ))}

        {days.map((day, idx) => {
          const inMonth = isSameMonth(day, currentMonth)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const today = isToday(day)
          const isPast = isBefore(day, startOfDay(new Date()))
          const dayOfWeek = getDay(day)
          const isClosedDay = dayOfWeek === 0 || dayOfWeek === 1 // Sunday (0) & Monday (1)
          const count = getAppointmentCountForDay(day)

          let className = 'calendar-day'
          if (!inMonth) className += ' empty'
          else if (isPast || isClosedDay) className += ' disabled'
          else {
            if (today) className += ' today'
            if (isSelected) className += ' selected'
            if (count > 0) className += ' has-appointments'
          }

          const isDisabled = !inMonth || isPast || isClosedDay

          return (
            <button
              key={idx}
              className={className}
              onClick={() => {
                if (!isDisabled) onSelectDate(day)
              }}
              disabled={isDisabled}
              title={
                isClosedDay
                  ? 'Sem expediente (Domingos e Segundas fechados)'
                  : isPast
                  ? 'Data passada'
                  : ''
              }
            >
              {inMonth ? format(day, 'd') : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
