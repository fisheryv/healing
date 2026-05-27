import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/home', label: 'Home', cn: '首页' },
  { to: '/library', label: 'Library', cn: '曲库' },
  { to: '/mixer', label: 'Mixer', cn: '调音' },
  { to: '/gallery', label: 'Gallery', cn: '画廊' },
  { to: '/profile', label: 'Profile', cn: '我的' }
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
          <span className="dot" />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
