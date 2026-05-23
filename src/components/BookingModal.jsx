import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORY = {
  auto:     { label: 'Auto',     color: '#3b82f6' },
  moto:     { label: 'Moto',     color: '#f59e0b' },
  disabile: { label: 'Disabili', color: '#7c3aed' },
}

function calcolaCosto(dataOraStr, ore) {
  if (!dataOraStr || !ore) return 0
  const inizio = new Date(dataOraStr.replace('T', ' '))
  if (isNaN(inizio.getTime())) return 0
  let totale = 0
  for (let i = 0; i < ore; i++) {
    const h = (inizio.getHours() + i) % 24
    totale += (h >= 6 && h < 22) ? 3 : 1
  }
  return totale
}

function getNow() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export default function BookingModal({ spot, parking, user, balance, onClose, onBooked }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dataOra, setDataOra] = useState(getNow)
  const [durata, setDurata] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data?.user?.user_metadata || {}
      setFirstName(meta.first_name || '')
      setLastName(meta.last_name || '')
    })
  }, [])

  const fullName = `${firstName} ${lastName}`.trim() || user?.email || ''
  const cat = CATEGORY[spot.type]
  const costo = useMemo(() => calcolaCosto(dataOra, durata), [dataOra, durata])
  const isAdmin = user?.role === 'admin' || user?.isAdmin

  async function handleConfirm() {
    if (!dataOra) { setError('Inserisci data e ora di inizio.'); return }
    if (durata < 1) { setError('Durata minima 1 ora.'); return }
    if (costo === 0) { setError('Impossibile calcolare il costo. Controlla la data.'); return }

    if (!isAdmin) {
      if (balance == null || balance < costo) {
        setError(`Saldo insufficiente. Hai ${balance ?? 0}€, servono ${costo}€.`)
        return
      }
    }

    setLoading(true)
    setError(null)

    const { error: err } = await supabase.from('brescia_bookings').insert({
      user_id:      user.id,
      user_email:   user.email,
      first_name:   firstName,
      last_name:    lastName,
      full_name:    fullName,
      parking_nome: parking.nome,
      spot_label:   spot.label,
      spot_type:    spot.type,
      nome_utente:  fullName,
      data_inizio:  dataOra,
      durata_ore:   durata,
      costo_totale: costo,
    })

    if (err) { setError(err.message); setLoading(false); return }

    let newBalance = balance
    if (!isAdmin) {
      const { error: walletErr } = await supabase
        .from('profiles')
        .update({ wallet_balance: balance - costo })
        .eq('id', user.id)

      if (walletErr) {
        console.error('Errore aggiornamento wallet:', walletErr.message)
      } else {
        newBalance = balance - costo
      }
    }

    onBooked(newBalance)
  }

  const inputStyle = {
    width: '100%', padding: '10px 13px',
    background: 'var(--input-bg)',
    border: '1.5px solid var(--border)',
    borderRadius: '9px',
    color: 'var(--text-primary)',
    fontSize: '14px', boxSizing: 'border-box', outline: 'none',
    colorScheme: 'inherit',
    transition: 'border-color 150ms',
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'block', marginBottom: '5px',
    textTransform: 'uppercase', letterSpacing: '.06em',
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '20px', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '14px',
        boxShadow: 'var(--shadow-lg)',
      }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
            Conferma prenotazione
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: '12px', padding: '14px 16px',
          display: 'flex', gap: '0',
        }}>
          {[
            { label: 'Parcheggio', value: parking.nome, color: 'var(--text-primary)' },
            { label: 'Posto', value: `#${spot.label}`, color: '#10b981', mono: true },
            { label: 'Tipo', value: cat.label, color: cat.color },
          ].map(({ label, value, color, mono }, i, arr) => (
            <div key={label} style={{
              flex: 1, textAlign: 'center',
              borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              padding: '0 8px',
            }}>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                {label}
              </div>
              <div style={{
                fontSize: '13px', fontWeight: 700, color, marginTop: '3px',
                fontFamily: mono ? 'DM Mono, monospace' : 'inherit',
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: '10px', padding: '11px 14px',
        }}>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '4px' }}>
            Intestato a
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{fullName}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>{user?.email}</div>
        </div>

        <div>
          <label style={labelStyle}>Data e ora di inizio</label>
          <div style={{ position: 'relative' }}>
            <input
              type="datetime-local"
              value={dataOra}
              onChange={(e) => setDataOra(e.target.value)}
              style={{
                ...inputStyle,
                colorScheme: 'light dark',
                paddingRight: '38px',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <span
              onClick={() => document.querySelector('input[type="datetime-local"]')?.showPicker?.()}
              style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px', cursor: 'pointer',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              📅
            </span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Durata</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setDurata((d) => Math.max(1, d - 1))}
              style={{
                width: 36, height: 36, borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                border: '1.5px solid var(--border)',
                color: 'var(--text-primary)', fontSize: '18px', cursor: 'pointer',
              }}
            >−</button>
            <span style={{
              fontSize: '20px', fontWeight: 800,
              color: 'var(--text-primary)',
              minWidth: '32px', textAlign: 'center',
              fontFamily: 'DM Mono, monospace',
            }}>
              {durata}
            </span>
            <button
              onClick={() => setDurata((d) => Math.min(24, d + 1))}
              style={{
                width: 36, height: 36, borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                border: '1.5px solid var(--border)',
                color: 'var(--text-primary)', fontSize: '18px', cursor: 'pointer',
              }}
            >+</button>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {durata === 1 ? '1 ora' : `${durata} ore`}
            </span>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: '10px', padding: '12px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div>🌞 06:00–22:00 → <strong style={{ color: '#f59e0b' }}>3€/ora</strong></div>
            <div>🌙 22:00–06:00 → <strong style={{ color: '#3b82f6' }}>1€/ora</strong></div>
            {!isAdmin && balance != null && (
              <div style={{
                marginTop: '6px', fontSize: '11px', fontWeight: 700,
                color: balance >= costo ? '#10b981' : '#ef4444',
              }}>
                💳 Saldo: {balance}€{costo > 0 && balance < costo ? ' — insufficiente' : ''}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Totale stimato</div>
            <div style={{
              fontSize: '26px', fontWeight: 800,
              color: '#10b981',
              fontFamily: 'DM Mono, monospace', lineHeight: 1,
            }}>
              {costo > 0 ? `${costo}€` : '—'}
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            color: '#dc2626', padding: '9px 12px',
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: '8px', fontSize: '12px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px',
              background: 'var(--bg-tertiary)',
              border: '1.5px solid var(--border)',
              borderRadius: '9px',
              color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              transition: 'all 150ms',
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (!isAdmin && costo > 0 && balance != null && balance < costo)}
            style={{
              flex: 2, padding: '11px',
              background: loading ? 'var(--bg-tertiary)' : '#10b981',
              border: 'none',
              borderRadius: '9px',
              color: loading ? 'var(--text-muted)' : '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 700,
              boxShadow: loading ? 'none' : '0 2px 10px rgba(16,185,129,0.35)',
              transition: 'all 150ms',
            }}
          >
            {loading ? '…' : `Prenota${costo > 0 ? ` · ${costo}€` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
