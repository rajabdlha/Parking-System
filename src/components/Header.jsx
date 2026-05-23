import { useTheme } from '../lib/ThemeContext'

export default function Header({ user, balance, onLogout, onWalletClick, onLogoClick, children }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const isLow = balance !== null && balance < 5

  return (
    <header style={{
      height: '56px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: '12px',
      boxShadow: 'var(--shadow-sm)',
    }}>

      {/* Logo — cliccabile per tornare alla mappa */}
      <button
        onClick={onLogoClick}
        title="Torna alla mappa"
        style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          background: 'none', border: 'none', padding: '4px 6px 4px 0',
          borderRadius: '10px', cursor: 'pointer',
          transition: 'opacity 150ms',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.75'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '9px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
          flexShrink: 0,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <rect x="2" y="5" width="20" height="14" rx="3" />
            <path d="M7 15V9h4a3 3 0 0 1 0 6H7" />
          </svg>
        </div>
        <span style={{
          fontSize: '15px', fontWeight: 700,
          color: 'var(--text-primary)', letterSpacing: '-0.02em',
        }}>
          ParkManager
        </span>
      </button>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {children}

        {/* Wallet chip */}
        {balance !== null && (
          <button
            onClick={onWalletClick}
            title={isLow ? 'Saldo basso — clicca per ricaricare' : 'Il tuo portafoglio'}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              border: `1.5px solid ${isLow ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.4)'}`,
              background: isLow ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.08)',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)'
              e.currentTarget.style.boxShadow = isLow
                ? '0 0 0 3px rgba(239,68,68,0.15)'
                : '0 0 0 3px rgba(16,185,129,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <span style={{ fontSize: '13px' }}>{isLow ? '⚠️' : '💳'}</span>
            <span style={{
              fontSize: '13px', fontWeight: 800,
              fontFamily: 'DM Mono, monospace',
              color: isLow ? '#ef4444' : '#10b981',
            }}>
              {balance.toFixed(2)}€
            </span>
          </button>
        )}

        {/* Theme toggle — pill style */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={isDark ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}
          style={{
            position: 'relative',
            width: 52, height: 28,
            borderRadius: '999px',
            background: isDark ? '#2a2a32' : '#e2e5ea',
            border: '1.5px solid var(--border)',
            cursor: 'pointer',
            transition: 'background 200ms',
            flexShrink: 0,
            padding: 0,
          }}
        >
          {/* knob */}
          <span style={{
            position: 'absolute',
            top: '50%',
            left: isDark ? 'calc(100% - 22px)' : '3px',
            transform: 'translateY(-50%)',
            width: 20, height: 20,
            borderRadius: '50%',
            background: isDark ? '#10b981' : '#fff',
            boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.2)',
            transition: 'left 200ms, background 200ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px',
          }}>
            {isDark ? '🌙' : '☀️'}
          </span>
        </button>

        {/* User info */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          marginRight: '2px',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.2 }}>
            {user.email}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 600, lineHeight: 1.2,
            color: user.isAdmin ? '#7c3aed' : 'var(--text-muted)',
          }}>
            {user.isAdmin ? '⚙️ Admin' : '👤 Utente'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            padding: '7px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ef4444'
            e.currentTarget.style.color = '#ef4444'
            e.currentTarget.style.background = 'rgba(239,68,68,0.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-secondary)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          Esci
        </button>
      </div>
    </header>
  )
}
