import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [sent, setSent] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendCode = () => {
    if (!email || countdown > 0) return
    setCountdown(60)
    setSent(true)
  }

  const handleReset = () => {
    nav('/login')
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <img className="login-header-img" src="assets/signin.png" alt="" />
        <h1 className="login-header-title">Reset</h1>
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
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button className="btn block" onClick={handleReset} style={{ marginTop: '20px' }}>
          Reset Password
        </button>

        <div className="login-footer">
          <span className="login-footer-text">Remember your password?</span>
          <span className="text-link" style={{ fontWeight: 600 }} onClick={() => nav('/login')}> Login</span>
        </div>
      </div>
    </div>
  )
}
