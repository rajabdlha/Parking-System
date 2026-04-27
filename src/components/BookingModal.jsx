import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase'


const CATEGORY = {
  auto:     { label: 'Auto',     color: '#60a5fa' },
  moto:     { label: 'Moto',     color: '#f59e0b' },
  disabile: { label: 'Disabili', color: '#a78bfa' },
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

export default function BookingModal({ spot, parking, user, onClose, onBooked }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [dataOra, setDataOra] = useState(getNow)
  const [durata,  setDurata]  = useState(1)
  const [firstName, setFirstNameState] = useState('')
  const [lastName,  setLastNameState]  = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data?.user?.user_metadata || {}
      setFirstNameState(meta.first_name || '')
      setLastNameState(meta.last_name || '')
    })
  }, [])

  const fullName = `${firstName} ${lastName}`.trim() || user?.email || ''

  const cat   = CATEGORY[spot.type]
  const costo = useMemo(() => calcolaCosto(dataOra, durata), [dataOra, durata])

  async function handleConfirm() {
    if (!dataOra) { setError('Inserisci data e ora di inizio.'); return }
    if (durata < 1) { setError('Durata minima 1 ora.'); return }

    setLoading(true)
    setError(null)

    const { error: err } = await supabase
      .from('brescia_bookings')
      .insert({
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


    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    onBooked()
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: '#1c1c22', border: '1px solid #2a2a32',
    borderRadius: 8, color: '#e8e8ea', fontSize: '14px',
    boxSizing: 'border-box', outline: 'none',
  }

  const labelStyle = {
    fontSize: '11px', color: '#6b7280',
    display: 'block', marginBottom: 4,
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#16161a', border: '1px solid #2a2a32',
        borderRadius: '16px', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <h3 style={{ color: '#e8e8ea', fontSize: '18px', margin: 0 }}>
          Conferma prenotazione
        </h3>

        {/* Riepilogo posto */}
        <div style={{
          background: '#1c1c22', border: '1px solid #2a2a32',
          borderRadius: '12px', padding: '12px 16px',
          display: 'flex', gap: '16px',
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#4a4a55', textTransform: 'uppercase', letterSpacing: '.08em' }}>Parcheggio</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8e8ea', marginTop: 2 }}>{parking.nome}</div>
          </div>
          <div style={{ width: '1px', background: '#2a2a32' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#4a4a55', textTransform: 'uppercase', letterSpacing: '.08em' }}>Posto</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>#{spot.label}</div>
          </div>
          <div style={{ width: '1px', background: '#2a2a32' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#4a4a55', textTransform: 'uppercase', letterSpacing: '.08em' }}>Tipo</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: cat.color, marginTop: 2 }}>{cat.label}</div>
          </div>
        </div>

        {/* Nome utente — solo visualizzazione */}
        <div style={{
          background: '#1c1c22', border: '1px solid #2a2a32',
          borderRadius: '10px', padding: '10px 14px',
        }}>
          <div style={{ fontSize: '10px', color: '#4a4a55', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
            Intestato a
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#e8e8ea' }}>
            {fullName}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 2 }}>
            {user?.email}
          </div>
        </div>

        {/* Data e ora */}
        <div>
          <label style={labelStyle}>Data e ora di inizio</label>
          <input
            type="datetime-local"
            value={dataOra}
            onChange={e => setDataOra(e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>

        {/* Durata */}
        <div>
          <label style={labelStyle}>Durata (ore)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setDurata(d => Math.max(1, d - 1))}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: '#1c1c22', border: '1px solid #2a2a32',
                color: '#e8e8ea', fontSize: '18px', cursor: 'pointer',
              }}
            >−</button>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#e8e8ea', minWidth: '32px', textAlign: 'center' }}>
              {durata}
            </span>
            <button
              onClick={() => setDurata(d => Math.min(24, d + 1))}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: '#1c1c22', border: '1px solid #2a2a32',
                color: '#e8e8ea', fontSize: '18px', cursor: 'pointer',
              }}
            >+</button>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {durata === 1 ? '1 ora' : `${durata} ore`}
            </span>
          </div>
        </div>

        {/* Tariffe e costo */}
        <div style={{
          background: '#1c1c22', border: '1px solid #2a2a32',
          borderRadius: '10px', padding: '10px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            <div>🌞 06:00–22:00 → <strong style={{ color: '#f59e0b' }}>3€/ora</strong></div>
            <div>🌙 22:00–06:00 → <strong style={{ color: '#60a5fa' }}>1€/ora</strong></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Totale stimato</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#10b981', fontFamily: 'DM Mono, monospace' }}>
              {costo > 0 ? `${costo}€` : '—'}
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            color: '#fca5a5', padding: '8px 10px',
            background: '#2d0d0d', border: '1px solid #7f1d1d',
            borderRadius: 8, fontSize: '12px',
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px',
              background: '#1c1c22', border: '1px solid #2a2a32',
              borderRadius: 8, color: '#6b7280', cursor: 'pointer', fontSize: '13px',
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '10px',
              background: '#10b981', border: 'none',
              borderRadius: 8, color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 700,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '…' : `Prenota${costo > 0 ? ` · ${costo}€` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
