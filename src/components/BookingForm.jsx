import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FiCalendar, FiClock, FiUser, FiPhone, FiUserCheck, FiMapPin, FiChevronDown } from 'react-icons/fi'
import toast from 'react-hot-toast'

const INITIAL_FORM = {
  agenda: '',
  corretor: '',
  gerente: '',
  cliente: '',
  telefone: '',
}

const AGENDAS = [
  { id: 'zona-sul', label: '🏙️ Zona Sul' },
  { id: 'santa-monica', label: '🌴 Santa Mônica' },
]

export default function BookingForm({ selectedDate, selectedTime, onSubmit, onAgendaChange, disabled }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAgendaSelect = (agendaId) => {
    setForm((prev) => ({ ...prev, agenda: agendaId }))
    onAgendaChange?.(agendaId)
  }

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value)
    setForm((prev) => ({ ...prev, telefone: formatted }))
  }

  const isValid =
    form.agenda &&
    selectedDate &&
    selectedTime &&
    form.corretor.trim() &&
    form.gerente.trim() &&
    form.cliente.trim() &&
    form.telefone.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid || loading) return

    setLoading(true)
    try {
      await onSubmit({
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        agenda: form.agenda,
        corretor: form.corretor.trim(),
        gerente: form.gerente.trim(),
        cliente: form.cliente.trim(),
        telefone: form.telefone.trim(),
      })
      setForm(INITIAL_FORM)
      onAgendaChange?.('')
      toast.success('Agendamento criado com sucesso!', {
        style: {
          background: 'rgba(30, 27, 60, 0.95)',
          color: '#fff',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          backdropFilter: 'blur(20px)',
        },
        iconTheme: { primary: '#10b981', secondary: '#fff' },
      })
    } catch (err) {
      toast.error(err.message || 'Erro ao criar agendamento', {
        style: {
          background: 'rgba(30, 27, 60, 0.95)',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form-section" onSubmit={handleSubmit}>
      <div className="form-title">
        <span className="form-title-icon">
          <FiCalendar />
        </span>
        Novo Agendamento
      </div>

      {/* Seletor de Agenda - Dropdown */}
      <div className="form-group">
        <label className="form-label" htmlFor="agenda-select">Agenda</label>
        <div className="agenda-select-wrapper" data-agenda={form.agenda}>
          <select
            id="agenda-select"
            className="form-input agenda-select"
            value={form.agenda}
            onChange={(e) => handleAgendaSelect(e.target.value)}
            disabled={disabled || loading}
          >
            <option value="" disabled>Selecione a agenda...</option>
            {AGENDAS.map((ag) => (
              <option key={ag.id} value={ag.id}>{ag.label}</option>
            ))}
          </select>
          <span className="agenda-select-chevron">
            <FiChevronDown />
          </span>
        </div>
      </div>

      {selectedDate && selectedTime && form.agenda && (
        <div className="form-selected-info">
          <span className="info-chip">
            <FiCalendar />
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </span>
          <span className="info-chip">
            <FiClock />
            {selectedTime} - {parseInt(selectedTime) + 1}:00
          </span>
          <span className="info-chip">
            <FiMapPin />
            {form.agenda === 'zona-sul' ? 'Zona Sul' : 'Santa Mônica'}
          </span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="corretor">
          Nome do Corretor
        </label>
        <input
          id="corretor"
          className="form-input"
          type="text"
          name="corretor"
          value={form.corretor}
          onChange={handleChange}
          placeholder="Digite o nome do corretor"
          disabled={disabled || loading}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="gerente">
          Nome do Gerente
        </label>
        <input
          id="gerente"
          className="form-input"
          type="text"
          name="gerente"
          value={form.gerente}
          onChange={handleChange}
          placeholder="Digite o nome do gerente"
          disabled={disabled || loading}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="cliente">
          Nome do Cliente
        </label>
        <input
          id="cliente"
          className="form-input"
          type="text"
          name="cliente"
          value={form.cliente}
          onChange={handleChange}
          placeholder="Digite o nome do cliente"
          disabled={disabled || loading}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="telefone">
          Telefone do Cliente
        </label>
        <input
          id="telefone"
          className="form-input"
          type="tel"
          name="telefone"
          value={form.telefone}
          onChange={handlePhoneChange}
          placeholder="(00) 00000-0000"
          disabled={disabled || loading}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={!isValid || loading || disabled}
      >
        {loading ? (
          <>
            <span className="loading-spinner" />
            Agendando...
          </>
        ) : (
          <>
            <FiCalendar />
            Confirmar Agendamento
          </>
        )}
      </button>
    </form>
  )
}
