import { NavLink } from 'react-router-dom'
import { House, ListMusic, Music, Component, User } from 'lucide-react'
import { useApp } from '../store.jsx'

export default function BottomNav() {
  const { t } = useApp()
  const tabs = [
    { to: '/home', label: t('nav.home'), Icon: House },
    { to: '/library', label: t('nav.library'), Icon: ListMusic },
    { to: '/mixer', label: t('nav.mixer'), Icon: Music },
    { to: '/gallery', label: t('nav.gallery'), Icon: Component },
    { to: '/profile', label: t('nav.profile'), Icon: User }
  ]

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}
        >
          <tab.Icon size={20} strokeWidth={1} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
