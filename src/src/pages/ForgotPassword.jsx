import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, auth, validateEmail, validatePassword } from '../store.jsx'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [recoveryAnswer, setRecoveryAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  // 步骤：1 输入邮箱 → 2 回答安全问题 → 3 设置新密码
  const [step, setStep] = useState(1)
  const [question, setQuestion] = useState('')
  const { setUser, t } = useApp()
  const nav = useNavigate()

  // 步骤 1：提交邮箱，拉取该账号的安全问题
  const handleFetchQuestion = async () => {
    setFormError('')
    const errs = {}
    if (!email) errs.email = t('forgot.emailRequired')
    else if (!validateEmail(email)) errs.email = t('forgot.emailInvalid')
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const res = auth.getRecoveryQuestion({ email, type: 'email' })
    setLoading(false)
    if (!res.ok) {
      setErrors({ email: t('forgot.emailNotFound') })
      return
    }
    if (!res.question) {
      setFormError(t('forgot.noQuestion'))
      return
    }
    setQuestion(res.question)
    setStep(2)
  }

  // 步骤 2 + 3：提交安全问题答案和新密码
  const validate = () => {
    const errs = {}
    if (!recoveryAnswer.trim()) errs.recoveryAnswer = t('forgot.answerRequired')
    if (!newPassword) errs.password = t('forgot.passwordRequired')
    else if (!validatePassword(newPassword)) errs.password = t('forgot.passwordShort')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleReset = async () => {
    setFormError('')
    if (!validate()) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const res = auth.resetPassword({ email, password: newPassword, recoveryAnswer: recoveryAnswer.trim(), type: 'email' })
    setLoading(false)
    if (!res.ok) {
      setErrors({ recoveryAnswer: t('forgot.answerIncorrect') })
      return
    }
    // 自动登录：写入 user 状态后跳转首页
    if (res.user) {
      setUser({ nickname: res.user.nickname, account: res.user.account || res.user.email })
      setDone(true)
      setTimeout(() => nav('/home', { replace: true }), 1500)
    } else {
      setDone(true)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (step === 1) handleFetchQuestion()
      else handleReset()
    }
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
          <button className="btn block" onClick={() => nav('/home', { replace: true })}>
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
        {/* 步骤 1：输入邮箱 */}
        <div className="field">
          <label>{t('forgot.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); setFormError('') }}
            onKeyDown={onKeyDown}
            placeholder={t('login.emailPlaceholder')}
            autoComplete="email"
            disabled={step > 1}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        {/* 步骤 2：展示安全问题并输入答案 */}
        {step >= 2 && (
          <div className="field">
            <label>{t('forgot.recoveryQuestion')}</label>
            <div className="recovery-question-display">{question}</div>
          </div>
        )}

        {step >= 2 && (
          <div className="field">
            <label>{t('forgot.recoveryAnswer')}</label>
            <input
              type="text"
              value={recoveryAnswer}
              onChange={(e) => { setRecoveryAnswer(e.target.value); setErrors((p) => ({ ...p, recoveryAnswer: '' })); setFormError('') }}
              onKeyDown={onKeyDown}
              placeholder={t('forgot.answerPlaceholder')}
              autoFocus
            />
            {errors.recoveryAnswer && <span className="field-error">{errors.recoveryAnswer}</span>}
          </div>
        )}

        {/* 步骤 2：设置新密码 */}
        {step >= 2 && (
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
        )}

        {formError && <div className="form-error">{formError}</div>}

        {step === 1 ? (
          <button className="btn block" onClick={handleFetchQuestion} disabled={loading} style={{ marginTop: '12px' }}>
            {loading ? <><Loader2 size={16} className="spin" /> {t('forgot.loadingQuestion')}</> : t('forgot.next')}
          </button>
        ) : (
          <button className="btn block" onClick={handleReset} disabled={loading} style={{ marginTop: '12px' }}>
            {loading ? <><Loader2 size={16} className="spin" /> {t('forgot.resetting')}</> : t('forgot.resetBtn')}
          </button>
        )}

        <div className="login-footer">
          <span className="login-footer-text">{t('forgot.rememberPassword')}</span>
          <span className="text-link" style={{ fontWeight: 600 }} onClick={() => nav('/login')}> {t('forgot.login')}</span>
        </div>
      </div>
    </div>
  )
}
