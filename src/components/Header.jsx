import { useState } from 'react'

export default function Header({ user, onLogout, children }) {
  return (
    <header style={{
      height: '56px',
      background: '#16161a',
      borderBottom: '1px solid #2a2a32',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: '12px',
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M7 15V9h4a3 3 0 0 1 0 6H7" />
        </svg>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#e8e8ea', letterSpacing: '-0.02em' }}>
          ParkManager
        </span>
      </div>

      {/* Bottone Admin (iniettato da App.jsx) */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {children}

        {/* Info utente */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '4px' }}>
          <span style={{ fontSize: '12px', color: '#e8e8ea', fontWeight: 700 }}>
            {user.email}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: user.isAdmin ? '#a78bfa' : '#6b7280' }}>
            {user.isAdmin ? '⚙️ Admin' : '👤 Utente'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            background: 'transparent',
            border: '1px solid #2a2a32',
            color: '#6b7280',
            padding: '8px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ef4444'
            e.currentTarget.style.color = '#ef4444'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2a2a32'
            e.currentTarget.style.color = '#6b7280'
          }}
        >
          Esci
        </button>
      </div>
    </header>
  )
}
