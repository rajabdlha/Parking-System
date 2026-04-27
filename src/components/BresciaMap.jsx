import { useEffect, useRef, useState } from 'react'
import { bresciaParking } from '../lib/bresciaParking'

function getColor(posti) {
  if (posti >= 1000) return '#ef4444'
  if (posti >= 400)  return '#f59e0b'
  if (posti >= 150)  return '#10b981'
  return '#60a5fa'
}

function getRadius(posti) {
  if (posti >= 1000) return 18
  if (posti >= 400)  return 14
  if (posti >= 150)  return 10
  return 7
}

export default function BresciaMap({ onParkingClick }) {
  const mapRef      = useRef(null)
  const instanceRef = useRef(null)
  const [showPanel, setShowPanel] = useState(false)
  const [query,     setQuery]     = useState('')

  const filtered = bresciaParking.filter(p =>
    p.nome.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    // Se la mappa esiste già, la distruggiamo prima di ricrearla
    if (instanceRef.current) {
      instanceRef.current.remove()
      instanceRef.current = null
    }

    let cancelled = false

    import('leaflet').then(L => {
      if (cancelled || !mapRef.current) return

      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        center: [45.5415, 10.2118],
        zoom: 13,
        zoomControl: true,
      })

      instanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      bresciaParking.forEach(p => {
        const circle = L.circleMarker([p.lat, p.lng], {
          radius:      getRadius(p.posti),
          fillColor:   getColor(p.posti),
          fillOpacity: 0.85,
          color:       getColor(p.posti),
          weight:      2,
        }).addTo(map)

        circle.bindTooltip(`
          <div style="font-family: DM Sans, sans-serif; min-width: 140px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${p.nome}</div>
            <div style="font-size: 12px; color: #555;">
              🅿️ ${p.posti.toLocaleString('it-IT')} posti
              <span style="color: #10b981; font-weight: 600;"> · Clicca per prenotare</span>
            </div>
          </div>
        `, { direction: 'top', offset: [0, -8] })

        circle.on('click',     () => onParkingClick(p))
        circle.on('mouseover', () => circle.setStyle({ fillOpacity: 1, weight: 3 }))
        circle.on('mouseout',  () => circle.setStyle({ fillOpacity: 0.85, weight: 2 }))
      })
    })

    return () => {
      cancelled = true
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 56px)', width: '100%' }}>

      {/* BADGE INFO + BOTTONE LISTA */}
      <div style={{
        position: 'absolute', top: '16px', left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: '8px',
        whiteSpace: 'nowrap',
      }}>
        <div style={{
          background: 'rgba(22,22,26,0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #2a2a32',
          borderRadius: '12px',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8e8ea' }}>
            🗺️ {bresciaParking.length} parcheggi · {bresciaParking.reduce((a, p) => a + p.posti, 0).toLocaleString('it-IT')} posti
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { color: '#60a5fa', label: '< 150' },
              { color: '#10b981', label: '150–399' },
              { color: '#f59e0b', label: '400–999' },
              { color: '#ef4444', label: '1000+' },
            ].map(({ color, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setShowPanel(p => !p); setQuery('') }}
          style={{
            background: showPanel ? '#10b981' : 'rgba(22,22,26,0.92)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${showPanel ? '#10b981' : '#2a2a32'}`,
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer',
            color: showPanel ? '#fff' : '#e8e8ea',
            fontSize: '13px', fontWeight: 600,
            transition: 'all 150ms',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Lista parcheggi
        </button>
      </div>

      {/* PANNELLO LISTA + RICERCA */}
      {showPanel && (
        <div style={{
          position: 'absolute', top: '68px', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(22,22,26,0.97)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #2a2a32',
          borderRadius: '16px',
          width: '340px',
          maxHeight: '420px',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #2a2a32' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#1c1c22', border: '1px solid #2a2a32',
              borderRadius: '10px', padding: '8px 12px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cerca parcheggio…"
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#e8e8ea', fontSize: '13px', width: '100%',
                }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>✕</button>
              )}
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#4a4a55', fontSize: '13px' }}>
                Nessun parcheggio trovato
              </div>
            ) : (
              filtered
                .sort((a, b) => b.posti - a.posti)
                .map((p, i) => (
                  <button
                    key={p.nome}
                    onClick={() => { setShowPanel(false); onParkingClick(p) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 16px',
                      background: 'transparent', border: 'none',
                      borderBottom: i < filtered.length - 1 ? '1px solid #1c1c22' : 'none',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 120ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1c1c22'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: getColor(p.posti), display: 'inline-block', flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8e8ea' }}>{p.nome}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'DM Mono, monospace' }}>
                        {p.posti.toLocaleString('it-IT')} posti
                      </span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a4a55" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </button>
                ))
            )}
          </div>

          <div style={{
            padding: '8px 16px', borderTop: '1px solid #2a2a32',
            fontSize: '11px', color: '#4a4a55', textAlign: 'center',
          }}>
            {filtered.length} parcheggi trovati
          </div>
        </div>
      )}

      {/* Mappa */}
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
