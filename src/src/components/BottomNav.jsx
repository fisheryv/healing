import { NavLink } from 'react-router-dom'
import { House, ListMusic, Music, Component, User } from 'lucide-react'

const tabs = [
  { to: '/home', label: 'Home', Icon: House },
  { to: '/library', label: 'Library', Icon: ListMusic },
  { to: '/mixer', label: 'Mixer', Icon: Music },
  { to: '/gallery', label: 'Gallery', Icon: Component },
  { to: '/profile', label: 'Profile', Icon: User }
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}
        >
          <t.Icon size={20} strokeWidth={1} />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
