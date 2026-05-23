import { useEffect, useRef, useState, useCallback } from 'react'
import { bresciaParking } from '../lib/bresciaParking'
import { useTheme } from '../lib/ThemeContext'

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

// Haversine distance in km
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDist(km) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

export default function BresciaMap({ onParkingClick }) {
  const mapRef        = useRef(null)
  const instanceRef   = useRef(null)
  const userMarkerRef = useRef(null)
  const tileLayerRef  = useRef(null)
  const [showPanel, setShowPanel] = useState(false)
  const [query,     setQuery]     = useState('')
  const [userPos,   setUserPos]   = useState(null)      // { lat, lng }
  const [addrInput, setAddrInput] = useState('')
  const [addrLoading, setAddrLoading] = useState(false)
  const [addrError,   setAddrError]   = useState(null)
  const [gpsLoading,  setGpsLoading]  = useState(false)
  const [pickMode,    setPickMode]    = useState(false)  // click-on-map mode
  const [mapType,     setMapType]     = useState('streets') // 'streets' | 'satellite'
  const [coverFilter, setCoverFilter] = useState('all')     // 'all' | 'coperto' | 'scoperto'
  const [weather,     setWeather]     = useState(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const panelBg     = isDark ? 'rgba(22,22,26,0.96)'  : 'rgba(255,255,255,0.97)'
  const panelBorder = isDark ? '#2a2a32'               : '#e2e5ea'
  const inputBg     = isDark ? '#1c1c22'               : '#f7f8fa'
  const inputBorder = isDark ? '#2a2a32'               : '#e2e5ea'
  const textPrimary = isDark ? '#e8e8ea'               : '#111318'
  const textSecond  = isDark ? '#6b7280'               : '#5a6172'
  const textMuted   = isDark ? '#4a4a55'               : '#9aa0ae'
  const rowHover    = isDark ? '#1c1c22'               : '#f7f8fa'
  const rowDivider  = isDark ? '#1c1c22'               : '#f0f2f5'
  const shadow      = isDark
    ? '0 12px 40px rgba(0,0,0,0.55)'
    : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)'

  // Aggiorna/rimuove marker utente sulla mappa
  const updateUserMarker = useCallback((pos) => {
    import('leaflet').then(L => {
      if (!instanceRef.current) return
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }
      if (!pos) return
      const icon = L.divIcon({
        html: `<div style="
          width:16px;height:16px;border-radius:50%;
          background:#3b82f6;border:3px solid #fff;
          box-shadow:0 0 0 3px rgba(59,130,246,0.4);
        "></div>`,
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      userMarkerRef.current = L.marker([pos.lat, pos.lng], { icon })
        .addTo(instanceRef.current)
        .bindTooltip('📍 La tua posizione', { direction: 'top', offset: [0, -10] })
      instanceRef.current.setView([pos.lat, pos.lng], 14, { animate: true })
    })
  }, [])

  // GPS
  function handleGPS() {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    setAddrError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPos(p)
        setAddrInput('')
        updateUserMarker(p)
        setGpsLoading(false)
      },
      () => {
        setAddrError('Impossibile ottenere la posizione GPS.')
        setGpsLoading(false)
      },
      { timeout: 8000 }
    )
  }

  // Geocoding via Nominatim
  async function handleAddrSearch() {
    if (!addrInput.trim()) return
    setAddrLoading(true)
    setAddrError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addrInput + ', Brescia')}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'it' } }
      )
      const data = await res.json()
      if (!data.length) { setAddrError('Indirizzo non trovato.'); setAddrLoading(false); return }
      const p = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      setUserPos(p)
      updateUserMarker(p)
    } catch {
      setAddrError('Errore nella ricerca indirizzo.')
    }
    setAddrLoading(false)
  }

  // Click sulla mappa per scegliere posizione
  useEffect(() => {
    if (!instanceRef.current) return
    const map = instanceRef.current

    function onMapClick(e) {
      if (!pickMode) return
      const p = { lat: e.latlng.lat, lng: e.latlng.lng }
      setUserPos(p)
      setAddrInput('')
      setAddrError(null)
      updateUserMarker(p)
      setPickMode(false)
      map.getContainer().style.cursor = ''
    }

    map.on('click', onMapClick)
    if (pickMode) map.getContainer().style.cursor = 'crosshair'
    else map.getContainer().style.cursor = ''

    return () => map.off('click', onMapClick)
  }, [pickMode, updateUserMarker])

  // Aggiorna tile layer quando cambia tema o tipo di mappa
  useEffect(() => {
    if (!instanceRef.current || !tileLayerRef.current) return
    const map = instanceRef.current
    import('leaflet').then(L => {
      tileLayerRef.current.remove()
      let url, attribution
      if (mapType === 'satellite') {
        url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        attribution = '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
      } else if (isDark) {
        url = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
        attribution = '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      } else {
        url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        attribution = '&copy; OpenStreetMap'
      }
      const newTile = L.tileLayer(url, { attribution, maxZoom: 20 })
      newTile.addTo(map)
      tileLayerRef.current = newTile
    })
  }, [isDark, mapType])

  // Fetch meteo Brescia via Open-Meteo (no API key)
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=45.5415&longitude=10.2118&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature&wind_speed_unit=kmh&timezone=Europe%2FRome')
      .then(r => r.json())
      .then(data => {
        const c = data.current
        const code = c.weather_code
        // WMO weather code → emoji + label
        const wmoMap = [
          { range: [0,0],     icon: '☀️',  label: 'Sereno' },
          { range: [1,3],     icon: '🌤️', label: 'Parzialmente nuvoloso' },
          { range: [45,48],   icon: '🌫️', label: 'Nebbia' },
          { range: [51,55],   icon: '🌦️', label: 'Pioggerella' },
          { range: [61,65],   icon: '🌧️', label: 'Pioggia' },
          { range: [71,77],   icon: '❄️',  label: 'Neve' },
          { range: [80,82],   icon: '🌧️', label: 'Rovesci' },
          { range: [95,99],   icon: '⛈️', label: 'Temporale' },
        ]
        const wmo = wmoMap.find(w => code >= w.range[0] && code <= w.range[1]) || { icon: '🌡️', label: 'Variabile' }
        setWeather({
          temp: Math.round(c.temperature_2m),
          feels: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          wind: Math.round(c.wind_speed_10m),
          icon: wmo.icon,
          label: wmo.label,
        })
      })
      .catch(() => {})
  }, [])

  // Lista filtrata + ordinata
  const withDist = bresciaParking
    .filter(p => p.nome.toLowerCase().includes(query.toLowerCase()))
    .filter(p => coverFilter === 'all' ? true : coverFilter === 'coperto' ? p.coperto : !p.coperto)
    .map(p => ({
      ...p,
      dist: userPos ? haversine(userPos.lat, userPos.lng, p.lat, p.lng) : null,
    }))
    .sort((a, b) => {
      if (a.dist !== null && b.dist !== null) return a.dist - b.dist
      return b.posti - a.posti
    })

  useEffect(() => {
    if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null }
    let cancelled = false

    import('leaflet').then(L => {
      if (cancelled || !mapRef.current) return

      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, { center: [45.5415, 10.2118], zoom: 13 })
      instanceRef.current = map

      const tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 19,
      })
      tile.addTo(map)
      tileLayerRef.current = tile

      bresciaParking.forEach(p => {
        const circle = L.circleMarker([p.lat, p.lng], {
          radius: getRadius(p.posti), fillColor: getColor(p.posti),
          fillOpacity: 0.85, color: getColor(p.posti), weight: 2,
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

    return () => { cancelled = true; if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null } }
  }, [])

  const inputStyle = {
    background: 'transparent', border: 'none', outline: 'none',
    color: textPrimary, fontSize: '13px', width: '100%',
  }

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 56px)', width: '100%' }}>

      {/* Widget meteo — in basso a sinistra */}
      {weather && (
        <div style={{
          position: 'absolute', bottom: '32px', left: '16px', zIndex: 1000,
          background: panelBg, backdropFilter: 'blur(12px)',
          border: `1px solid ${panelBorder}`, borderRadius: '14px',
          padding: '10px 14px', boxShadow: shadow,
          display: 'flex', alignItems: 'center', gap: '10px',
          minWidth: '160px',
        }}>
          <span style={{ fontSize: '28px', lineHeight: 1 }}>{weather.icon}</span>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: textPrimary, lineHeight: 1, fontFamily: 'DM Mono, monospace' }}>
              {weather.temp}°C
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: textSecond, marginTop: '2px' }}>{weather.label}</div>
            <div style={{ fontSize: '10px', color: textMuted, marginTop: '2px' }}>
              💧 {weather.humidity}% · 💨 {weather.wind} km/h
            </div>
            <div style={{ fontSize: '10px', color: textMuted }}>
              Percepita {weather.feels}°C · Brescia
            </div>
          </div>
        </div>
      )}

      {/* Badge + bottone lista */}
      <div style={{
        position: 'absolute', top: '16px', left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
      }}>
        <div style={{
          background: panelBg, backdropFilter: 'blur(10px)',
          border: `1px solid ${panelBorder}`, borderRadius: '12px',
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px',
          pointerEvents: 'none', boxShadow: shadow,
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>
            🗺️ {bresciaParking.length} parcheggi · {bresciaParking.reduce((a, p) => a + p.posti, 0).toLocaleString('it-IT')} posti
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { color: '#60a5fa', label: '< 150' },
              { color: '#10b981', label: '150–399' },
              { color: '#f59e0b', label: '400–999' },
              { color: '#ef4444', label: '1000+' },
            ].map(({ color, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: textSecond }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setShowPanel(p => !p); setQuery('') }}
          style={{
            background: showPanel ? '#10b981' : panelBg,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${showPanel ? '#10b981' : panelBorder}`,
            borderRadius: '12px', padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', color: showPanel ? '#fff' : textPrimary,
            fontSize: '13px', fontWeight: 600, transition: 'all 150ms', boxShadow: shadow,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Lista parcheggi
        </button>

        {/* Switch Stradale / Satellitare */}
        <div style={{
          display: 'flex', background: panelBg, backdropFilter: 'blur(10px)',
          border: `1px solid ${panelBorder}`, borderRadius: '12px',
          padding: '4px', gap: '2px', boxShadow: shadow,
        }}>
          {[
            { key: 'streets', icon: '🗺️', label: 'Mappa' },
            { key: 'satellite', icon: '🛰️', label: 'Satellite' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setMapType(key)}
              style={{
                padding: '6px 12px', borderRadius: '9px', border: 'none',
                background: mapType === key ? '#10b981' : 'transparent',
                color: mapType === key ? '#fff' : textSecond,
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
                transition: 'all 150ms',
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pannello lista */}
      {showPanel && (
        <div style={{
          position: 'absolute', top: '68px', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000, background: panelBg,
          backdropFilter: 'blur(14px)', border: `1px solid ${panelBorder}`,
          borderRadius: '16px', width: '360px', maxHeight: '520px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: shadow,
        }}>

          {/* Ricerca parcheggio */}
          <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${panelBorder}` }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: inputBg, border: `1px solid ${inputBorder}`,
              borderRadius: '10px', padding: '8px 12px', marginBottom: '8px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cerca parcheggio…"
                style={inputStyle}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '14px', padding: 0 }}>✕</button>
              )}
            </div>

            {/* Filtro copertura */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              {[
                { key: 'all',      label: '🅿️ Tutti' },
                { key: 'coperto',  label: '🏠 Coperti' },
                { key: 'scoperto', label: '☀️ Scoperti' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCoverFilter(key)}
                  style={{
                    flex: 1, padding: '5px 0', borderRadius: '8px', border: 'none',
                    background: coverFilter === key ? '#10b981' : inputBg,
                    color: coverFilter === key ? '#fff' : textSecond,
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sezione posizione utente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                📍 La tua posizione
              </div>

              {/* Input indirizzo */}
              <div style={{
                display: 'flex', gap: '6px',
              }}>
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
                  background: inputBg, border: `1px solid ${inputBorder}`,
                  borderRadius: '9px', padding: '7px 10px',
                }}>
                  <input
                    value={addrInput}
                    onChange={e => setAddrInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddrSearch()}
                    placeholder="Via e civico…"
                    style={{ ...inputStyle, fontSize: '12px' }}
                  />
                </div>
                <button
                  onClick={handleAddrSearch}
                  disabled={addrLoading || !addrInput.trim()}
                  style={{
                    padding: '7px 12px', borderRadius: '9px',
                    background: '#10b981', border: 'none',
                    color: '#fff', fontSize: '12px', fontWeight: 700,
                    cursor: addrLoading || !addrInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: addrLoading || !addrInput.trim() ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                >
                  {addrLoading ? '…' : 'Cerca'}
                </button>
              </div>

              {/* Azioni GPS e click mappa */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleGPS}
                  disabled={gpsLoading}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: '9px',
                    background: inputBg, border: `1px solid ${inputBorder}`,
                    color: textPrimary, fontSize: '12px', fontWeight: 600,
                    cursor: gpsLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  }}
                >
                  {gpsLoading ? '…' : '📡 GPS'}
                </button>

                <button
                  onClick={() => { setPickMode(p => !p); setShowPanel(false) }}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: '9px',
                    background: pickMode ? '#3b82f6' : inputBg,
                    border: `1px solid ${pickMode ? '#3b82f6' : inputBorder}`,
                    color: pickMode ? '#fff' : textPrimary,
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  }}
                >
                  🖱️ Scegli su mappa
                </button>

                {userPos && (
                  <button
                    onClick={() => { setUserPos(null); setAddrInput(''); updateUserMarker(null) }}
                    style={{
                      padding: '7px 10px', borderRadius: '9px',
                      background: 'rgba(220,38,38,0.06)',
                      border: '1px solid rgba(220,38,38,0.25)',
                      color: '#dc2626', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {addrError && (
                <div style={{ fontSize: '11px', color: '#dc2626' }}>⚠️ {addrError}</div>
              )}

              {userPos && (
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                  ✅ Posizione impostata — lista ordinata per distanza
                </div>
              )}
            </div>
          </div>

          {/* Lista parcheggi */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {withDist.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
                Nessun parcheggio trovato
              </div>
            ) : (
              withDist.map((p, i) => (
                <button
                  key={p.nome}
                  onClick={() => { setShowPanel(false); onParkingClick(p) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px', background: 'transparent', border: 'none',
                    borderBottom: i < withDist.length - 1 ? `1px solid ${rowDivider}` : 'none',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 120ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Numero ordine se c'è posizione */}
                    {userPos && (
                      <span style={{
                        fontSize: '10px', fontWeight: 800,
                        color: i === 0 ? '#10b981' : textMuted,
                        minWidth: '16px', textAlign: 'center',
                      }}>
                        {i + 1}
                      </span>
                    )}
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: getColor(p.posti), display: 'inline-block', flexShrink: 0,
                      boxShadow: `0 0 0 3px ${getColor(p.posti)}20`,
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>
                        {p.nome}
                      </span>
                      <span style={{ fontSize: '10px', color: p.coperto ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                        {p.coperto ? '🏠 Coperto' : '☀️ Scoperto'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {/* Badge distanza */}
                    {p.dist !== null && (
                      <span style={{
                        fontSize: '11px', fontWeight: 700,
                        color: i === 0 ? '#10b981' : textSecond,
                        background: i === 0 ? 'rgba(16,185,129,0.1)' : 'transparent',
                        borderRadius: '6px', padding: i === 0 ? '2px 6px' : '0',
                        fontFamily: 'DM Mono, monospace',
                      }}>
                        {formatDist(p.dist)}
                      </span>
                    )}
                    <span style={{ fontSize: '12px', color: textSecond, fontFamily: 'DM Mono, monospace' }}>
                      {p.posti.toLocaleString('it-IT')} posti
                    </span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </button>
              ))
            )}
          </div>

          <div style={{
            padding: '8px 16px', borderTop: `1px solid ${panelBorder}`,
            fontSize: '11px', color: textMuted, textAlign: 'center',
            background: isDark ? 'rgba(22,22,26,0.5)' : 'rgba(247,248,250,0.8)',
          }}>
            {userPos ? '📍 Ordine per distanza' : `${withDist.length} parcheggi trovati`}
          </div>
        </div>
      )}

      {/* Banner "clicca sulla mappa" */}
      {pickMode && (
        <div style={{
          position: 'absolute', bottom: '24px', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#3b82f6', color: '#fff',
          borderRadius: '12px', padding: '10px 20px',
          fontSize: '13px', fontWeight: 700,
          boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          display: 'flex', alignItems: 'center', gap: '10px',
          whiteSpace: 'nowrap',
        }}>
          🖱️ Clicca sulla mappa per impostare la tua posizione
          <button
            onClick={() => setPickMode(false)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '12px' }}
          >
            Annulla
          </button>
        </div>
      )}

      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
