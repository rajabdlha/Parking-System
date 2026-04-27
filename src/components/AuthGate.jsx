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
      email: email,
      password: password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          role: 'user',
        }
      }
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
    if (tab === 'login') {
      await handleLogin()
    } else {
      await handleRegister()
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: '#1c1c22', border: '1px solid #2a2a32',
    borderRadius: '10px', color: '#e8e8ea',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }

  const tabActiveStyle = {
    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    background: '#10b981', color: '#fff',
  }

  const tabInactiveStyle = {
    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    background: 'transparent', color: '#6b7280',
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#0f0f11',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: '#10b981', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
          </svg>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#e8e8ea', marginBottom: '6px' }}>
          Brescia Parking
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          Prenota il tuo posto in città
        </p>
      </div>

      <div style={{
        width: '100%', maxWidth: '400px', background: '#16161a',
        border: '1px solid #2a2a32', borderRadius: '20px',
        padding: '28px', boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'flex', background: '#1c1c22', borderRadius: '10px',
          padding: '4px', marginBottom: '24px', gap: '4px',
        }}>
          <button type="button" onClick={() => switchTab('login')} style={tab === 'login' ? tabActiveStyle : tabInactiveStyle}>
            Accedi
          </button>
          <button type="button" onClick={() => switchTab('register')} style={tab === 'register' ? tabActiveStyle : tabInactiveStyle}>
            Registrati
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: '#1a0808',
            border: '1px solid #ef4444', borderRadius: '10px',
            fontSize: '13px', color: '#f87171', marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '10px 14px', background: '#081a12',
            border: '1px solid #10b981', borderRadius: '10px',
            fontSize: '13px', color: '#10b981', marginBottom: '16px',
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tab === 'register' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                  Nome
                </label>
                <input
                  type="text"
                  placeholder="Mario"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                  Cognome
                </label>
                <input
                  type="text"
                  placeholder="Rossi"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="mario@esempio.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '6px', padding: '13px', background: '#10b981',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontSize: '14px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Attendi...' : tab === 'login' ? 'Accedi' : 'Crea account'}
          </button>
        </form>
      </div>
    </div>
  )
}
