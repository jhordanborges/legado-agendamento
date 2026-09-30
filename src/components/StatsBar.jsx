import { FiCalendar, FiMapPin } from 'react-icons/fi'

export default function StatsBar({ appointments }) {
  const totalGeral = appointments.length
  const totalZonaSul = appointments.filter(a => a.agenda === 'zona-sul').length
  const totalSantaMonica = appointments.filter(a => a.agenda === 'santa-monica').length

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <div className="stat-icon primary">
          <FiCalendar />
        </div>
        <div className="stat-info">
          <span className="stat-value">{totalGeral}</span>
          <span className="stat-label">Total Geral</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon success">
          <FiMapPin />
        </div>
        <div className="stat-info">
          <span className="stat-value">{totalZonaSul}</span>
          <span className="stat-label">Zona Sul</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon warning">
          <FiMapPin />
        </div>
        <div className="stat-info">
          <span className="stat-value">{totalSantaMonica}</span>
          <span className="stat-label">Santa Mônica</span>
        </div>
      </div>
    </div>
  )
}
