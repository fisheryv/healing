import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [countdown, setCountdown] = useState(0)
  const { setUser } = useApp()
  const nav = useNavigate()

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendCode = () => {
    if (!email || countdown > 0) return
    setCountdown(60)
  }

  const handleSignUp = () => {
    const name = nickname.trim() || 'Healing'
    setUser({ nickname: name, account: email })
    nav('/home', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <img className="login-header-img" src="assets/signin.png" alt="" />
        <h1 className="login-header-title">Sign Up</h1>
      </div>

      <div className="login-body">
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=""
          />
        </div>

        <div className="field">
          <label>Verification Code</label>
          <div className="field-code">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder=""
            />
            <button
              className={`code-btn ${countdown > 0 ? 'disabled' : ''}`}
              onClick={handleSendCode}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `${countdown}s` : 'Send'}
            </button>
          </div>
        </div>

        <div className="field">
          <label>Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
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
        </div>

        <button className="btn block" onClick={handleSignUp} style={{ marginTop: '20px' }}>
          Sign Up
        </button>

        <div className="login-footer">
          <span className="login-footer-text">Already have an account?</span>
          <span className="text-link" style={{ fontWeight: 600 }} onClick={() => nav('/login')}> Login</span>
        </div>
      </div>
    </div>
  )
}
