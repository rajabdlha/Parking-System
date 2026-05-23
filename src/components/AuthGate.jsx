import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthGate({ onLogin }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  function switchTab(t) {
    setTab(t)
    setError(null)
    setSuccess(null)
  }

  async function handleLogin() {
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }
    const u = result.data.user
    const role = u.user_metadata?.role || 'user'
    onLogin({ id: u.id, email: u.email, role })
    setLoading(false)
  }

  async function handleRegister() {
    const fullName = firstName.trim() + ' ' + lastName.trim()
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          role: 'user',
        },
      },
    })
    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }
    setSuccess('Registrazione completata! Ora accedi.')
    setTab('login')
    setPassword('')
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    if (tab === 'login') await handleLogin()
    else await handleRegister()
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: 'var(--input-bg)',
    border: '1.5px solid var(--border)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 150ms',
  }

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '6px',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Brand */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '15px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 6px 20px rgba(16,185,129,0.35)',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
          </svg>
        </div>
        <h1 style={{
          fontSize: '22px', fontWeight: 800,
          color: 'var(--text-primary)', marginBottom: '5px', letterSpacing: '-0.02em',
        }}>
          Brescia Parking
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Prenota il tuo posto in città
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '28px',
        boxSizing: 'border-box',
        boxShadow: 'var(--shadow-md)',
      }}>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-tertiary)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '22px',
          gap: '4px',
        }}>
          {['login', 'register'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              style={{
                flex: 1, padding: '8px', borderRadius: '7px', border: 'none',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 150ms',
                background: tab === t ? '#10b981' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-secondary)',
                boxShadow: tab === t ? '0 1px 6px rgba(16,185,129,0.4)' : 'none',
              }}
            >
              {t === 'login' ? 'Accedi' : 'Registrati'}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px',
            fontSize: '13px', color: '#dc2626', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '10px',
            fontSize: '13px', color: '#059669', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span>✅</span> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {tab === 'register' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Nome</label>
                <input
                  type="text" placeholder="Mario"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  required style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Cognome</label>
                <input
                  type="text" placeholder="Rossi"
                  value={lastName} onChange={(e) => setLastName(e.target.value)}
                  required style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email" placeholder="mario@esempio.it"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={6} style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              padding: '13px',
              background: loading ? 'var(--bg-tertiary)' : '#10b981',
              border: 'none',
              borderRadius: '10px',
              color: loading ? 'var(--text-muted)' : '#fff',
              fontSize: '14px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 150ms',
              boxShadow: loading ? 'none' : '0 2px 10px rgba(16,185,129,0.35)',
            }}
          >
            {loading ? 'Attendi…' : tab === 'login' ? 'Accedi' : 'Crea account'}
          </button>
        </form>
      </div>
    </div>
  )
}
