import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function getSecondsLeft(dataInizio, durataOre) {
  const inizio = new Date(dataInizio)
  const fine = new Date(inizio.getTime() + durataOre * 60 * 60 * 1000)
  return Math.max(0, Math.floor((fine - Date.now()) / 1000))
}

function formatTime(seconds) {
  if (seconds >= 86400) {
    // > 24h → giorni e ore
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    return { main: `${d}g`, sub: h > 0 ? `${h}h` : null }
  } else if (seconds >= 18000) {
    // < 24h ma > 5h → solo ore
    const h = Math.floor(seconds / 3600)
    return { main: `${h}h`, sub: null }
  } else if (seconds >= 3600) {
    // < 5h ma > 1h → ore e minuti
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return { main: `${h}h`, sub: `${m}m` }
  } else {
    // < 1h → minuti e secondi
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    const pad = (n) => String(n).padStart(2, '0')
    return { main: `${pad(m)}:${pad(s)}`, sub: null }
  }
}

function CircleTimer({ percent, color, children }) {
  const size = 90
  const stroke = 6
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * (percent / 100)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Traccia di sfondo */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        {/* Arco progresso */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}
        />
      </svg>
      {/* Contenuto centrale */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  )
}

export default function BookingTimer({ booking, onExpired }) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    getSecondsLeft(booking.data_inizio, booking.durata_ore)
  )
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (secondsLeft <= 0) { handleExpire(); return }

    const interval = setInterval(() => {
      const s = getSecondsLeft(booking.data_inizio, booking.durata_ore)
      setSecondsLeft(s)
      if (s <= 0) { clearInterval(interval); handleExpire() }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  async function handleExpire() {
    if (expired) return
    setExpired(true)
    await supabase.from('brescia_bookings').delete().eq('id', booking.id)
    onExpired?.(booking.id)
  }

  const totalSeconds = booking.durata_ore * 3600
  const percent = Math.min(100, (secondsLeft / totalSeconds) * 100)

  const color =
    percent > 50 ? '#10b981' :
    percent > 20 ? '#f59e0b' :
    '#ef4444'

  const { main, sub } = formatTime(secondsLeft)

  if (expired) return null

  return (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    background: 'var(--bg-tertiary)',
    border: `1px solid ${color}33`,
    borderRadius: '8px',
  }}>
    {/* Cerchietto piccolo */}
    <svg width={28} height={28} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={14} cy={14} r={10} fill="none" stroke="var(--border)" strokeWidth={3} />
      <circle
        cx={14} cy={14} r={10}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * 10 * percent / 100} ${2 * Math.PI * 10}`}
        style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}
      />
    </svg>

    {/* Testo */}
    <span style={{
      fontSize: '11px', fontWeight: 700,
      color, fontFamily: 'DM Mono, monospace',
    }}>
      {main}{sub ? ` ${sub}` : ''}
    </span>

    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
      scade {(() => {
        const fine = new Date(new Date(booking.data_inizio).getTime() + booking.durata_ore * 3600000)
        return fine.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      })()}
    </span>
  </div>
)
}
