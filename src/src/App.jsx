import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './store.jsx'
import BottomNav from './components/BottomNav.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import NicknameSetup from './pages/NicknameSetup.jsx'
import Home from './pages/Home.jsx'
import Library from './pages/Library.jsx'
import Mixer from './pages/Mixer.jsx'
import Gallery from './pages/Gallery.jsx'
import Profile from './pages/Profile.jsx'
import FocusConfig from './pages/FocusConfig.jsx'
import FocusSession from './pages/FocusSession.jsx'
import Player from './pages/Player.jsx'
import ArtworkDetail from './pages/ArtworkDetail.jsx'
import BlogList from './pages/BlogList.jsx'
import BlogDetail from './pages/BlogDetail.jsx'
import SettingsPage, { AboutPage } from './pages/SettingsPage.jsx'

const TABS = ['/home', '/library', '/mixer', '/gallery', '/profile']
const FULLSCREEN = ['/onboarding', '/login', '/register', '/forgot', '/nickname-setup', '/focus/config', '/focus/session', '/player', '/artwork', '/settings', '/about', '/blog']

// 需要登录才能访问的路径
const PROTECTED = ['/home', '/library', '/mixer', '/gallery', '/profile', '/focus/config', '/focus/session', '/settings', '/about']

function RequireAuth({ children }) {
  const { user } = useApp()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

function Shell() {
  const location = useLocation()
  const showTabs = TABS.includes(location.pathname)
  const isFullscreen = FULLSCREEN.includes(location.pathname)
  const { user, onboardingSeen } = useApp()

  return (
    <div className="app-shell">
      <div className="phone">
        <div className={'screen' + (showTabs ? '' : ' no-tabs')} style={isFullscreen ? { padding: 0 } : undefined}>
          <Routes>
            <Route path="/" element={<Navigate to={onboardingSeen ? (user ? '/home' : '/login') : '/onboarding'} replace />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/nickname-setup" element={<NicknameSetup />} />
            <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
            <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
            <Route path="/mixer" element={<RequireAuth><Mixer /></RequireAuth>} />
            <Route path="/gallery" element={<RequireAuth><Gallery /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/focus/config" element={<RequireAuth><FocusConfig /></RequireAuth>} />
            <Route path="/focus/session" element={<RequireAuth><FocusSession /></RequireAuth>} />
            <Route path="/player/:id" element={<RequireAuth><Player /></RequireAuth>} />
            <Route path="/artwork/:id" element={<RequireAuth><ArtworkDetail /></RequireAuth>} />
            <Route path="/blog" element={<RequireAuth><BlogList /></RequireAuth>} />
            <Route path="/blog/:id" element={<RequireAuth><BlogDetail /></RequireAuth>} />
            <Route path="/settings/:type" element={<RequireAuth><SettingsPage /></RequireAuth>} />
            <Route path="/about/:type" element={<RequireAuth><AboutPage /></RequireAuth>} />
            <Route path="/about" element={<RequireAuth><AboutPage /></RequireAuth>} />
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
