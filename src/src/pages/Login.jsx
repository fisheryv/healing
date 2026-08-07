import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, auth, validateEmail } from '../store.jsx'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState(auth.loadRemember())
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(!!auth.loadRemember())
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const { setUser } = useApp()
  const nav = useNavigate()
  const pwdRef = useRef(null)

  const validate = () => {
    const errs = {}
    if (!email) errs.email = 'Email is required.'
    else if (!validateEmail(email)) errs.email = 'Please enter a valid email.'
    if (!password) errs.password = 'Password is required.'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleLogin = async () => {
    setFormError('')
    if (!validate()) return
    setLoading(true)
    // 模拟网络延迟
    await new Promise((r) => setTimeout(r, 600))
    const res = auth.login({ email, password })
    setLoading(false)
    if (!res.ok) {
      setFormError(res.error)
      return
    }
    if (remember) auth.saveRemember(email)
    else auth.clearRemember()
    setUser({ nickname: res.user.nickname, account: res.user.email })
    nav('/home', { replace: true })
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (!password) pwdRef.current?.focus()
      else handleLogin()
    }
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
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); setFormError('') }}
            onKeyDown={onKeyDown}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label>Password</label>
          <div className="field-pwd">
            <input
              ref={pwdRef}
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); setFormError('') }}
              onKeyDown={onKeyDown}
              placeholder="••••••••"
              autoComplete="current-password"
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
          <div className="field-forgot">
            <span className="text-link" onClick={() => nav('/forgot')}>Forgot Password?</span>
          </div>
        </div>

        <label className="field-remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>Remember me</span>
        </label>

        {formError && <div className="form-error">{formError}</div>}

        <button className="btn block" onClick={handleLogin} disabled={loading} style={{ marginTop: '12px' }}>
          {loading ? <><Loader2 size={16} className="spin" /> Signing in…</> : 'Login'}
        </button>

        <div className="login-footer">
          <span className="login-footer-text">Don't have an account?</span>
          <span className="text-link" style={{ fontWeight: 600 }} onClick={() => nav('/register')}> Sign Up</span>
        </div>
      </div>
    </div>
  )
}
