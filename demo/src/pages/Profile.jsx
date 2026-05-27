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

  const totalSec = artworks.filter((a) => a.status === 'complete').reduce((s, a) => s + a.duration * 60, 0)
  const totalComplete = artworks.filter((a) => a.status === 'complete').length
  const cells = buildHeatmap(artworks)

  const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] })

  const logout = () => {
    setUser(null)
    nav('/login', { replace: true })
  }

  return (
    <div>
      <div className="profile-head">
        <div className="avatar">{(user?.nickname || '希')[0]}</div>
        <div className="info">
          <div className="name">{user?.nickname || '希音'}</div>
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
          <span>强制屏幕朝下</span>
          <div className={'switch' + (settings.screenDown ? ' on' : '')} onClick={() => toggle('screenDown')} />
        </div>
        <div className="settings-row">
          <span>专注时勿扰</span>
          <div className={'switch' + (settings.dnd ? ' on' : '')} onClick={() => toggle('dnd')} />
        </div>
        <div className="settings-row">
          <span>专注完成提醒</span>
          <div className={'switch' + (settings.completeNotice ? ' on' : '')} onClick={() => toggle('completeNotice')} />
        </div>
      </div>

      <div className="settings-group">Account</div>
      <div className="settings-list">
        <div className="settings-row"><span>修改昵称</span><span className="arrow">›</span></div>
        <div className="settings-row"><span>修改密码</span><span className="arrow">›</span></div>
        <div className="settings-row"><span>已绑定账号</span><span className="arrow">›</span></div>
      </div>

      <div className="settings-group">About</div>
      <div className="settings-list">
        <div className="settings-row"><span>当前版本</span><span className="arrow">v0.1.0</span></div>
        <div className="settings-row"><span>用户协议</span><span className="arrow">›</span></div>
        <div className="settings-row"><span>隐私政策</span><span className="arrow">›</span></div>
        <div className="settings-row"><span>意见反馈</span><span className="arrow">›</span></div>
        <div className="settings-row" onClick={logout} style={{ color: '#9a4a4a', justifyContent: 'center' }}>
          <span>退出登录</span>
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
