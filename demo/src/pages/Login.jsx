import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'

export default function Login() {
  const [tab, setTab] = useState('phone')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const { setUser } = useApp()
  const nav = useNavigate()

  const handleLogin = () => {
    const nickname = account ? '用户' + account.slice(-4) : '希音'
    setUser({ nickname, account })
    nav('/home', { replace: true })
  }

  return (
    <div className="login-wrap">
      <div className="brand">
        Healing
        <span className="cn">希 · 音</span>
      </div>

      <div className="tabs">
        <div className={'tab-item' + (tab === 'phone' ? ' active' : '')} onClick={() => setTab('phone')}>
          Phone
        </div>
        <div className={'tab-item' + (tab === 'email' ? ' active' : '')} onClick={() => setTab('email')}>
          Email
        </div>
      </div>

      <div className="field">
        <label>{tab === 'phone' ? 'Phone Number' : 'Email Address'}</label>
        <input
          type="text"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder={tab === 'phone' ? '请输入手机号' : 'name@example.com'}
        />
      </div>

      <div className="field">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <button className="btn block" onClick={handleLogin}>
        Sign In
      </button>

      <div style={{ textAlign: 'center', marginTop: -8 }}>
        <span className="text-link">忘记密码？</span>
      </div>

      <div className="third-party">
        <div className="icon-btn">G</div>
        <div className="icon-btn"></div>
        <div className="icon-btn">W</div>
      </div>
    </div>
  )
}
