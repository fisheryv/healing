import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './store.jsx'
import BottomNav from './components/BottomNav.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Library from './pages/Library.jsx'
import Mixer from './pages/Mixer.jsx'
import Gallery from './pages/Gallery.jsx'
import Profile from './pages/Profile.jsx'
import FocusConfig from './pages/FocusConfig.jsx'
import FocusSession from './pages/FocusSession.jsx'

const TABS = ['/home', '/library', '/mixer', '/gallery', '/profile']

function Shell() {
  const location = useLocation()
  const showTabs = TABS.includes(location.pathname)
  const { user } = useApp()

  return (
    <div className="app-shell">
      <div className="phone">
        <div className={'screen' + (showTabs ? '' : ' no-tabs')}>
          <Routes>
            <Route path="/" element={<Navigate to={user ? '/home' : '/login'} replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/mixer" element={<Mixer />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/focus/config" element={<FocusConfig />} />
            <Route path="/focus/session" element={<FocusSession />} />
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
