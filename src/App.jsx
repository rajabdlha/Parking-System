import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Header from './components/Header'
import AuthGate from './components/AuthGate'
import BookingsList from './components/BookingsList'
import BresciaMap from './components/BresciaMap'
import BresciaSpotMap from './components/BresciaSpotMap'
import AdminDashboard from './components/AdminDashboard'

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('map')
  const [selectedParking, setSelectedParking] = useState(null)
  const [myBookings, setMyBookings] = useState([])
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [spotMapRefreshKey, setSpotMapRefreshKey] = useState(0)
  const [spotNotification, setSpotNotification] = useState(null)

  async function loadUserProfile(sessionUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', sessionUser.id)
      .maybeSingle()

    return {
      id: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.user_metadata?.role ?? 'user',
      user_metadata: sessionUser.user_metadata ?? {},
      isAdmin: profile?.is_admin ?? false,
    }
  }

  const fetchMyBookings = useCallback(async (currentUser) => {
    if (!currentUser) return
    setLoadingBookings(true)

    let query = supabase
      .from('brescia_bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (!currentUser.isAdmin) {
      query = query.eq('user_id', currentUser.id)
    }

    const { data, error } = await query
    setMyBookings(!error ? (data ?? []) : [])
    setLoadingBookings(false)
  }, [])

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      setLoadingUser(true)
      const { data } = await supabase.auth.getSession()
      if (!mounted) return

      if (!data?.session?.user) {
        setUser(null)
        setLoadingUser(false)
        return
      }

      const fullUser = await loadUserProfile(data.session.user)
      if (!mounted) return
      setUser(fullUser)
      setLoadingUser(false)
    }

    bootstrap()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setMyBookings([])
        setSelectedParking(null)
        setView('map')
        setLoadingUser(false)
        return
      }

      setLoadingUser(true)
      setTimeout(async () => {
        if (!mounted) return
        const fullUser = await loadUserProfile(session.user)
        if (!mounted) return
        setUser(fullUser)
        setLoadingUser(false)
      }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setMyBookings([])
      return
    }

    fetchMyBookings(user)

    const channel = supabase
      .channel('brescia-bookings-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brescia_bookings' }, () => fetchMyBookings(user))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, fetchMyBookings])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setView('map')
    setSelectedParking(null)
    setMyBookings([])
    setSpotNotification(null)
  }

  if (loadingUser) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: '#0f0f11',
        color: '#e8e8ea',
        fontSize: '15px',
        fontWeight: 600,
      }}>
        Caricamento...
      </div>
    )
  }

  if (!user) {
    return <AuthGate onLogin={() => setLoadingUser(true)} />
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f0f11' }}>
      <Header user={user} onLogout={handleLogout}>
        {user.isAdmin && (
          <button
            onClick={() => setView(view === 'admin' ? 'map' : 'admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: view === 'admin' ? 'rgba(167,139,250,0.15)' : 'transparent',
              border: `1px solid ${view === 'admin' ? '#a78bfa' : '#2a2a32'}`,
              borderRadius: '10px',
              color: view === 'admin' ? '#a78bfa' : '#6b7280',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⚙️ Admin
          </button>
        )}
      </Header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {view === 'parking' && (
          <aside style={{
            width: '300px',
            flexShrink: 0,
            background: '#16161a',
            borderRight: '1px solid #2a2a32',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #2a2a32' }}>
              <p style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                color: '#4a4a55',
                marginBottom: '10px',
              }}>
                Parcheggio selezionato
              </p>

              <div style={{ fontSize: '16px', fontWeight: 700, color: '#e8e8ea' }}>
                {selectedParking?.nome}
              </div>

              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                {selectedParking?.posti?.toLocaleString('it-IT')} posti totali
              </div>

              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Connesso come</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8e8ea', marginTop: '4px' }}>
                  {user.email}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  marginTop: '2px',
                  color: user.isAdmin ? '#a78bfa' : '#10b981',
                }}>
                  {user.isAdmin ? 'Admin' : 'Utente'}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 20px 10px' }}>
              <p style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                color: '#4a4a55',
              }}>
                {user.isAdmin ? 'Tutte le prenotazioni' : 'Le tue prenotazioni'}
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
              {loadingBookings ? (
                <div style={{ fontSize: '13px', color: '#6b7280', paddingTop: '10px' }}>
                  Caricamento...
                </div>
              ) : (
                <BookingsList
                  bookings={myBookings}
                  user={user}
                  onDelete={(booking) => {
                    setMyBookings((prev) => prev.filter((b) => b.id !== booking.id))
                    setSpotMapRefreshKey((k) => k + 1)
                    setSpotNotification({
                      id: Date.now(),
                      type: 'error',
                      message: `Prenotazione posto #${booking.spot_label} eliminata`,
                    })
                  }}
                />
              )}
            </div>
          </aside>
        )}

        <main style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: view === 'map' ? 'hidden' : 'auto',
          background: '#0f0f11',
        }}>
          {view === 'map' && (
            <BresciaMap
              onParkingClick={(parking) => {
                setSelectedParking(parking)
                setView('parking')
              }}
            />
          )}

          {view === 'parking' && selectedParking && (
            <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
              <BresciaSpotMap
                parking={selectedParking}
                onBack={() => {
                  setView('map')
                  setSelectedParking(null)
                }}
                user={user}
                onRefreshBookings={() => fetchMyBookings(user)}
                refreshKey={spotMapRefreshKey}
                externalNotification={spotNotification}
                onNotificationShown={() => setSpotNotification(null)}
              />
            </div>
          )}

          {view === 'admin' && user.isAdmin && (
            <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
              <AdminDashboard user={user} onBack={() => setView('map')} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
