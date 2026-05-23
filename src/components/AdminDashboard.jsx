import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const TABS = [
  { id: 'stats',    label: '📊 Dashboard' },
  { id: 'incassi',  label: '💶 Incassi'   },
  { id: 'bookings', label: '📋 Prenotazioni' },
  { id: 'users',    label: '👥 Utenti'    },
  { id: 'online',   label: '🟢 Online'    },
]

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: '20px 24px', flex: 1, minWidth: '160px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 800, color, fontFamily: 'DM Mono, monospace', marginTop: '6px', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

function Badge({ children, color }) {
  return (
    <span style={{
      background: `${color}18`, border: `1px solid ${color}40`, color,
      fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
      textTransform: 'uppercase', letterSpacing: '.06em',
    }}>
      {children}
    </span>
  )
}

function isExpired(b) {
  if (!b.data_inizio || !b.durata_ore) return false
  const fine = new Date(new Date(b.data_inizio).getTime() + b.durata_ore * 3600000)
  return fine < new Date()
}

export default function AdminDashboard({ user, onlineUsers = [], onBack }) {
  const [tab, setTab]           = useState('stats')
  const [bookings, setBookings] = useState([])
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [deleting, setDeleting] = useState(null)
  const [confirm, setConfirm]   = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: bData }, { data: uData }] = await Promise.all([
      supabase.from('brescia_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('email', { ascending: true }),
    ])
    setBookings(bData ?? [])
    setUsers(uData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    async function deleteExpired() {
      const expired = bookings.filter(isExpired)
      if (!expired.length) return
      const ids = expired.map((b) => b.id)
      const { error } = await supabase.from('brescia_bookings').delete().in('id', ids)
      if (!error) setBookings((prev) => prev.filter((b) => !ids.includes(b.id)))
    }
    deleteExpired()
    const interval = setInterval(deleteExpired, 60000)
    return () => clearInterval(interval)
  }, [bookings.length])

  async function deleteBooking(id) {
    setDeleting(id)
    const { error } = await supabase.from('brescia_bookings').delete().eq('id', id)
    if (!error) setBookings((prev) => prev.filter((b) => b.id !== id))
    setDeleting(null)
    setConfirm(null)
  }

  async function toggleAdmin(userId, current) {
    const { error } = await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId)
    if (!error) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_admin: !current } : u))
  }

  const totalBookings = bookings.length
  const totalUsers    = users.length
  const parkingCount  = [...new Set(bookings.map((b) => b.parking_nome))].length
  const perParking    = bookings.reduce((acc, b) => { acc[b.parking_nome] = (acc[b.parking_nome] || 0) + 1; return acc }, {})

  const totaleIncassato = bookings.reduce((s, b) => s + (b.costo_totale ?? 0), 0)
  const oggi = new Date()
  const incassoMese = bookings
    .filter((b) => new Date(b.created_at) >= new Date(oggi.getFullYear(), oggi.getMonth(), 1))
    .reduce((s, b) => s + (b.costo_totale ?? 0), 0)
  const incassoOggi = bookings
    .filter((b) => new Date(b.created_at).toDateString() === oggi.toDateString())
    .reduce((s, b) => s + (b.costo_totale ?? 0), 0)

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return {
      label: d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }),
      totale: bookings
        .filter((b) => new Date(b.created_at).toDateString() === d.toDateString())
        .reduce((s, b) => s + (b.costo_totale ?? 0), 0),
    }
  })
  const maxDay = Math.max(...last7.map((d) => d.totale), 1)

  const incassiPerParcheggio = bookings.reduce((acc, b) => {
    const k = b.parking_nome || '—'
    if (!acc[k]) acc[k] = { count: 0, totale: 0 }
    acc[k].count++
    acc[k].totale += b.costo_totale ?? 0
    return acc
  }, {})

  const filteredBookings = bookings.filter((b) =>
    !search ||
    b.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    b.parking_nome?.toLowerCase().includes(search.toLowerCase()) ||
    b.spot_label?.toLowerCase().includes(search.toLowerCase()) ||
    b.booking_code?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredUsers = users.filter((u) =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const inputStyle = {
    background: 'var(--input-bg)', border: '1.5px solid var(--border)',
    borderRadius: '10px', color: 'var(--text-primary)',
    padding: '9px 14px', fontSize: '13px', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }
  const thStyle = {
    padding: '10px 14px', fontSize: '10px', fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em',
    textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
    background: 'var(--bg-tertiary)',
  }
  const tdStyle = {
    padding: '12px 14px', fontSize: '13px', color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border)', verticalAlign: 'middle',
  }
  const btnDanger = {
    background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.25)',
    borderRadius: '8px', color: '#dc2626', padding: '5px 12px',
    fontSize: '12px', fontWeight: 700, cursor: 'pointer',
  }

  return (
    <div style={{ width: '100%', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Admin Dashboard</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>Pannello di controllo ParkManager</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '10px', padding: '7px 12px',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 0 3px rgba(16,185,129,0.2)' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>{onlineUsers.length} online</span>
          </div>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
              borderRadius: '10px', color: 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '8px 14px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Torna alla mappa
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch('') }}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
              background: tab === t.id ? 'var(--bg-secondary)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
              position: 'relative',
            }}
          >
            {t.label}
            {t.id === 'online' && onlineUsers.length > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>⏳</div>Caricamento…
        </div>
      ) : (
        <>
          {/* STATS */}
          {tab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <StatCard label="Prenotazioni totali" value={totalBookings} color="#10b981" />
                <StatCard label="Utenti registrati" value={totalUsers} color="#3b82f6" />
                <StatCard label="Parcheggi attivi" value={parkingCount} color="#f59e0b" />
                <StatCard label="Incassato totale" value={`${totaleIncassato}€`} color="#a78bfa" sub={`${incassoMese}€ questo mese`} />
              </div>
              {Object.keys(perParking).length > 0 && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: '14px' }}>
                    Prenotazioni per parcheggio
                  </div>
                  {Object.entries(perParking).sort((a, b) => b[1] - a[1]).map(([nome, count]) => {
                    const pct = Math.round((count / totalBookings) * 100)
                    return (
                      <div key={nome} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{nome}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>{count} · {pct}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: '999px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '999px' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* INCASSI */}
          {tab === 'incassi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <StatCard label="Incassato totale" value={`${totaleIncassato}€`} color="#10b981" />
                <StatCard label="Questo mese" value={`${incassoMese}€`} color="#a78bfa" />
                <StatCard label="Oggi" value={`${incassoOggi}€`} color="#f59e0b" />
                <StatCard label="Media prenotazione" value={totalBookings > 0 ? `${(totaleIncassato / totalBookings).toFixed(1)}€` : '—'} color="#3b82f6" />
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: '20px' }}>
                  Incassi ultimi 7 giorni
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
                  {last7.map((d, i) => {
                    const h = Math.max(4, (d.totale / maxDay) * 100)
                    const isToday = i === 6
                    return (
                      <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                        {d.totale > 0 && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: isToday ? '#10b981' : 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                            {d.totale}€
                          </span>
                        )}
                        <div style={{
                          width: '100%', height: `${h}%`, minHeight: '4px',
                          background: isToday ? 'linear-gradient(180deg,#10b981,#059669)' : 'linear-gradient(180deg,#3b82f6,#2563eb)',
                          borderRadius: '6px 6px 3px 3px', opacity: isToday ? 1 : 0.5,
                        }} />
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{d.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Incassi per parcheggio</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Parcheggio</th>
                      <th style={thStyle}>Prenotazioni</th>
                      <th style={thStyle}>Incassato</th>
                      <th style={thStyle}>Media</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(incassiPerParcheggio).sort((a, b) => b[1].totale - a[1].totale).map(([nome, { count, totale }]) => (
                      <tr key={nome}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{nome}</td>
                        <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace', color: '#3b82f6', fontWeight: 700 }}>{count}</td>
                        <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace', color: '#10b981', fontWeight: 700 }}>{totale}€</td>
                        <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace', color: 'var(--text-secondary)' }}>
                          {count > 0 ? `${(totale / count).toFixed(1)}€` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRENOTAZIONI */}
          {tab === 'bookings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input placeholder="🔍 Cerca…" value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Utente</th>
                        <th style={thStyle}>Parcheggio</th>
                        {/* ← COLONNA CODICE: mostra booking_code univoco */}
                        <th style={{ ...thStyle, color: '#10b981' }}>Codice</th>
                        <th style={thStyle}>Posto</th>
                        <th style={thStyle}>Tipo</th>
                        <th style={thStyle}>Inizio</th>
                        <th style={thStyle}>Durata</th>
                        <th style={thStyle}>Costo</th>
                        <th style={thStyle}>Stato</th>
                        <th style={thStyle}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length === 0 ? (
                        <tr><td colSpan={10} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Nessuna prenotazione trovata.</td></tr>
                      ) : filteredBookings.map((b) => {
                        const expired = isExpired(b)
                        // booking_code = codice univoco per prenotazione (BKG-XXXXXXXX)
                        // fallback: genera un codice deterministico dall'id se manca il campo DB
                        const bCode = b.booking_code || `BKG-${b.id?.toString(16).slice(-8).toUpperCase().padStart(8, '0')}`
                        return (
                          <tr key={b.id} style={{ opacity: expired ? 0.5 : 1 }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 600 }}>{b.full_name || b.nome_utente || '—'}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{b.user_email}</div>
                            </td>
                            <td style={{ ...tdStyle, fontSize: '12px' }}>{b.parking_nome}</td>
                            {/* Codice univoco prenotazione */}
                            <td style={tdStyle}>
                              <span style={{
                                fontFamily: 'DM Mono, monospace',
                                fontSize: '11px', fontWeight: 700,
                                color: '#10b981',
                                background: 'rgba(16,185,129,0.08)',
                                border: '1px solid rgba(16,185,129,0.22)',
                                borderRadius: '6px',
                                padding: '3px 8px',
                                whiteSpace: 'nowrap',
                                letterSpacing: '.04em',
                              }}>
                                {bCode}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: '#10b981' }}>#{b.spot_label}</td>
                            <td style={tdStyle}>
                              <Badge color={b.spot_type === 'auto' ? '#3b82f6' : b.spot_type === 'moto' ? '#f59e0b' : '#7c3aed'}>{b.spot_type}</Badge>
                            </td>
                            <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {b.data_inizio ? new Date(b.data_inizio).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                            </td>
                            <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace' }}>{b.durata_ore ? `${b.durata_ore}h` : '—'}</td>
                            <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace', color: '#10b981', fontWeight: 700 }}>
                              {b.costo_totale != null ? `${b.costo_totale}€` : '—'}
                            </td>
                            <td style={tdStyle}>
                              <Badge color={expired ? '#ef4444' : '#10b981'}>{expired ? 'Scaduta' : 'Attiva'}</Badge>
                            </td>
                            <td style={tdStyle}>
                              {confirm === b.id ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button onClick={() => deleteBooking(b.id)} disabled={deleting === b.id} style={{ ...btnDanger, opacity: deleting === b.id ? 0.5 : 1 }}>
                                    {deleting === b.id ? '…' : 'Sì'}
                                  </button>
                                  <button onClick={() => setConfirm(null)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}>No</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirm(b.id)} style={btnDanger}>🗑 Elimina</button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* UTENTI */}
          {tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input placeholder="🔍 Cerca per email…" value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Utente</th>
                      <th style={thStyle}>Prenotazioni</th>
                      <th style={thStyle}>Speso</th>
                      <th style={thStyle}>Stato</th>
                      <th style={thStyle}>Ruolo</th>
                      <th style={thStyle}>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Nessun utente trovato.</td></tr>
                    ) : filteredUsers.map((u) => {
                      const userBookings = bookings.filter((b) => b.user_id === u.id)
                      const speso = userBookings.reduce((s, b) => s + (b.costo_totale ?? 0), 0)
                      const isMe = u.id === user?.id
                      const isOnline = onlineUsers.some((o) => o.user_id === u.id)
                      return (
                        <tr key={u.id}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {u.email}
                              {isMe && <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>(tu)</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{u.id?.slice(0, 12)}…</div>
                          </td>
                          <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace', color: '#3b82f6', fontWeight: 700 }}>{userBookings.length}</td>
                          <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace', color: '#10b981', fontWeight: 700 }}>{speso}€</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? '#10b981' : 'var(--text-muted)', display: 'inline-block' }} />
                              <span style={{ fontSize: '11px', color: isOnline ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                                {isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </td>
                          <td style={tdStyle}><Badge color={u.is_admin ? '#7c3aed' : 'var(--text-muted)'}>{u.is_admin ? 'Admin' : 'Utente'}</Badge></td>
                          <td style={tdStyle}>
                            {!isMe && (
                              <button onClick={() => toggleAdmin(u.id, u.is_admin)} style={{
                                background: u.is_admin ? 'rgba(220,38,38,0.06)' : 'rgba(124,58,237,0.06)',
                                border: `1px solid ${u.is_admin ? 'rgba(220,38,38,0.25)' : 'rgba(124,58,237,0.25)'}`,
                                borderRadius: '8px', color: u.is_admin ? '#dc2626' : '#7c3aed',
                                padding: '5px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                              }}>
                                {u.is_admin ? '− Rimuovi admin' : '+ Rendi admin'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ONLINE */}
          {tab === 'online' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <StatCard label="Online ora" value={onlineUsers.length} color="#10b981" />
                <StatCard label="Admin online" value={onlineUsers.filter((u) => u.is_admin).length} color="#a78bfa" />
                <StatCard label="Utenti online" value={onlineUsers.filter((u) => !u.is_admin).length} color="#3b82f6" />
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                {onlineUsers.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>👻</div>
                    Nessun utente online al momento
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Utente</th>
                        <th style={thStyle}>Ruolo</th>
                        <th style={thStyle}>Online da</th>
                      </tr>
                    </thead>
                    <tbody>
                      {onlineUsers.sort((a, b) => new Date(a.online_at) - new Date(b.online_at)).map((u) => (
                        <tr key={u.user_id}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0, boxShadow: '0 0 0 3px rgba(16,185,129,0.2)' }} />
                              <div>
                                <div style={{ fontWeight: 600 }}>{u.email}</div>
                                {u.user_id === user.id && <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>sei tu</div>}
                              </div>
                            </div>
                          </td>
                          <td style={tdStyle}><Badge color={u.is_admin ? '#a78bfa' : '#3b82f6'}>{u.is_admin ? 'Admin' : 'Utente'}</Badge></td>
                          <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {new Date(u.online_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
