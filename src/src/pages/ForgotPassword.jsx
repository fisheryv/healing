import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, auth, validateEmail } from '../store.jsx'
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
  const { t } = useApp()
  const nav = useNavigate()
  const sentCodeRef = useRef('')

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendCode = () => {
    if (!email) {
      setErrors((p) => ({ ...p, email: t('forgot.emailRequired') }))
      return
    }
    if (!validateEmail(email)) {
      setErrors((p) => ({ ...p, email: t('forgot.emailInvalid') }))
      return
    }
    if (!auth.exists(email)) {
      setErrors((p) => ({ ...p, email: t('forgot.emailNotFound') }))
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
    if (!email) errs.email = t('forgot.emailRequired')
    else if (!validateEmail(email)) errs.email = t('forgot.emailInvalid')
    else if (!auth.exists(email)) errs.email = t('forgot.emailNotFound')

    if (!code) errs.code = t('forgot.codeRequired')
    else if (codeSent && code !== sentCodeRef.current) errs.code = t('forgot.codeIncorrect')

    if (!newPassword) errs.password = t('forgot.passwordRequired')
    else if (newPassword.length < 6) errs.password = t('forgot.passwordShort')

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
          <h1 className="login-header-title">{t('forgot.title')}</h1>
        </div>
        <div className="login-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={56} style={{ color: '#5b7a5b', marginBottom: 12 }} />
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14, margin: '0 0 24px' }}>
            {t('forgot.successMsg')}
          </p>
          <button className="btn block" onClick={() => nav('/login', { replace: true })}>
            {t('forgot.backToLogin')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <img className="login-header-img" src="assets/signin.png" alt="" />
        <h1 className="login-header-title">{t('forgot.title')}</h1>
      </div>

      <div className="login-body">
        <div className="field">
          <label>{t('forgot.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); setFormError('') }}
            placeholder={t('login.emailPlaceholder')}
            autoComplete="email"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label>{t('forgot.verifyCode')}</label>
          <div className="field-code">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setErrors((p) => ({ ...p, code: '' })); setFormError('') }}
              placeholder={t('forgot.codePlaceholder')}
              maxLength={6}
            />
            <button
              className={`code-btn ${countdown > 0 ? 'disabled' : ''}`}
              onClick={handleSendCode}
              disabled={countdown > 0}
              type="button"
            >
              {countdown > 0 ? `${countdown}s` : t('forgot.send')}
            </button>
          </div>
          {errors.code && <span className="field-error">{errors.code}</span>}
          {codeSent && !errors.code && (
            <span className="field-hint">{t('forgot.demoCode')}{sentCodeRef.current}</span>
          )}
        </div>

        <div className="field">
          <label>{t('forgot.newPassword')}</label>
          <div className="field-pwd">
            <input
              type={showPwd ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); setFormError('') }}
              onKeyDown={onKeyDown}
              placeholder={t('forgot.passwordPlaceholder')}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="pwd-toggle"
              onClick={() => setShowPwd((v) => !v)}
              tabIndex={-1}
              aria-label={showPwd ? t('forgot.hidePassword') : t('forgot.showPassword')}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        {formError && <div className="form-error">{formError}</div>}
        {formSuccess && <div className="form-success">{formSuccess}</div>}

        <button className="btn block" onClick={handleReset} disabled={loading} style={{ marginTop: '12px' }}>
          {loading ? <><Loader2 size={16} className="spin" /> {t('forgot.resetting')}</> : t('forgot.resetBtn')}
        </button>

        <div className="login-footer">
          <span className="login-footer-text">{t('forgot.rememberPassword')}</span>
          <span className="text-link" style={{ fontWeight: 600 }} onClick={() => nav('/login')}> {t('forgot.login')}</span>
        </div>
      </div>
    </div>
  )
}
