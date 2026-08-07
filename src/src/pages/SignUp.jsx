import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, auth, validateEmail } from '../store.jsx'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const { setUser } = useApp()
  const nav = useNavigate()
  const sentCodeRef = useRef('')

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendCode = () => {
    if (!email) {
      setErrors((p) => ({ ...p, email: 'Email is required.' }))
      return
    }
    if (!validateEmail(email)) {
      setErrors((p) => ({ ...p, email: 'Please enter a valid email.' }))
      return
    }
    if (auth.exists(email)) {
      setErrors((p) => ({ ...p, email: 'This email is already registered.' }))
      return
    }
    if (countdown > 0) return
    // 模拟发送验证码
    const mockCode = String(Math.floor(100000 + Math.random() * 900000))
    sentCodeRef.current = mockCode
    setCodeSent(true)
    setCountdown(60)
    // 仅演示用，实际环境由后端发送邮件
    console.info('[demo] verification code:', mockCode)
  }

  const validate = () => {
    const errs = {}
    if (!email) errs.email = 'Email is required.'
    else if (!validateEmail(email)) errs.email = 'Please enter a valid email.'
    else if (auth.exists(email)) errs.email = 'This email is already registered.'

    if (!code) errs.code = 'Verification code is required.'
    else if (codeSent && code !== sentCodeRef.current) errs.code = 'Incorrect verification code.'

    if (!nickname.trim()) errs.nickname = 'Nickname is required.'
    else if (nickname.trim().length > 20) errs.nickname = 'Nickname must be 20 characters or fewer.'

    if (!password) errs.password = 'Password is required.'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSignUp = async () => {
    setFormError('')
    if (!validate()) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const res = auth.register({ email, nickname: nickname.trim(), password })
    setLoading(false)
    if (!res.ok) {
      setFormError(res.error)
      return
    }
    setUser({ nickname: res.user.nickname, account: res.user.email })
    nav('/home', { replace: true })
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') handleSignUp()
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
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); setFormError('') }}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label>Verification Code</label>
          <div className="field-code">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setErrors((p) => ({ ...p, code: '' })); setFormError('') }}
              placeholder="6-digit code"
              maxLength={6}
            />
            <button
              className={`code-btn ${countdown > 0 ? 'disabled' : ''}`}
              onClick={handleSendCode}
              disabled={countdown > 0}
              type="button"
            >
              {countdown > 0 ? `${countdown}s` : 'Send'}
            </button>
          </div>
          {errors.code && <span className="field-error">{errors.code}</span>}
          {codeSent && !errors.code && (
            <span className="field-hint">Demo code: {sentCodeRef.current}</span>
          )}
        </div>

        <div className="field">
          <label>Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setErrors((p) => ({ ...p, nickname: '' })); setFormError('') }}
            onKeyDown={onKeyDown}
            placeholder="Your display name"
            maxLength={20}
          />
          {errors.nickname && <span className="field-error">{errors.nickname}</span>}
        </div>

        <div className="field">
          <label>Password</label>
          <div className="field-pwd">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); setFormError('') }}
              onKeyDown={onKeyDown}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="pwd-toggle"
              onClick={() => setShowPwd((v) => !v)}
              tabIndex={-1}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        {formError && <div className="form-error">{formError}</div>}

        <button className="btn block" onClick={handleSignUp} disabled={loading} style={{ marginTop: '12px' }}>
          {loading ? <><Loader2 size={16} className="spin" /> Creating…</> : 'Sign Up'}
        </button>

        <div className="login-footer">
          <span className="login-footer-text">Already have an account?</span>
          <span className="text-link" style={{ fontWeight: 600 }} onClick={() => nav('/login')}> Login</span>
        </div>
      </div>
    </div>
  )
}
