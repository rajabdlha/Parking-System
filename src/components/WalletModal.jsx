import { useState } from 'react'
import { supabase } from '../lib/supabase'

const PRESETS = [10, 20, 50, 100]

export default function WalletModal({ user, balance, onClose, onTopUp }) {
  const [selected, setSelected] = useState(20)
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const amount = custom !== '' ? parseFloat(custom) : selected

  async function handleTopUp() {
    if (!amount || amount <= 0 || amount > 500) {
      setError('Importo non valido (max 500€)')
      return
    }
    setLoading(true)
    setError(null)

    const newBalance = Math.round((balance + amount) * 100) / 100

    const { error: err } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', user.id)

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      onTopUp(newBalance)
      onClose()
    }, 1200)
    setLoading(false)
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '380px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '28px',
        display: 'flex', flexDirection: 'column', gap: '20px',
        boxShadow: 'var(--shadow-lg)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 42, height: 42, borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              fontSize: '20px',
            }}>
              💳
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Il tuo portafoglio
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                Ricarica il saldo
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Saldo attuale */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Saldo disponibile
            </div>
            <div style={{
              fontSize: '36px', fontWeight: 900, color: '#10b981',
              fontFamily: 'DM Mono, monospace', lineHeight: 1, marginTop: '4px',
            }}>
              {balance.toFixed(2)}€
            </div>
          </div>
          <div style={{
            width: 52, height: 52,
            background: 'rgba(16,185,129,0.15)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
          }}>
            🪙
          </div>
        </div>

        {/* Importi predefiniti */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px' }}>
            Importo rapido
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {PRESETS.map((p) => {
              const isActive = custom === '' && selected === p
              return (
                <button
                  key={p}
                  onClick={() => { setSelected(p); setCustom('') }}
                  style={{
                    padding: '10px 0',
                    borderRadius: '10px',
                    border: `2px solid ${isActive ? '#10b981' : 'var(--border)'}`,
                    background: isActive ? 'rgba(16,185,129,0.12)' : 'var(--bg-tertiary)',
                    color: isActive ? '#10b981' : 'var(--text-primary)',
                    fontSize: '15px', fontWeight: 800,
                    fontFamily: 'DM Mono, monospace',
                    cursor: 'pointer',
                    transition: 'all 120ms',
                  }}
                >
                  {p}€
                </button>
              )
            })}
          </div>
        </div>

        {/* Importo personalizzato */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
            Oppure importo personalizzato
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--input-bg)',
            border: `1.5px solid ${custom !== '' ? '#10b981' : 'var(--border)'}`,
            borderRadius: '10px', padding: '10px 14px', gap: '8px',
            transition: 'border-color 150ms',
          }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-muted)' }}>€</span>
            <input
              type="number"
              min="1" max="500"
              placeholder="es. 35"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700,
                fontFamily: 'DM Mono, monospace', width: '100%',
              }}
            />
          </div>
        </div>

        {/* Preview */}
        {amount > 0 && !isNaN(amount) && (
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Saldo dopo la ricarica
            </span>
            <span style={{
              fontSize: '18px', fontWeight: 800, color: '#10b981',
              fontFamily: 'DM Mono, monospace',
            }}>
              {(balance + amount).toFixed(2)}€
            </span>
          </div>
        )}

        

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

        {/* CTA */}
        <button
          onClick={handleTopUp}
          disabled={loading || success || !amount || isNaN(amount) || amount <= 0}
          style={{
            padding: '14px',
            background: success ? 'rgba(16,185,129,0.15)' : (loading || !amount || isNaN(amount) || amount <= 0) ? 'var(--bg-tertiary)' : '#10b981',
            border: success ? '1px solid rgba(16,185,129,0.4)' : 'none',
            borderRadius: '12px',
            color: success ? '#10b981' : (loading || !amount || isNaN(amount) || amount <= 0) ? 'var(--text-muted)' : '#fff',
            fontSize: '14px', fontWeight: 700,
            cursor: (loading || success || !amount || isNaN(amount) || amount <= 0) ? 'not-allowed' : 'pointer',
            transition: 'all 150ms',
            boxShadow: (!loading && !success && amount > 0 && !isNaN(amount)) ? '0 4px 16px rgba(16,185,129,0.35)' : 'none',
          }}
        >
          {success ? '✅ Ricarica effettuata!' : loading ? 'Elaborazione…' : `Ricarica ${amount > 0 && !isNaN(amount) ? `${amount}€` : ''}`}
        </button>
      </div>
    </div>
  )
}
