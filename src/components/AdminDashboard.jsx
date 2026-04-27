import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const TABS = [
  { id: 'stats', label: '📊 Dashboard' },
  { id: 'bookings', label: '📋 Prenotazioni' },
  { id: 'users', label: '👥 Utenti' },
]

function StatCard({ label, value, color, sub }) {
  return (
    <div
      style={{
        background: '#16161a',
        border: '1px solid #2a2a32',
        borderRadius: '16px',
        padding: '20px 24px',
        flex: 1,
        minWidth: '160px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 800,
          color,
          fontFamily: 'DM Mono, monospace',
          marginTop: '6px',
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: '#4a4a55', marginTop: '4px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Badge({ children, color }) {
  return (
    <span
      style={{
        background: `${color}22`,
        border: `1px solid ${color}55`,
        color,
        fontSize: '10px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '999px',
        textTransform: 'uppercase',
        letterSpacing: '.06em',
      }}
    >
      {children}
    </span>
  )
}

export default function AdminDashboard({ user, onBack }) {
  const [tab, setTab] = useState('stats')
  const [bookings, setBookings] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)

    const [
      { data: bookingsData, error: bookingsError },
      { data: usersData, error: usersError },
    ] = await Promise.all([
      supabase
        .from('brescia_bookings')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('*')
        .order('email', { ascending: true }),
    ])

    if (bookingsError) {
      console.error('Errore bookings:', bookingsError)
    }

    if (usersError) {
      console.error('Errore users:', usersError)
    }

    setBookings(bookingsData ?? [])
    setUsers(usersData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function deleteBooking(id) {
    setDeleting(id)

    const { error } = await supabase
      .from('brescia_bookings')
      .delete()
      .eq('id', id)

    if (!error) {
      setBookings((prev) => prev.filter((b) => b.id !== id))
    } else {
      console.error('Errore delete booking:', error)
    }

    setDeleting(null)
    setConfirm(null)
  }

  async function toggleAdmin(userId, current) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !current })
      .eq('id', userId)

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_admin: !current } : u
        )
      )
    } else {
      console.error('Errore toggle admin:', error)
    }
  }

  const totalBookings = bookings.length
  const totalUsers = users.length
  const totalAdmins = users.filter((u) => u.is_admin).length
  const parkingCount = [...new Set(bookings.map((b) => b.parking_nome))].length

  const perParking = bookings.reduce((acc, b) => {
    acc[b.parking_nome] = (acc[b.parking_nome] || 0) + 1
    return acc
  }, {})

  const topParking = Object.entries(perParking).sort((a, b) => b[1] - a[1])[0]

  const filteredBookings = bookings.filter((b) =>
    search === '' ||
    b.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    b.parking_nome?.toLowerCase().includes(search.toLowerCase()) ||
    b.spot_label?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = users.filter((u) =>
    search === '' ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const inputStyle = {
    background: '#1c1c22',
    border: '1px solid #2a2a32',
    borderRadius: '10px',
    color: '#e8e8ea',
    padding: '9px 14px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  const btnDanger = {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid #ef444455',
    borderRadius: '8px',
    color: '#ef4444',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  }

  const thStyle = {
    padding: '10px 14px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#4a4a55',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    textAlign: 'left',
    borderBottom: '1px solid #2a2a32',
    whiteSpace: 'nowrap',
  }

  const tdStyle = {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#e8e8ea',
    borderBottom: '1px solid #1c1c22',
    verticalAlign: 'middle',
  }

  return (
    <div style={{ width: '100%', maxWidth: '900px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e8e8ea', margin: 0 }}>
              Admin Dashboard
            </h2>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: '1px solid #2a2a32',
            borderRadius: '10px',
            color: '#6b7280',
            padding: '8px 16px',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Torna all'app
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          background: '#1c1c22',
          borderRadius: '12px',
          padding: '4px',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setSearch('')
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              background: tab === t.id ? '#2a2a32' : 'transparent',
              border: 'none',
              borderRadius: '9px',
              color: tab === t.id ? '#e8e8ea' : '#6b7280',
              fontSize: '13px',
              fontWeight: tab === t.id ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#4a4a55', padding: '60px 0', fontSize: '14px' }}>
          Caricamento...
        </div>
      ) : (
        <>
          {tab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <StatCard label="Prenotazioni totali" value={totalBookings} color="#10b981" />
                <StatCard label="Utenti registrati" value={totalUsers} color="#60a5fa" />
                <StatCard label="Parcheggi usati" value={parkingCount} color="#f59e0b" />
                <StatCard label="Amministratori" value={totalAdmins} color="#a78bfa" />
              </div>

              {topParking && (
                <div
                  style={{
                    background: '#16161a',
                    border: '1px solid #2a2a32',
                    borderRadius: '16px',
                    padding: '20px 24px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '16px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                    }}
                  >
                    Prenotazioni per parcheggio
                  </div>

                  {Object.entries(perParking)
                    .sort((a, b) => b[1] - a[1])
                    .map(([nome, count]) => {
                      const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0

                      return (
                        <div key={nome} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', color: '#e8e8ea' }}>{nome}</span>
                            <span
                              style={{
                                fontSize: '12px',
                                color: '#10b981',
                                fontFamily: 'DM Mono, monospace',
                                fontWeight: 700,
                              }}
                            >
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div
                            style={{
                              height: '6px',
                              background: '#2a2a32',
                              borderRadius: '999px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                borderRadius: '999px',
                                background: 'linear-gradient(90deg, #10b981, #059669)',
                                width: `${pct}%`,
                                transition: 'width 600ms ease',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}

              {totalBookings === 0 && (
                <div style={{ textAlign: 'center', color: '#4a4a55', padding: '40px 0', fontSize: '14px' }}>
                  Nessuna prenotazione ancora.
                </div>
              )}
            </div>
          )}

          {tab === 'bookings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                placeholder="🔍 Cerca per nome, email, parcheggio, posto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={inputStyle}
              />

              <div
                style={{
                  background: '#16161a',
                  border: '1px solid #2a2a32',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ background: '#1c1c22' }}>
                        <th style={thStyle}>Utente</th>
                        <th style={thStyle}>Parcheggio</th>
                        <th style={thStyle}>Posto</th>
                        <th style={thStyle}>Tipo</th>
                        <th style={thStyle}>Data inizio</th>
                        <th style={thStyle}>Durata</th>
                        <th style={thStyle}>Costo</th>
                        <th style={thStyle}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#4a4a55', padding: '40px' }}>
                            Nessuna prenotazione trovata.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr
                            key={b.id}
                            style={{ transition: 'background 150ms' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#1c1c22'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 600 }}>{b.full_name || b.nome_utente || '—'}</div>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>{b.user_email}</div>
                            </td>
                            <td style={tdStyle}>{b.parking_nome}</td>
                            <td
                              style={{
                                ...tdStyle,
                                fontFamily: 'DM Mono, monospace',
                                fontWeight: 700,
                                color: '#10b981',
                              }}
                            >
                              #{b.spot_label}
                            </td>
                            <td style={tdStyle}>
                              <Badge
                                color={
                                  b.spot_type === 'auto'
                                    ? '#60a5fa'
                                    : b.spot_type === 'moto'
                                    ? '#f59e0b'
                                    : '#a78bfa'
                                }
                              >
                                {b.spot_type}
                              </Badge>
                            </td>
                            <td style={{ ...tdStyle, fontSize: '12px', color: '#6b7280' }}>
                              {b.data_inizio
                                ? new Date(b.data_inizio).toLocaleString('it-IT', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })
                                : '—'}
                            </td>
                            <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace' }}>
                              {b.durata_ore ? `${b.durata_ore}h` : '—'}
                            </td>
                            <td
                              style={{
                                ...tdStyle,
                                fontFamily: 'DM Mono, monospace',
                                color: '#10b981',
                                fontWeight: 700,
                              }}
                            >
                              {b.costo_totale != null ? `${b.costo_totale}€` : '—'}
                            </td>
                            <td style={tdStyle}>
                              {confirm === b.id ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => deleteBooking(b.id)}
                                    disabled={deleting === b.id}
                                    style={{ ...btnDanger, opacity: deleting === b.id ? 0.5 : 1 }}
                                  >
                                    {deleting === b.id ? '...' : 'Sì'}
                                  </button>
                                  <button
                                    onClick={() => setConfirm(null)}
                                    style={{
                                      background: 'transparent',
                                      border: '1px solid #2a2a32',
                                      borderRadius: '8px',
                                      color: '#6b7280',
                                      padding: '5px 10px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirm(b.id)} style={btnDanger}>
                                  🗑 Elimina
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                placeholder="🔍 Cerca per nome o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={inputStyle}
              />

              <div
                style={{
                  background: '#16161a',
                  border: '1px solid #2a2a32',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1c1c22' }}>
                      <th style={thStyle}>Utente</th>
                      <th style={thStyle}>Prenotazioni</th>
                      <th style={thStyle}>Ruolo</th>
                      <th style={thStyle}>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#4a4a55', padding: '40px' }}>
                          Nessun utente trovato.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const userBookings = bookings.filter((b) => b.user_id === u.id).length
                        const isMe = u.id === user?.id

                        return (
                          <tr
                            key={u.id}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#1c1c22'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {u.email}
                                {isMe && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      color: '#10b981',
                                      fontWeight: 700,
                                    }}
                                  >
                                    (tu)
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'DM Mono, monospace' }}>
                                {u.id?.slice(0, 12)}…
                              </div>
                            </td>
                            <td
                              style={{
                                ...tdStyle,
                                fontFamily: 'DM Mono, monospace',
                                color: '#60a5fa',
                                fontWeight: 700,
                              }}
                            >
                              {userBookings}
                            </td>
                            <td style={tdStyle}>
                              <Badge color={u.is_admin ? '#a78bfa' : '#6b7280'}>
                                {u.is_admin ? 'Admin' : 'Utente'}
                              </Badge>
                            </td>
                            <td style={tdStyle}>
                              {!isMe && (
                                <button
                                  onClick={() => toggleAdmin(u.id, u.is_admin)}
                                  style={{
                                    background: u.is_admin
                                      ? 'rgba(239,68,68,0.12)'
                                      : 'rgba(167,139,250,0.12)',
                                    border: `1px solid ${u.is_admin ? '#ef444455' : '#a78bfa55'}`,
                                    borderRadius: '8px',
                                    color: u.is_admin ? '#ef4444' : '#a78bfa',
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {u.is_admin ? '− Rimuovi admin' : '+ Rendi admin'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}