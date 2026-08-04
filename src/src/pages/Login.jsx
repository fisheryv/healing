import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'

export default function Login() {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const { setUser } = useApp()
  const nav = useNavigate()

  const handleLogin = () => {
    const nickname = account ? '用户' + account.slice(-4) : 'Fisher'
    setUser({ nickname, account })
    nav('/home', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <img className="login-header-img" src="assets/signin.png" alt="" />
        <h1 className="login-header-title">Login</h1>
      </div>

      <div className="login-body">
        <div className="field">
          <label>Email</label>
          <input
            type="text"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder=""
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
          <div className="field-forgot">
            <span className="text-link" onClick={() => nav('/forgot')}>Forgot Password?</span>
          </div>
        </div>

        <button className="btn block" onClick={handleLogin} style={{ marginTop: '20px' }}>
          Login
        </button>

        <div className="login-footer">
          <span className="login-footer-text">Don't have an account?</span>
          <span className="text-link" style={{ fontWeight: 600 }} onClick={() => nav('/register')}> Sign Up</span>
        </div>
      </div>
    </div>
  )
}
