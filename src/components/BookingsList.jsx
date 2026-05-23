import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import BookingTimer from './BookingTimer'
 
const typeColor = { auto: '#3b82f6', moto: '#f59e0b', disabile: '#7c3aed' }
 
export default function BookingsList({ bookings = [], user, onDelete }) {
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [error, setError] = useState(null)
  const [localBookings, setLocalBookings] = useState(bookings)
  const [collapsedGroups, setCollapsedGroups] = useState({})
 
  useEffect(() => {
    setLocalBookings(bookings)
  }, [bookings])
 
  async function handleDelete(booking) {
    setDeletingId(booking.id)
    setError(null)
    const { error: delErr } = await supabase.from('brescia_bookings').delete().eq('id', booking.id)
    if (delErr) { setError('Errore: ' + delErr.message); setDeletingId(null); setConfirmId(null); return }
    onDelete?.(booking)
    setDeletingId(null)
    setConfirmId(null)
  }
 
  function handleExpired(id) {
    setLocalBookings((prev) => prev.filter((b) => b.id !== id))
    onDelete?.({ id })
  }
 
  function toggleGroup(nome) {
    setCollapsedGroups((prev) => ({ ...prev, [nome]: !prev[nome] }))
  }
 
  function getNomeUtente(b) {
    if (b.first_name || b.last_name) return `${b.first_name || ''} ${b.last_name || ''}`.trim()
    if (b.full_name) return b.full_name
    if (b.nome_utente) return b.nome_utente
    return null
  }
 
  if (!user) return (
<p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
      Accedi per vedere le prenotazioni.
</p>
  )
 
  if (localBookings.length === 0) return (
<p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
      Nessuna prenotazione.
</p>
  )
 
  const grouped = user.isAdmin
    ? localBookings.reduce((acc, b) => {
        const key = b.parking_nome || 'Sconosciuto'
        if (!acc[key]) acc[key] = []
        acc[key].push(b)
        return acc
      }, {})
    : { __all__: localBookings }
 
  function renderCard(b) {
    const tc = typeColor[b.spot_type] ?? 'var(--text-muted)'
    const canDelete = user.isAdmin || b.user_id === user.id
    const nomeUtente = getNomeUtente(b)
 
    return (
<div
        key={b.id}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px', padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: '6px',
          boxShadow: 'var(--shadow-sm)',
        }}
>
        {!user.isAdmin && (
<div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>
            {b.parking_nome}
</div>
        )}
 
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
<span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>
            Posto #{b.spot_label}
</span>
          {canDelete && confirmId !== b.id && (
<button
              onClick={() => setConfirmId(b.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '15px', padding: '2px' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
>🗑</button>
          )}
</div>
 
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
<span style={{
            fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
            background: `${tc}15`, color: tc, border: `1px solid ${tc}30`, textTransform: 'capitalize',
          }}>
            {b.spot_type}
</span>
          {b.durata_ore && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{b.durata_ore}h</span>}
          {b.costo_totale != null && (
<span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', fontFamily: 'DM Mono, monospace' }}>
              {b.costo_totale}€
</span>
          )}
<span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            {new Date(b.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
</span>
</div>
 
        {nomeUtente && (
<div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>👤 {nomeUtente}</div>
        )}
 
        {b.data_inizio && b.durata_ore && (
<BookingTimer booking={b} onExpired={handleExpired} />
        )}
 
        {confirmId === b.id && (
<div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
<button
              disabled={deletingId === b.id}
              onClick={() => handleDelete(b)}
              style={{
                flex: 1, fontSize: '11px', fontWeight: 700, padding: '7px 0',
                borderRadius: '8px', border: '1px solid rgba(220,38,38,0.3)',
                background: 'rgba(220,38,38,0.06)', color: '#dc2626', cursor: 'pointer',
                opacity: deletingId === b.id ? 0.6 : 1,
              }}
>
              {deletingId === b.id ? '…' : 'Sì, elimina'}
</button>
<button
              onClick={() => setConfirmId(null)}
              style={{
                flex: 1, fontSize: '11px', padding: '7px 0', borderRadius: '8px',
                border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
>No</button>
</div>
        )}
</div>
    )
  }
 
  return (
<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {error && (
<div style={{
          padding: '9px 12px', background: 'rgba(220,38,38,0.06)',
          border: '1px solid rgba(220,38,38,0.25)', borderRadius: '8px',
          fontSize: '12px', color: '#dc2626', marginBottom: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
<span>⚠️ {error}</span>
<button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px' }}>✕</button>
</div>
      )}
 
      {Object.entries(grouped).map(([nome, items]) => (
<div key={nome}>
          {user.isAdmin && (
<button
              onClick={() => toggleGroup(nome)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '7px 10px',
                marginBottom: collapsedGroups[nome] ? '0' : '6px',
                cursor: 'pointer',
              }}
>
<span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                🅿️ {nome}
</span>
<span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
<span style={{
                  fontSize: '10px', fontWeight: 700, color: '#10b981',
                  background: 'rgba(16,185,129,0.1)', borderRadius: '999px', padding: '1px 7px',
                }}>
                  {items.length}
</span>
<span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {collapsedGroups[nome] ? '▶' : '▼'}
</span>
</span>
</button>
          )}
 
          {!collapsedGroups[nome] && (
<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map((b) => renderCard(b))}
</div>
          )}
</div>
      ))}
</div>
  )
}
