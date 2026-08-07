import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, validateEmail } from '../store.jsx'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [codeSent, setCodeSent] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
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
    if (!auth.exists(email)) {
      setErrors((p) => ({ ...p, email: 'No account found with this email.' }))
      return
    }
    if (countdown > 0) return
    const mockCode = String(Math.floor(100000 + Math.random() * 900000))
    sentCodeRef.current = mockCode
    setCodeSent(true)
    setCountdown(60)
    console.info('[demo] verification code:', mockCode)
  }

  const validate = () => {
    const errs = {}
    if (!email) errs.email = 'Email is required.'
    else if (!validateEmail(email)) errs.email = 'Please enter a valid email.'
    else if (!auth.exists(email)) errs.email = 'No account found with this email.'

    if (!code) errs.code = 'Verification code is required.'
    else if (codeSent && code !== sentCodeRef.current) errs.code = 'Incorrect verification code.'

    if (!newPassword) errs.password = 'New password is required.'
    else if (newPassword.length < 6) errs.password = 'Password must be at least 6 characters.'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleReset = async () => {
    setFormError('')
    setFormSuccess('')
    if (!validate()) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const res = auth.resetPassword({ email, password: newPassword })
    setLoading(false)
    if (!res.ok) {
      setFormError(res.error)
      return
    }
    setDone(true)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') handleReset()
  }

  if (done) {
    return (
      <div className="login-page">
        <div className="login-header">
          <img className="login-header-img" src="assets/signin.png" alt="" />
          <h1 className="login-header-title">Reset</h1>
        </div>
        <div className="login-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={56} style={{ color: '#5b7a5b', marginBottom: 12 }} />
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14, margin: '0 0 24px' }}>
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <button className="btn block" onClick={() => nav('/login', { replace: true })}>
            Back to Login
          </button>
        </div>
      </div>
    )
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
          <label>New Password</label>
          <div className="field-pwd">
            <input
              type={showPwd ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); setFormError('') }}
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
        {formSuccess && <div className="form-success">{formSuccess}</div>}

        <button className="btn block" onClick={handleReset} disabled={loading} style={{ marginTop: '12px' }}>
          {loading ? <><Loader2 size={16} className="spin" /> Resetting…</> : 'Reset Password'}
        </button>

        <div className="login-footer">
          <span className="login-footer-text">Remember your password?</span>
          <span className="text-link" style={{ fontWeight: 600 }} onClick={() => nav('/login')}> Login</span>
        </div>
      </div>
    </div>
  )
}
