import { useState, useMemo, useRef, useEffect, useCallback } from 'react'

// Inietta keyframe shimmer per la progress bar skeleton
if (typeof document !== 'undefined' && !document.getElementById('spotmap-shimmer-style')) {
  const s = document.createElement('style')
  s.id = 'spotmap-shimmer-style'
  s.textContent = '@keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }'
  document.head.appendChild(s)
}
import { generateSpots } from '../lib/bresciaParking'
import { supabase } from '../lib/supabase'
import BookingModal from './BookingModal'

const PAGE_SIZE = 40

const CATEGORY = {
  auto: {
    label: 'Auto',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
    icon: <span style={{ fontSize: '18px' }}>🚙</span>,
  },
  moto: {
    label: 'Moto',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    icon: <span style={{ fontSize: '18px' }}>🛵</span>,
  },
  disabile: {
    label: 'Disabili',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    icon: <span style={{ fontSize: '18px' }}>🧑‍🦽</span>,
  },
}

function normalizeLabel(value) {
  return String(value || '').trim().replace(/^#/, '').toUpperCase()
}

// ─── Admin Booking Info Popup ─────────────────────────────────────────────────

function AdminSpotPopup({ spot, parking, onClose, onDelete }) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState(null)
  const cat = CATEGORY[spot.type]

  useEffect(() => {
    async function fetchBooking() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('brescia_bookings').select('*')
        .eq('parking_nome', parking.nome).ilike('spot_label', spot.label).maybeSingle()
      if (err) setError(err.message)
      else setBooking(data)
      setLoading(false)
    }
    fetchBooking()
  }, [spot.label, parking.nome])

  async function handleDelete() {
    if (!booking) return
    setDeleting(true)
    const { error: delErr } = await supabase.from('brescia_bookings').delete().eq('id', booking.id)
    if (delErr) { setError(delErr.message); setDeleting(false); setConfirmDelete(false); return }
    onDelete?.()
    onClose()
  }

  const fullName = booking
    ? (booking.first_name || booking.last_name)
      ? `${booking.first_name || ''} ${booking.last_name || ''}`.trim()
      : booking.full_name || booking.nome_utente || '—'
    : null

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '24px', padding: '28px',
        display: 'flex', flexDirection: 'column', gap: '16px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 42, height: 42, borderRadius: '12px',
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444',
            }}>{cat.icon}</div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>#{spot.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{parking.nome}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { label: 'OCCUPATO', bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
            { label: cat.label.toUpperCase(), bg: `${cat.color}15`, color: cat.color, border: `${cat.color}30` },
            { label: '⚙️ ADMIN', bg: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: 'rgba(167,139,250,0.25)' },
          ].map(b => (
            <span key={b.label} style={{
              fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
              background: b.bg, color: b.color, border: `1px solid ${b.border}`, letterSpacing: '.06em',
            }}>{b.label}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>⏳</div>Caricamento…
          </div>
        ) : error ? (
          <div style={{ padding: '12px', background: '#1a0808', border: '1px solid #7f1d1d', borderRadius: '10px', fontSize: '12px', color: '#fca5a5' }}>⚠️ {error}</div>
        ) : !booking ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Nessuna prenotazione trovata.</div>
        ) : (
          <>
            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>👤</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{fullName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{booking.user_email}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>ID: {booking.user_id?.slice(0, 12)}…</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: '📅', label: 'Inizio', value: booking.data_inizio ? new Date(booking.data_inizio).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—' },
                { icon: '⏱', label: 'Durata', value: booking.durata_ore ? `${booking.durata_ore} ${booking.durata_ore === 1 ? 'ora' : 'ore'}` : '—' },
                { icon: '💶', label: 'Costo', value: booking.costo_totale != null ? `${booking.costo_totale}€` : '—', highlight: '#10b981' },
                { icon: '🕐', label: 'Prenotato il', value: booking.created_at ? new Date(booking.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—' },
              ].map(({ icon, label, value, highlight }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{icon} {label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: highlight || 'var(--text-primary)', fontFamily: highlight ? 'DM Mono, monospace' : 'inherit' }}>{value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Chiudi</button>
          {booking && !confirmDelete && (
            <button onClick={() => setConfirmDelete(true)} style={{ flex: 1, padding: '11px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>🗑 Elimina</button>
          )}
          {confirmDelete && (
            <>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '11px', background: '#ef4444', border: 'none', borderRadius: '12px', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700, opacity: deleting ? 0.7 : 1 }}>{deleting ? '…' : 'Sì, elimina'}</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '11px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>No</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SpotCard ─────────────────────────────────────────────────────────────────

function SpotCard({ spot, onBook, onAdminInspect, isAdmin }) {
  const cat = CATEGORY[spot.type]
  const free = !spot.occupied
  const mine = spot.bookedByMe
  const [hovered, setHovered] = useState(false)

  function handleClick() {
    if (free) onBook(spot)
    else if (isAdmin) onAdminInspect(spot)
  }

  const stateColor = mine ? '#10b981' : free ? cat.color : '#ef4444'
  const stateBg = mine
    ? hovered ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.08)'
    : free
      ? hovered ? `${cat.color}22` : `${cat.color}0e`
      : hovered && isAdmin ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)'

  return (
    <button
      onClick={handleClick}
      disabled={!free && !isAdmin}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={mine ? 'Il tuo posto' : spot.occupied ? (isAdmin ? `Dettagli #${spot.label}` : 'Occupato') : `Prenota #${spot.label}`}
      style={{
        background: stateBg,
        border: `2px ${free && !mine ? 'dashed' : 'solid'} ${stateColor}`,
        borderRadius: '12px',
        padding: '12px 4px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
        cursor: (free || isAdmin) ? 'pointer' : 'not-allowed',
        transition: 'all 150ms ease',
        minWidth: 0, position: 'relative',
        transform: hovered && (free || isAdmin) ? 'translateY(-2px)' : 'none',
        boxShadow: hovered && (free || isAdmin) ? `0 6px 18px ${stateColor}28` : 'none',
      }}
    >
      {(mine || (!free && !mine)) && (
        <span style={{
          position: 'absolute', top: '-8px', left: '50%',
          transform: 'translateX(-50%)',
          background: mine ? '#10b981' : '#ef4444',
          color: '#fff', fontSize: '7px', fontWeight: 800,
          padding: '2px 7px', borderRadius: '999px',
          whiteSpace: 'nowrap', letterSpacing: '.05em',
          boxShadow: `0 2px 6px ${mine ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
        }}>
          {mine ? 'TUO' : isAdmin ? '🔍' : '●'}
        </span>
      )}

      <span style={{ fontSize: '9px', fontWeight: 800, color: stateColor, fontFamily: 'DM Mono, monospace', letterSpacing: '.02em' }}>
        #{spot.label}
      </span>
      <span style={{ color: stateColor }}>{cat.icon}</span>
      <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: stateColor, opacity: 0.75 }}>
        {cat.label}
      </span>
    </button>
  )
}

// ─── CategorySection ──────────────────────────────────────────────────────────

function CategorySection({ cat, allSpots, onBook, onAdminInspect, isAdmin }) {
  const [page, setPage] = useState(1)
  const btnsRef = useRef(null)
  const catSpots = allSpots.filter((s) => s.type === cat)
  const catLiberi = catSpots.filter((s) => !s.occupied).length
  const catOccupati = catSpots.length - catLiberi
  const info = CATEGORY[cat]
  const totalPages = Math.ceil(catSpots.length / PAGE_SIZE)
  const visible = catSpots.slice(0, page * PAGE_SIZE)
  const hasMore = page < totalPages
  const pct = Math.round((catLiberi / catSpots.length) * 100)

  const scrollToBtns = () => setTimeout(() => btnsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50)

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '20px', padding: '20px', marginBottom: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: info.bg, border: `1px solid ${info.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color,
          }}>{info.icon}</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{info.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{catSpots.length} posti · {catOccupati} occupati</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: pct > 30 ? info.color : '#ef4444', fontFamily: 'DM Mono, monospace' }}>
              {catLiberi} liberi
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{pct}% disponibile</div>
          </div>
          <div style={{ width: 52, height: 6, borderRadius: '999px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: pct > 30 ? info.color : '#ef4444',
              borderRadius: '999px', transition: 'width 400ms ease',
            }} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: '8px' }}>
        {visible.map((spot) => (
          <SpotCard key={spot.id} spot={spot} onBook={onBook} onAdminInspect={onAdminInspect} isAdmin={isAdmin} />
        ))}
      </div>

      {/* Pagination */}
      {(hasMore || page > 1) && (
        <div ref={btnsRef} style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            {page > 1 && (
              <button onClick={() => { setPage((p) => Math.max(1, p - 1)); scrollToBtns() }} style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '8px 16px',
                color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>← Precedenti</button>
            )}
            {hasMore && (
              <button onClick={() => { setPage((p) => p + 1); scrollToBtns() }} style={{
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '10px', padding: '8px 16px',
                color: '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>Mostra altri →</button>
            )}
          </div>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>
      )}
    </div>
  )
}

// ─── NotificationStack ────────────────────────────────────────────────────────

function NotificationStack({ notifications, onClose }) {
  if (!notifications.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
      {notifications.map((n) => (
        <div key={n.id} style={{
          background: n.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${n.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: '12px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '13px', fontWeight: 600,
          color: n.type === 'success' ? '#10b981' : '#f87171',
        }}>
          <span>{n.type === 'success' ? '✅' : '🗑'}</span>
          <span style={{ flex: 1 }}>{n.message}</span>
          <button onClick={() => onClose(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function BresciaSpotMap({
  parking, onBack, user,
  balance,          // saldo wallet utente (null per admin = bypass)
  onWalletOpen,     // apre il WalletModal dall'esterno
  onBalanceUpdate,  // notifica App.jsx del nuovo saldo dopo prenotazione
  onRefreshBookings,
  refreshKey, externalNotification, onNotificationShown,
}) {
  const baseSpots = useMemo(() => generateSpots(parking), [parking])
  const isAdmin = user?.role === 'admin' || user?.isAdmin

  const [bookings, setBookings] = useState([])
  const [loadingDB, setLoadingDB] = useState(true)
  const [bookedSpot, setBookedSpot] = useState(null)
  const [adminSpot, setAdminSpot] = useState(null)
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random()}`
    setNotifications((prev) => [...prev, { id, type, message }])
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 20000)
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  useEffect(() => {
    if (!externalNotification) return
    addNotification(externalNotification.type, externalNotification.message)
    onNotificationShown?.()
  }, [externalNotification, addNotification, onNotificationShown])

  const fetchBookings = useCallback(async () => {
    setLoadingDB(true)
    const { data, error } = await supabase
      .from('brescia_bookings').select('spot_label, user_id').eq('parking_nome', parking.nome)
    if (!error) setBookings(data ?? [])
    setLoadingDB(false)
  }, [parking.nome])

  useEffect(() => {
    fetchBookings()
    const channel = supabase
      .channel(`brescia-${parking.nome}-${refreshKey ?? 'default'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brescia_bookings', filter: `parking_nome=eq.${parking.nome}` }, fetchBookings)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [parking.nome, refreshKey, fetchBookings])

  const spots = useMemo(() => {
    const bookingsMap = new Map(bookings.map((b) => [normalizeLabel(b.spot_label), b]))
    return baseSpots.map((s) => {
      const booking = bookingsMap.get(normalizeLabel(s.label))
      return { ...s, occupied: !!booking, bookedByMe: booking?.user_id === user?.id }
    })
  }, [baseSpots, bookings, user])

  const summary = {
    liberi: spots.filter((s) => !s.occupied).length,
    auto: spots.filter((s) => s.type === 'auto' && !s.occupied).length,
    moto: spots.filter((s) => s.type === 'moto' && !s.occupied).length,
    disabili: spots.filter((s) => s.type === 'disabile' && !s.occupied).length,
  }
  const pctLiberi = Math.round((summary.liberi / spots.length) * 100)

  return (
    <div style={{ width: '100%', maxWidth: '860px' }}>

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: '10px', color: 'var(--text-secondary)',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          marginBottom: '20px', padding: '8px 14px', transition: 'all 150ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = '#10b981' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Torna alla mappa
      </button>

      {/* Header card */}
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '20px 24px', marginBottom: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, margin: 0 }}>{parking.nome}</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                📍 Brescia · {parking.posti.toLocaleString('it-IT')} posti
                {loadingDB && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>· sincronizzazione…</span>}
                {isAdmin && <span style={{ color: '#a78bfa', fontWeight: 700 }}>· ⚙️ Admin</span>}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'Liberi', value: summary.liberi, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
              { label: 'Auto', value: summary.auto, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
              { label: 'Moto', value: summary.moto, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              { label: 'Disabili', value: summary.disabili, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{
                background: bg, border: `1px solid ${color}25`,
                borderRadius: '10px', padding: '8px 14px', textAlign: 'center', minWidth: '58px',
              }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color, fontFamily: 'DM Mono, monospace' }}>{value}</div>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.08em', color, opacity: 0.7, marginTop: '1px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Disponibilità globale</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: loadingDB ? 'var(--text-muted)' : pctLiberi > 50 ? '#10b981' : '#ef4444', fontFamily: 'DM Mono, monospace' }}>
              {loadingDB ? '…' : `${pctLiberi}%`}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: '999px', background: 'var(--bg-tertiary)', overflow: 'hidden', position: 'relative' }}>
            {loadingDB ? (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border) 50%, var(--bg-tertiary) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s ease-in-out infinite',
                borderRadius: '999px',
              }} />
            ) : (
              <div style={{
                height: '100%', width: `${pctLiberi}%`,
                background: pctLiberi > 50 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #ef4444, #f87171)',
                borderRadius: '999px', transition: 'width 600ms ease',
              }} />
            )}
          </div>
        </div>
      </div>

      {/* Admin hint */}
      {isAdmin && (
        <div style={{
          background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: '12px', padding: '10px 16px', marginBottom: '16px',
          fontSize: '12px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span>⚙️</span>
          <span>Modalità admin — clicca su un posto <strong>occupato</strong> per vedere i dettagli della prenotazione.</span>
        </div>
      )}

      <NotificationStack notifications={notifications} onClose={removeNotification} />

      {['auto', 'moto', 'disabile'].map((cat) => (
        <CategorySection key={cat} cat={cat} allSpots={spots}
          onBook={(spot) => setBookedSpot(spot)}
          onAdminInspect={(spot) => setAdminSpot(spot)}
          isAdmin={isAdmin}
        />
      ))}

      {bookedSpot && (
        <BookingModal
          spot={bookedSpot} parking={parking} user={user}
          balance={balance}
          onWalletOpen={onWalletOpen}
          onClose={() => setBookedSpot(null)}
          onBooked={(newBalance) => {
            setBookings((prev) => [...prev, { spot_label: bookedSpot.label, user_id: user.id }])
            addNotification('success', `Posto #${bookedSpot.label} (${CATEGORY[bookedSpot.type].label}) prenotato!`)
            if (newBalance !== undefined && newBalance !== null) {
              onBalanceUpdate?.(newBalance)
            }
            setBookedSpot(null)
            onRefreshBookings?.()
            fetchBookings()
          }}
        />
      )}

      {adminSpot && (
        <AdminSpotPopup
          spot={adminSpot} parking={parking}
          onClose={() => setAdminSpot(null)}
          onDelete={() => {
            fetchBookings()
            onRefreshBookings?.()
            addNotification('success', `Prenotazione posto #${adminSpot.label} eliminata.`)
          }}
        />
      )}
    </div>
  )
}
