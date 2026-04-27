import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { generateSpots } from '../lib/bresciaParking'
import { supabase } from '../lib/supabase'
import BookingModal from './BookingModal'

const PAGE_SIZE = 40

const CATEGORY = {
  auto: {
    label: 'Auto',
    color: '#60a5fa',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
      </svg>
    ),
  },
  moto: {
    label: 'Moto',
    color: '#f59e0b',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="5.5" cy="17.5" r="2.5" />
        <circle cx="18.5" cy="17.5" r="2.5" />
        <path d="M8 17.5h7l2-6H9l-1.5 3.5" />
      </svg>
    ),
  },
  disabile: {
    label: 'Disabili',
    color: '#a78bfa',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="4" r="1.5" />
        <path d="M9 9h6l1 5H9z" />
        <path d="M9 14l-1 4h8" />
      </svg>
    ),
  },
}

function normalizeLabel(value) {
  return String(value || '').trim().toUpperCase()
}

// ─── Admin Booking Info Popup ────────────────────────────────────────────────

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
        .from('brescia_bookings')
        .select('*')
        .eq('parking_nome', parking.nome)
        .ilike('spot_label', spot.label)
        .maybeSingle()

      if (err) setError(err.message)
      else setBooking(data)
      setLoading(false)
    }
    fetchBooking()
  }, [spot.label, parking.nome])

  async function handleDelete() {
    if (!booking) return
    setDeleting(true)
    const { error: delErr } = await supabase
      .from('brescia_bookings')
      .delete()
      .eq('id', booking.id)

    if (delErr) {
      setError(delErr.message)
      setDeleting(false)
      setConfirmDelete(false)
      return
    }

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
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '380px',
        background: '#16161a', border: '1px solid #2a2a32',
        borderRadius: '20px', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '14px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ef4444',
            }}>
              {cat.icon}
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#e8e8ea', fontFamily: 'DM Mono, monospace' }}>
                #{spot.label}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>{parking.nome}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#4a4a55',
              cursor: 'pointer', fontSize: '18px', lineHeight: 1,
              padding: '4px',
            }}
          >✕</button>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, padding: '3px 10px',
            borderRadius: '999px', background: 'rgba(239,68,68,0.12)',
            color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)',
            textTransform: 'uppercase', letterSpacing: '.06em',
          }}>
            OCCUPATO
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '3px 10px',
            borderRadius: '999px', background: `${cat.color}18`,
            color: cat.color, border: `1px solid ${cat.color}30`,
            textTransform: 'uppercase', letterSpacing: '.06em',
          }}>
            {cat.label}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '3px 10px',
            borderRadius: '999px', background: 'rgba(167,139,250,0.12)',
            color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)',
            textTransform: 'uppercase', letterSpacing: '.06em',
          }}>
            ⚙️ Admin view
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{
            padding: '32px', textAlign: 'center',
            color: '#4a4a55', fontSize: '13px',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            Caricamento dati prenotazione…
          </div>
        ) : error ? (
          <div style={{
            padding: '12px', background: '#1a0808',
            border: '1px solid #7f1d1d', borderRadius: '10px',
            fontSize: '12px', color: '#fca5a5',
          }}>
            ⚠️ {error}
          </div>
        ) : !booking ? (
          <div style={{
            padding: '24px', textAlign: 'center',
            color: '#4a4a55', fontSize: '13px',
          }}>
            Nessuna prenotazione trovata nel database.
          </div>
        ) : (
          <>
            {/* Utente */}
            <div style={{
              background: '#1c1c22', border: '1px solid #2a2a32',
              borderRadius: '12px', padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <div style={{ fontSize: '10px', color: '#4a4a55', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Prenotato da
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', flexShrink: 0,
                }}>
                  👤
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8e8ea' }}>
                    {fullName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>
                    {booking.user_email}
                  </div>
                  <div style={{ fontSize: '10px', color: '#4a4a55', marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>
                    ID: {booking.user_id?.slice(0, 12)}…
                  </div>
                </div>
              </div>
            </div>

            {/* Dettagli prenotazione */}
            <div style={{
              background: '#1c1c22', border: '1px solid #2a2a32',
              borderRadius: '12px', padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              <div style={{ fontSize: '10px', color: '#4a4a55', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Dettagli prenotazione
              </div>

              {[
                {
                  icon: '📅',
                  label: 'Inizio',
                  value: booking.data_inizio
                    ? new Date(booking.data_inizio).toLocaleString('it-IT', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : '—',
                },
                {
                  icon: '⏱',
                  label: 'Durata',
                  value: booking.durata_ore ? `${booking.durata_ore} ${booking.durata_ore === 1 ? 'ora' : 'ore'}` : '—',
                },
                {
                  icon: '💶',
                  label: 'Costo',
                  value: booking.costo_totale != null ? `${booking.costo_totale}€` : '—',
                  highlight: '#10b981',
                },
                {
                  icon: '🕐',
                  label: 'Prenotato il',
                  value: booking.created_at
                    ? new Date(booking.created_at).toLocaleString('it-IT', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : '—',
                },
              ].map(({ icon, label, value, highlight }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {icon} {label}
                  </span>
                  <span style={{
                    fontSize: '13px', fontWeight: 600,
                    color: highlight || '#e8e8ea',
                    fontFamily: highlight ? 'DM Mono, monospace' : 'inherit',
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Error from delete */}
        {error && !loading && (
          <div style={{
            padding: '8px 10px', background: '#2d0d0d',
            border: '1px solid #7f1d1d', borderRadius: '8px',
            fontSize: '12px', color: '#fca5a5',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px',
              background: '#1c1c22', border: '1px solid #2a2a32',
              borderRadius: '10px', color: '#6b7280',
              cursor: 'pointer', fontSize: '13px',
            }}
          >
            Chiudi
          </button>

          {booking && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                flex: 1, padding: '10px',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', color: '#ef4444',
                cursor: 'pointer', fontSize: '13px', fontWeight: 700,
              }}
            >
              🗑 Elimina
            </button>
          )}

          {confirmDelete && (
            <>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: '10px',
                  background: '#ef4444', border: 'none',
                  borderRadius: '10px', color: '#fff',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontWeight: 700,
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? '…' : 'Sì, elimina'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '10px 14px',
                  background: '#1c1c22', border: '1px solid #2a2a32',
                  borderRadius: '10px', color: '#6b7280',
                  cursor: 'pointer', fontSize: '13px',
                }}
              >
                No
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SpotCard ────────────────────────────────────────────────────────────────

function SpotCard({ spot, onBook, onAdminInspect, isAdmin }) {
  const cat = CATEGORY[spot.type]
  const free = !spot.occupied
  const mine = spot.bookedByMe

  const bg = mine
    ? 'rgba(16,185,129,0.20)'
    : free
      ? 'rgba(16,185,129,0.08)'
      : 'rgba(239,68,68,0.22)'

  const border = mine ? '#10b981' : free ? '#10b981' : '#ef4444'
  const textColor = mine ? '#10b981' : free ? '#10b981' : '#ef4444'
  const bdStyle = mine ? 'solid' : free ? 'dashed' : 'solid'

  function handleClick() {
    if (free) {
      onBook(spot)
    } else if (isAdmin) {
      onAdminInspect(spot)
    }
  }

  const title = mine
    ? 'Il tuo posto'
    : spot.occupied
      ? isAdmin
        ? `Visualizza prenotazione #${spot.label}`
        : 'Posto occupato'
      : `Prenota #${spot.label}`

  return (
    <button
      onClick={handleClick}
      disabled={!free && !isAdmin}
      title={title}
      style={{
        background: bg,
        border: `2px ${bdStyle} ${border}`,
        borderRadius: '14px',
        padding: '14px 6px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        cursor: (free || isAdmin) ? 'pointer' : 'not-allowed',
        transition: 'all 150ms',
        minWidth: 0,
        position: 'relative',
        boxShadow: !free && !mine ? '0 0 0 1px rgba(239,68,68,0.18) inset' : 'none',
      }}
      onMouseEnter={(e) => {
        if (free) {
          e.currentTarget.style.background = 'rgba(16,185,129,0.20)'
        } else if (isAdmin && spot.occupied) {
          e.currentTarget.style.background = 'rgba(239,68,68,0.35)'
          e.currentTarget.style.borderColor = '#ef4444'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = bg
        e.currentTarget.style.borderColor = border
      }}
    >
      {mine && (
        <span
          style={{
            position: 'absolute', top: '-7px', left: '50%',
            transform: 'translateX(-50%)',
            background: '#10b981', color: '#fff',
            fontSize: '8px', fontWeight: 700, padding: '2px 6px',
            borderRadius: '999px', whiteSpace: 'nowrap', letterSpacing: '.04em',
          }}
        >
          TUO
        </span>
      )}

      {!free && !mine && (
        <span
          style={{
            position: 'absolute', top: '-7px', left: '50%',
            transform: 'translateX(-50%)',
            background: '#ef4444', color: '#fff',
            fontSize: '8px', fontWeight: 700, padding: '2px 6px',
            borderRadius: '999px', whiteSpace: 'nowrap', letterSpacing: '.04em',
          }}
        >
          {isAdmin ? '🔍' : 'OCCUPATO'}
        </span>
      )}

      <span style={{ fontSize: '10px', fontWeight: 700, color: textColor, fontFamily: 'DM Mono, monospace' }}>
        #{spot.label}
      </span>

      <span style={{ color: free || mine ? cat.color : '#ef4444' }}>
        {cat.icon}
      </span>

      <span style={{
        fontSize: '9px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '.08em',
        color: free || mine ? cat.color : '#ef4444',
      }}>
        {cat.label}
      </span>
    </button>
  )
}

// ─── CategorySection ─────────────────────────────────────────────────────────

function CategorySection({ cat, allSpots, onBook, onAdminInspect, isAdmin }) {
  const [page, setPage] = useState(1)
  const btnsRef = useRef(null)

  const catSpots = allSpots.filter((s) => s.type === cat)
  const catLiberi = catSpots.filter((s) => !s.occupied).length
  const info = CATEGORY[cat]
  const totalPages = Math.ceil(catSpots.length / PAGE_SIZE)
  const visible = catSpots.slice(0, page * PAGE_SIZE)
  const hasMore = page < totalPages

  const scrollToBtns = () =>
    setTimeout(() => {
      btnsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 50)

  return (
    <div style={{
      background: '#16161a', border: '1px solid #2a2a32',
      borderRadius: '16px', padding: '20px', marginBottom: '16px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px', flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: info.color }}>{info.icon}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#e8e8ea' }}>{info.label}</span>
          <span style={{ fontSize: '11px', color: '#4a4a55' }}>{catSpots.length} posti totali</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: info.color, fontFamily: 'DM Mono, monospace' }}>
            {catLiberi}/{catSpots.length} liberi
          </span>
          {totalPages > 1 && (
            <span style={{ fontSize: '11px', color: '#4a4a55', fontFamily: 'DM Mono, monospace' }}>
              {Math.min(page * PAGE_SIZE, catSpots.length)}/{catSpots.length}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
        {visible.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            onBook={onBook}
            onAdminInspect={onAdminInspect}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {(hasMore || page > 1) && (
        <div ref={btnsRef} style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: '#2a2a32' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            {page > 1 && (
              <button
                onClick={() => { setPage((p) => Math.max(1, p - 1)); scrollToBtns() }}
                style={{
                  background: 'transparent', border: '1px solid #2a2a32',
                  borderRadius: '10px', padding: '9px 16px',
                  color: '#6b7280', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 150ms', whiteSpace: 'nowrap',
                }}
              >
                ← Precedenti
              </button>
            )}
            {hasMore && (
              <button
                onClick={() => { setPage((p) => p + 1); scrollToBtns() }}
                style={{
                  background: 'transparent', border: '1px solid #2a2a32',
                  borderRadius: '10px', padding: '9px 16px',
                  color: '#10b981', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 150ms', whiteSpace: 'nowrap',
                }}
              >
                Mostra altri →
              </button>
            )}
          </div>
          <div style={{ flex: 1, height: '1px', background: '#2a2a32' }} />
        </div>
      )}
    </div>
  )
}

// ─── NotificationStack ────────────────────────────────────────────────────────

function NotificationStack({ notifications, onClose }) {
  if (!notifications.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            background: n.type === 'success' ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
            border: `1px solid ${n.type === 'success' ? '#10b981' : '#ef4444'}`,
            borderRadius: '12px', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '14px',
            color: n.type === 'success' ? '#10b981' : '#f87171',
            fontWeight: 600,
          }}
        >
          <span>{n.type === 'success' ? '✅' : '🗑'}</span>
          <span style={{ flex: 1 }}>{n.message}</span>
          <button
            onClick={() => onClose(n.id)}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '16px' }}
          >✕</button>
        </div>
      ))}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function BresciaSpotMap({
  parking,
  onBack,
  user,
  onRefreshBookings,
  refreshKey,
  externalNotification,
  onNotificationShown,
}) {
  const baseSpots = useMemo(() => generateSpots(parking), [parking])
  const isAdmin = user?.role === 'admin' || user?.isAdmin

  const [bookings, setBookings] = useState([])
  const [loadingDB, setLoadingDB] = useState(true)
  const [bookedSpot, setBookedSpot] = useState(null)
  const [adminSpot, setAdminSpot] = useState(null)   // ← admin popup target
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random()}`
    setNotifications((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 20000)
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
      .from('brescia_bookings')
      .select('spot_label, user_id')
      .eq('parking_nome', parking.nome)

    if (!error) setBookings(data ?? [])
    setLoadingDB(false)
  }, [parking.nome])

  useEffect(() => {
    fetchBookings()

    const channel = supabase
      .channel(`brescia-${parking.nome}-${refreshKey ?? 'default'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'brescia_bookings', filter: `parking_nome=eq.${parking.nome}` },
        () => { fetchBookings() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [parking.nome, refreshKey, fetchBookings])

  const spots = useMemo(() => {
    const bookingsMap = new Map(bookings.map((b) => [normalizeLabel(b.spot_label), b]))
    return baseSpots.map((s) => {
      const booking = bookingsMap.get(normalizeLabel(s.label))
      return { ...s, occupied: !!booking, bookedByMe: booking?.user_id === user?.id }
    })
  }, [baseSpots, bookings, user])

  const summary = {
    totale: spots.length,
    liberi: spots.filter((s) => !s.occupied).length,
    auto: spots.filter((s) => s.type === 'auto' && !s.occupied).length,
    moto: spots.filter((s) => s.type === 'moto' && !s.occupied).length,
    disabili: spots.filter((s) => s.type === 'disabile' && !s.occupied).length,
  }

  return (
    <div style={{ width: '100%', maxWidth: '800px' }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: 'none', color: '#6b7280',
          fontSize: '13px', cursor: 'pointer', marginBottom: '24px',
          padding: 0, transition: 'color 150ms',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Torna alla mappa
      </button>

      {/* Header card */}
      <div style={{
        background: '#16161a', border: '1px solid #2a2a32',
        borderRadius: '16px', padding: '20px 24px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e8e8ea', lineHeight: 1 }}>
              {parking.nome}
            </h2>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              📍 Brescia · {parking.posti.toLocaleString('it-IT')} posti totali
              {loadingDB && <span style={{ marginLeft: 8, color: '#4a4a55' }}>· aggiornamento...</span>}
              {isAdmin && <span style={{ marginLeft: 8, color: '#a78bfa', fontWeight: 600 }}>· ⚙️ Modalità admin</span>}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'Liberi', value: summary.liberi, color: '#10b981' },
            { label: 'Auto', value: summary.auto, color: '#60a5fa' },
            { label: 'Moto', value: summary.moto, color: '#f59e0b' },
            { label: 'Disabili', value: summary.disabili, color: '#a78bfa' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: '#1c1c22', border: '1px solid #2a2a32',
              borderRadius: '8px', padding: '6px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color, fontFamily: 'DM Mono, monospace' }}>
                {value}
              </div>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.08em', color: '#4a4a55' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin hint */}
      {isAdmin && (
        <div style={{
          background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: '10px', padding: '10px 16px', marginBottom: '16px',
          fontSize: '12px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span>⚙️</span>
          <span>Sei in modalità admin — clicca su un posto <strong>occupato</strong> per vedere i dettagli della prenotazione.</span>
        </div>
      )}

      <NotificationStack notifications={notifications} onClose={removeNotification} />

      {['auto', 'moto', 'disabile'].map((cat) => (
        <CategorySection
          key={cat}
          cat={cat}
          allSpots={spots}
          onBook={(spot) => setBookedSpot(spot)}
          onAdminInspect={(spot) => setAdminSpot(spot)}
          isAdmin={isAdmin}
        />
      ))}

      {/* Normal booking modal */}
      {bookedSpot && (
        <BookingModal
          spot={bookedSpot}
          parking={parking}
          user={user}
          onClose={() => setBookedSpot(null)}
          onBooked={() => {
            setBookings((prev) => [
              ...prev,
              { spot_label: bookedSpot.label, user_id: user.id },
            ])
            addNotification('success', `Posto #${bookedSpot.label} (${CATEGORY[bookedSpot.type].label}) prenotato con successo!`)
            setBookedSpot(null)
            onRefreshBookings?.()
            fetchBookings()
          }}
        />
      )}

      {/* Admin inspect popup */}
      {adminSpot && (
        <AdminSpotPopup
          spot={adminSpot}
          parking={parking}
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