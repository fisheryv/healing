import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './store.jsx'
import BottomNav from './components/BottomNav.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Home from './pages/Home.jsx'
import Library from './pages/Library.jsx'
import Mixer from './pages/Mixer.jsx'
import Gallery from './pages/Gallery.jsx'
import Profile from './pages/Profile.jsx'
import FocusConfig from './pages/FocusConfig.jsx'
import FocusSession from './pages/FocusSession.jsx'
import Player from './pages/Player.jsx'
import ArtworkDetail from './pages/ArtworkDetail.jsx'
import SettingsPage, { AboutPage } from './pages/SettingsPage.jsx'

const TABS = ['/home', '/library', '/mixer', '/gallery', '/profile']
const FULLSCREEN = ['/onboarding', '/login', '/register', '/forgot', '/focus/config', '/focus/session', '/player', '/artwork', '/settings', '/about']

function Shell() {
  const location = useLocation()
  const showTabs = TABS.includes(location.pathname)
  const isFullscreen = FULLSCREEN.includes(location.pathname)
  const { user } = useApp()

  return (
    <div className="app-shell">
      <div className="phone">
        <div className={'screen' + (showTabs ? '' : ' no-tabs')} style={isFullscreen ? { padding: 0 } : undefined}>
          <Routes>
            <Route path="/" element={<Navigate to={user ? '/home' : '/onboarding'} replace />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/home" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/mixer" element={<Mixer />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/focus/config" element={<FocusConfig />} />
            <Route path="/focus/session" element={<FocusSession />} />
            <Route path="/player/:id" element={<Player />} />
            <Route path="/artwork/:id" element={<ArtworkDetail />} />
            <Route path="/settings/:type" element={<SettingsPage />} />
            <Route path="/about/:type" element={<AboutPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
        {showTabs && <BottomNav />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
