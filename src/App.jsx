import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, getDay, addDays, parseISO, isToday, isTomorrow, isPast, isFuture } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import {
  FiCalendar,
  FiMapPin,
  FiSearch,
  FiList,
  FiClock,
  FiLock,
  FiLogOut,
  FiShield,
} from 'react-icons/fi'

import { supabase } from './lib/supabase'
import { dispararWebhook } from './lib/webhook'
import Calendar from './components/Calendar'
import TimeSlots from './components/TimeSlots'
import BookingForm from './components/BookingForm'
import AppointmentCard from './components/AppointmentCard'
import ConfirmModal from './components/ConfirmModal'
import AssignDirectorModal from './components/AssignDirectorModal'
import LoginModal from './components/LoginModal'
import StatsBar from './components/StatsBar'

import './App.css'



// Helper to pick default open date (skip Sunday/Monday)
function getInitialOpenDate() {
  const today = new Date()
  const day = getDay(today)
  if (day === 0) return addDays(today, 2) // Sunday -> Tuesday
  if (day === 1) return addDays(today, 1) // Monday -> Tuesday
  return today
}

export default function App() {
  const [currentAgenda, setCurrentAgenda] = useState('zona-sul')
  const [selectedDate, setSelectedDate] = useState(getInitialOpenDate)
  const [selectedTime, setSelectedTime] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [assignDirectorTarget, setAssignDirectorTarget] = useState(null)

  // Admin Authentication State
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('legado_agenda_admin') === 'true'
  })
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  // Fetch appointments from Supabase
  const fetchAppointments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err)
      toast.error('Erro ao carregar agendamentos', {
        style: {
          background: 'rgba(30, 27, 60, 0.95)',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()

    // Real-time subscription
    const channel = supabase
      .channel('agendamentos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos' },
        () => {
          fetchAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAppointments])

  const handleLogin = () => {
    setIsAdmin(true)
    localStorage.setItem('legado_agenda_admin', 'true')
  }

  const handleLogout = () => {
    setIsAdmin(false)
    localStorage.removeItem('legado_agenda_admin')
    toast.success('Sessão encerrada com sucesso', {
      style: {
        background: 'rgba(30, 27, 60, 0.95)',
        color: '#fff',
      },
    })
  }

  // Appointments for calendar/time slots (filtrados pela agenda selecionada no form)
  const agendaAppointments = useMemo(
    () => (currentAgenda ? appointments.filter((a) => a.agenda === currentAgenda) : []),
    [appointments, currentAgenda]
  )

  // Filter appointments for selected date (used for time slot availability)
  const dateAppointments = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return agendaAppointments.filter((a) => a.date === dateStr)
  }, [agendaAppointments, selectedDate])

  // Lista unificada (todas as agendas) com filtro de busca
  const filteredAppointments = useMemo(() => {
    let list = appointments
    
    // Hide past appointments from common users
    if (!isAdmin) {
      const now = new Date()
      const todayStr = format(now, 'yyyy-MM-dd')
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      list = list.filter((a) => {
        if (a.date < todayStr) return false
        if (a.date === todayStr && a.time < currentTimeStr) return false
        return true
      })
    }

    if (!searchTerm.trim()) return list
    const term = searchTerm.toLowerCase()
    return list.filter(
      (a) =>
        a.cliente?.toLowerCase().includes(term) ||
        a.corretor?.toLowerCase().includes(term) ||
        a.gerente?.toLowerCase().includes(term) ||
        a.diretor?.toLowerCase().includes(term) ||
        a.telefone?.includes(term) ||
        a.date?.includes(term)
    )
  }, [appointments, searchTerm, isAdmin])

  // Create appointment
  const handleCreateAppointment = async (data) => {
    // Double-check slot availability (Limit = 1 per slot per agenda)
    const existing = appointments.filter(
      (a) => a.agenda === data.agenda && a.date === data.date && a.time === data.time
    )
    if (existing.length >= 1) {
      throw new Error('Este horário já foi reservado para esta agenda.')
    }

    const { data: inserted, error } = await supabase
      .from('agendamentos')
      .insert([data])
      .select()
      .single()
    if (error) throw error

    // Dispara webhook com retry automático (até 3 tentativas)
    const webhookResult = await dispararWebhook(inserted)

    // Persiste o status do webhook no registro do agendamento
    const webhookStatus = webhookResult.ok
      ? 'ok'
      : `falha (${webhookResult.attempts} tentativas): ${webhookResult.error}`

    await supabase
      .from('agendamentos')
      .update({ webhook_status: webhookStatus })
      .eq('id', inserted.id)

    // Notifica o admin visualmente se o webhook falhou
    if (!webhookResult.ok) {
      toast.error(
        `⚠️ Agendamento salvo, mas o webhook falhou após ${webhookResult.attempts} tentativas.\nO time pode não ter sido notificado automaticamente.`,
        {
          duration: 8000,
          style: {
            background: 'rgba(30, 27, 60, 0.97)',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            backdropFilter: 'blur(20px)',
            maxWidth: '420px',
            lineHeight: '1.5',
          },
          iconTheme: { primary: '#f87171', secondary: '#fff' },
        }
      )
    }

    await fetchAppointments()
    setSelectedTime(null)
    setCurrentAgenda('')
  }

  // Delete appointment (Admin only)
  const handleDeleteAppointment = async (id) => {
    if (!isAdmin) return
    try {
      const { error } = await supabase.from('agendamentos').delete().eq('id', id)
      if (error) throw error
      setDeleteTarget(null)
      await fetchAppointments()
      toast.success('Agendamento excluído com sucesso!', {
        style: {
          background: 'rgba(30, 27, 60, 0.95)',
          color: '#fff',
          border: '1px solid rgba(99, 102, 241, 0.3)',
        },
      })
    } catch (err) {
      toast.error('Erro ao excluir agendamento', {
        style: {
          background: 'rgba(30, 27, 60, 0.95)',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      })
    }
  }

  // Assign Director (Admin only)
  const handleAssignDirectorSubmit = async (id, diretor) => {
    if (!isAdmin) return
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ diretor: diretor || null })
        .eq('id', id)
      
      if (error) throw error
      setAssignDirectorTarget(null)
      await fetchAppointments()
      toast.success('Diretor designado com sucesso!', {
        style: {
          background: 'rgba(30, 27, 60, 0.95)',
          color: '#fff',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        },
      })
    } catch (err) {
      toast.error('Erro ao designar diretor', {
        style: {
          background: 'rgba(30, 27, 60, 0.95)',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      })
    }
  }

  const handleSelectDate = (date) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  return (
    <div className="app">
      <Toaster position="top-right" />
      <div className="app-bg" />
      <div className="floating-orb" />
      <div className="floating-orb" />
      <div className="floating-orb" />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo">
              <FiCalendar />
            </div>
            <div>
              <h1 className="header-title">
                Legado <span>Agenda</span>
              </h1>
              <p className="header-subtitle">Ter-Sex (14h15 - 19h15) | Sáb (09h00 - 12h00)</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="header-date">
              <FiClock />
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </div>

            {isAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--success-400)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <FiShield /> Admin Logado
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleLogout}
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  <FiLogOut /> Sair
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsLoginModalOpen(true)}
                style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: 'rgba(99, 102, 241, 0.4)', color: 'var(--primary-300)' }}
              >
                <FiLock /> Área Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Stats Bar */}
        {isAdmin && <StatsBar appointments={appointments} />}


        {/* Content Grid */}
        <div className="content-grid">
          {/* Left: Calendar + Time Slots */}
          <div className="glass-card">
            <div className="card-header">
              <div className="card-header-title">
                <span className="card-header-icon">
                  <FiCalendar />
                </span>
                Selecione a Data e o Horário
              </div>
            </div>
            <div className="card-body">
              <Calendar
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                appointments={agendaAppointments}
              />

              <TimeSlots
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
                appointments={dateAppointments}
                selectedDate={selectedDate}
                isAdmin={isAdmin}
              />
            </div>
          </div>

          {/* Right: Booking Form */}
          <div className="glass-card">
            <div className="card-header">
              <div className="card-header-title">
                <span className="card-header-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <FiMapPin />
                </span>
                Novo Agendamento
              </div>
            </div>
            <div className="card-body">
              <BookingForm
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSubmit={handleCreateAppointment}
                onAgendaChange={(agenda) => {
                  setCurrentAgenda(agenda)
                  setSelectedTime(null)
                }}
              />
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="appointments-section">
          <div className="appointments-header">
            <div className="appointments-title">
              <FiList />
              Todos os Agendamentos
              <span className="appointments-count">{filteredAppointments.length}</span>
            </div>

            {isAdmin ? (
              <div className="filter-bar">
                <div className="filter-input-wrapper">
                  <FiSearch className="filter-input-icon" />
                  <input
                    className="filter-input"
                    type="text"
                    placeholder="Buscar por cliente, corretor, agência..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255, 255, 255, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <FiLock style={{ color: 'var(--warning-400)' }} /> Informações protegidas (Faça login como Admin para visualizar os nomes)
              </div>
            )}
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner" style={{ width: 40, height: 40 }} />
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="appointments-by-date">
              {(() => {
                // Group by date
                const groups = filteredAppointments.reduce((acc, appt) => {
                  const key = appt.date || 'sem-data'
                  if (!acc[key]) acc[key] = []
                  acc[key].push(appt)
                  return acc
                }, {})

                return Object.entries(groups).map(([dateKey, appts]) => {
                  const parsedDate = dateKey !== 'sem-data' ? parseISO(dateKey) : null
                  const dayLabel = parsedDate
                    ? format(parsedDate, "EEEE", { locale: ptBR })
                    : ''
                  const fullDate = parsedDate
                    ? format(parsedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : 'Sem data'

                  const isDateToday = parsedDate && isToday(parsedDate)
                  const isDateTomorrow = parsedDate && isTomorrow(parsedDate)
                  const isDatePast = parsedDate && isPast(parsedDate) && !isDateToday

                  const badge = isDateToday ? 'Hoje' : isDateTomorrow ? 'Amanhã' : isDatePast ? 'Concluído' : null
                  const badgeClass = isDateToday ? 'date-badge today' : isDateTomorrow ? 'date-badge tomorrow' : isDatePast ? 'date-badge past' : ''

                  return (
                    <div key={dateKey} className={`date-group${isDatePast ? ' date-group-past' : ''}`}>
                      <div className="date-group-header">
                        <div className="date-group-header-left">
                          <span className="date-group-day">{dayLabel}</span>
                          <span className="date-group-full">{fullDate}</span>
                        </div>
                        <div className="date-group-header-right">
                          {badge && <span className={badgeClass}>{badge}</span>}
                          <span className="date-group-count">{appts.length} agendamento{appts.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="appointments-grid">
                        {appts.map((appt) => (
                          <AppointmentCard
                            key={appt.id}
                            appointment={appt}
                            onDelete={setDeleteTarget}
                            onAssignDirector={setAssignDirectorTarget}
                            isAdmin={isAdmin}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          ) : (
            <div className="glass-card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FiCalendar />
                </div>
                <div className="empty-state-title">Nenhum agendamento para esta agenda</div>
                <p className="empty-state-text">
                  Selecione um horário disponível acima para realizar um agendamento.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal (Admin) */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAppointment}
        appointment={deleteTarget}
      />

      {/* Assign Director Modal (Admin) */}
      <AssignDirectorModal
        isOpen={!!assignDirectorTarget}
        onClose={() => setAssignDirectorTarget(null)}
        onConfirm={handleAssignDirectorSubmit}
        appointment={assignDirectorTarget}
      />

      {/* Admin Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  )
}
