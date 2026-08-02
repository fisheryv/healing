import { useState, useRef } from 'react'
import { useApp } from '../store.jsx'
import { useNavigate } from 'react-router-dom'

const CELLS = 26 * 7

function buildHeatmap(records) {
  const arr = new Array(CELLS).fill(0)
  records.forEach((r, i) => {
    arr[i % CELLS] = (arr[i % CELLS] + 1) % 5
  })
  return arr
}

const LEVELS = ['var(--bg-soft)', '#dadada', '#a8a8a8', '#6a6a6a', '#111111']

export default function Profile() {
  const { user, setUser, artworks, settings, setSettings } = useApp()
  const nav = useNavigate()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const avatarInput = useRef(null)

  const totalSec = artworks.filter((a) => a.status === 'complete').reduce((s, a) => s + a.duration * 60, 0)
  const totalComplete = artworks.filter((a) => a.status === 'complete').length
  const cells = buildHeatmap(artworks)

  const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] })

  const logout = () => {
    setUser(null)
    nav('/login', { replace: true })
  }

  const startEditName = () => {
    setNameDraft(user?.nickname || '')
    setEditingName(true)
  }

  const saveName = () => {
    if (nameDraft.trim()) {
      setUser({ ...user, nickname: nameDraft.trim() })
    }
    setEditingName(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setUser({ ...user, avatar: ev.target.result })
    }
    reader.readAsDataURL(file)
  }

  const avatarSrc = user?.avatar || 'assets/avatar.png'

  return (
    <div>
      <div className="profile-head">
        <div className="avatar avatar-img" onClick={() => avatarInput.current?.click()}>
          <img src={avatarSrc} alt="" />
          <input ref={avatarInput} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
        </div>
        <div className="info">
          {editingName ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="name-edit-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
              />
              <button className="btn" style={{ height: 28, padding: '0 12px', fontSize: 11 }} onClick={saveName}>✓</button>
            </div>
          ) : (
            <div className="name editable" onClick={startEditName}>{user?.nickname || 'Friend'}</div>
          )}
          <div className="id">{user?.account ? maskAccount(user.account) : 'guest'}</div>
        </div>
      </div>

      <div className="heatmap">
        <div className="section-title" style={{ margin: 0 }}>
          <h3>Activity</h3>
          <span className="more">52 weeks</span>
        </div>
        <div className="heatmap-grid">
          {cells.map((v, i) => (
            <div key={i} className="heatmap-cell" style={{ background: LEVELS[v] }} />
          ))}
        </div>
      </div>

      <div className="stats">
        <Stat num={formatDuration(totalSec)} label="Total Focus" />
        <Stat num={totalComplete} label="Sessions" />
        <Stat num={0} label="Streak" />
        <Stat num={artworks.length} label="Artworks" />
      </div>

      <div className="settings-group">Focus</div>
      <div className="settings-list">
        <div className="settings-row">
          <span>Force Screen Downward</span>
          <div className={'switch' + (settings.screenDown ? ' on' : '')} onClick={() => toggle('screenDown')} />
        </div>
        <div className="settings-row">
          <span>Do Not Disturb</span>
          <div className={'switch' + (settings.dnd ? ' on' : '')} onClick={() => toggle('dnd')} />
        </div>
        <div className="settings-row">
          <span>Focus Completion Notice</span>
          <div className={'switch' + (settings.completeNotice ? ' on' : '')} onClick={() => toggle('completeNotice')} />
        </div>
      </div>

      <div className="settings-group">Account</div>
      <div className="settings-list">
        <div className="settings-row"><span>Change Password</span><span className="arrow">›</span></div>
      </div>

      <div className="settings-group">About</div>
      <div className="settings-list">
        <div className="settings-row"><span>Current Version</span><span className="arrow">v0.1.0</span></div>
        <div className="settings-row"><span>Terms of Service</span><span className="arrow">›</span></div>
        <div className="settings-row"><span>Privacy Policy</span><span className="arrow">›</span></div>
        <div className="settings-row"><span>Feedback</span><span className="arrow">›</span></div>
        <div className="settings-row" onClick={logout} style={{ color: '#9a4a4a', justifyContent: 'center' }}>
          <span>Logout</span>
        </div>
      </div>
    </div>
  )
}

function Stat({ num, label }) {
  return (
    <div className="stat-card">
      <div className="num">{num}</div>
      <div className="lbl">{label}</div>
    </div>
  )
}

function formatDuration(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function maskAccount(acc) {
  if (!acc) return ''
  if (acc.includes('@')) {
    const [name, domain] = acc.split('@')
    return name[0] + '***@' + domain
  }
  if (acc.length >= 7) return acc.slice(0, 3) + '****' + acc.slice(-4)
  return acc
}
