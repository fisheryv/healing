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
  const { setUser, t } = useApp()
  const nav = useNavigate()
  const sentCodeRef = useRef('')

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendCode = () => {
    if (!email) {
      setErrors((p) => ({ ...p, email: t('signup.emailRequired') }))
      return
    }
    if (!validateEmail(email)) {
      setErrors((p) => ({ ...p, email: t('signup.emailInvalid') }))
      return
    }
    if (auth.exists(email)) {
      setErrors((p) => ({ ...p, email: t('signup.emailExists') }))
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
    if (!email) errs.email = t('signup.emailRequired')
    else if (!validateEmail(email)) errs.email = t('signup.emailInvalid')
    else if (auth.exists(email)) errs.email = t('signup.emailExists')

    if (!code) errs.code = t('signup.codeRequired')
    else if (codeSent && code !== sentCodeRef.current) errs.code = t('signup.codeIncorrect')

    if (!nickname.trim()) errs.nickname = t('signup.nicknameRequired')
    else if (nickname.trim().length > 20) errs.nickname = t('signup.nicknameLong')

    if (!password) errs.password = t('signup.passwordRequired')
    else if (password.length < 6) errs.password = t('signup.passwordShort')

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
        <h1 className="login-header-title">{t('signup.title')}</h1>
      </div>

      <div className="login-body">
        <div className="field">
          <label>{t('signup.email')}</label>
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
          <label>{t('signup.verifyCode')}</label>
          <div className="field-code">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setErrors((p) => ({ ...p, code: '' })); setFormError('') }}
              placeholder={t('signup.codePlaceholder')}
              maxLength={6}
            />
            <button
              className={`code-btn ${countdown > 0 ? 'disabled' : ''}`}
              onClick={handleSendCode}
              disabled={countdown > 0}
              type="button"
            >
              {countdown > 0 ? `${countdown}s` : t('signup.send')}
            </button>
          </div>
          {errors.code && <span className="field-error">{errors.code}</span>}
          {codeSent && !errors.code && (
            <span className="field-hint">{t('signup.demoCode')}{sentCodeRef.current}</span>
          )}
        </div>

        <div className="field">
          <label>{t('signup.nickname')}</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setErrors((p) => ({ ...p, nickname: '' })); setFormError('') }}
            onKeyDown={onKeyDown}
            placeholder={t('signup.nicknamePlaceholder')}
            maxLength={20}
          />
          {errors.nickname && <span className="field-error">{errors.nickname}</span>}
        </div>

        <div className="field">
          <label>{t('signup.password')}</label>
          <div className="field-pwd">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); setFormError('') }}
              onKeyDown={onKeyDown}
              placeholder={t('signup.passwordPlaceholder')}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="pwd-toggle"
              onClick={() => setShowPwd((v) => !v)}
              tabIndex={-1}
              aria-label={showPwd ? t('signup.hidePassword') : t('signup.showPassword')}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        {formError && <div className="form-error">{formError}</div>}

        <button className="btn block" onClick={handleSignUp} disabled={loading} style={{ marginTop: '12px' }}>
          {loading ? <><Loader2 size={16} className="spin" /> {t('signup.creating')}</> : t('signup.signUpBtn')}
        </button>

        <div className="login-footer">
          <span className="login-footer-text">{t('signup.hasAccount')}</span>
          <span className="text-link" style={{ fontWeight: 600 }} onClick={() => nav('/login')}> {t('signup.login')}</span>
        </div>
      </div>
    </div>
  )
}
