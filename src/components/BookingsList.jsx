import { useState } from 'react'
import { supabase } from '../lib/supabase'

const typeColor = { auto: '#60a5fa', moto: '#f59e0b', disabile: '#a78bfa' }

export default function BookingsList({ bookings = [], user, onDelete }) {
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId,  setConfirmId]  = useState(null)
  const [error,      setError]      = useState(null)

  async function handleDelete(booking) {
    setDeletingId(booking.id)
    setError(null)

    const { error: delErr } = await supabase
      .from('brescia_bookings')
      .delete()
      .eq('id', booking.id)

    if (delErr) {
      setError('Errore: ' + delErr.message)
      setDeletingId(null)
      setConfirmId(null)
      return
    }

    onDelete?.(booking)
    setDeletingId(null)
    setConfirmId(null)
  }

  function getNomeUtente(b) {
    if (b.first_name || b.last_name) {
      return `${b.first_name || ''} ${b.last_name || ''}`.trim()
    }
    if (b.full_name) return b.full_name
    if (b.nome_utente) return b.nome_utente
    return null
  }

  if (!user) return (
    <p style={{ fontSize: '12px', color: '#4a4a55', textAlign: 'center', padding: '24px 0' }}>
      Accedi per vedere le prenotazioni.
    </p>
  )

  if (bookings.length === 0) return (
    <p style={{ fontSize: '12px', color: '#4a4a55', textAlign: 'center', padding: '24px 0' }}>
      Nessuna prenotazione.
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {error && (
        <div style={{
          padding: '8px 10px', background: '#2d0d0d',
          border: '1px solid #7f1d1d', borderRadius: '8px',
          fontSize: '12px', color: '#fca5a5', marginBottom: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          ⚠️ {error}
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
          >✕</button>
        </div>
      )}

      {bookings.map((b) => {
        const tc = typeColor[b.spot_type] ?? '#6b7280'
        const canDelete = user.role === 'admin' || b.user_id === user.id
        const nomeUtente = getNomeUtente(b)

        return (
          <div key={b.id} style={{
            background: '#1c1c22', border: '1px solid #2a2a32',
            borderRadius: '12px', padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}>
            <div style={{ fontSize: '10px', color: '#4a4a55', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {b.parking_nome}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#e8e8ea', fontFamily: 'DM Mono, monospace' }}>
                Posto #{b.spot_label}
              </span>
              {canDelete && confirmId !== b.id && (
                <button
                  onClick={() => setConfirmId(b.id)}
                  style={{ background: 'transparent', border: 'none', color: '#4a4a55', cursor: 'pointer', fontSize: '15px', transition: 'color 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a4a55'}
                >🗑</button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                borderRadius: '999px', background: `${tc}18`, color: tc, textTransform: 'capitalize',
              }}>
                {b.spot_type}
              </span>
              {b.durata_ore && (
                <span style={{ fontSize: '10px', color: '#6b7280' }}>{b.durata_ore}h</span>
              )}
              {b.costo_totale != null && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', fontFamily: 'DM Mono, monospace' }}>
                  {b.costo_totale}€
                </span>
              )}
              <span style={{ fontSize: '10px', color: '#4a4a55', fontFamily: 'DM Mono, monospace' }}>
                {new Date(b.created_at).toLocaleString('it-IT', {
                  day: '2-digit', month: '2-digit', year: '2-digit',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>

            {nomeUtente && (
              <div style={{ fontSize: '11px', color: '#6b7280' }}>👤 {nomeUtente}</div>
            )}

            {user.role === 'admin' && (
              <div style={{ fontSize: '10px', color: '#4a4a55' }}>
                user: {b.user_id?.slice(0, 8)}…
              </div>
            )}

            {confirmId === b.id && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  disabled={deletingId === b.id}
                  onClick={() => handleDelete(b)}
                  style={{
                    flex: 1, fontSize: '11px', fontWeight: 600, padding: '6px 0',
                    borderRadius: '8px', border: '1px solid #7f1d1d',
                    background: '#2d0d0d', color: '#ef4444', cursor: 'pointer',
                  }}
                >
                  {deletingId === b.id ? '…' : 'Sì, elimina'}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  style={{
                    flex: 1, fontSize: '11px', padding: '6px 0',
                    borderRadius: '8px', border: '1px solid #2a2a32',
                    background: '#1c1c22', color: '#6b7280', cursor: 'pointer',
                  }}
                >
                  No
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
