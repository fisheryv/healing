import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, auth, validateEmail, validatePhone, validatePassword } from '../store.jsx'
import { Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react'

// 国家区号列表（精简版）
const COUNTRY_CODES = [
  { code: '+86', label: '中国大陆 +86' },
  { code: '+1', label: '美国/加拿大 +1' },
  { code: '+44', label: '英国 +44' },
  { code: '+81', label: '日本 +81' },
  { code: '+82', label: '韩国 +82' },
  { code: '+65', label: '新加坡 +65' },
  { code: '+60', label: '马来西亚 +60' },
  { code: '+61', label: '澳大利亚 +61' },
  { code: '+49', label: '德国 +49' },
  { code: '+33', label: '法国 +33' },
  { code: '+852', label: '香港 +852' },
  { code: '+886', label: '台湾 +886' },
]

export default function SignUp() {
  const [tab, setTab] = useState('email') // 'email' | 'phone'
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+86')
  const [showCountryList, setShowCountryList] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [recoveryQuestion, setRecoveryQuestion] = useState('')
  const [recoveryAnswer, setRecoveryAnswer] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useApp()
  const nav = useNavigate()

  const filteredCountries = COUNTRY_CODES.filter((c) =>
    c.label.toLowerCase().includes(countrySearch.toLowerCase())
  )

  const validate = () => {
    const errs = {}

    // 账号校验
    if (tab === 'email') {
      if (!email) errs.account = t('signup.emailRequired')
      else if (!validateEmail(email)) errs.account = t('signup.emailInvalid')
    } else {
      if (!phone) errs.account = t('signup.phoneRequired')
      else if (!validatePhone(phone)) errs.account = t('signup.phoneInvalid')
    }

    if (!nickname.trim()) errs.nickname = t('signup.nicknameRequired')
    else if (nickname.trim().length > 20) errs.nickname = t('signup.nicknameLong')

    if (!password) errs.password = t('signup.passwordRequired')
    else if (!validatePassword(password)) errs.password = t('signup.passwordShort')

    // 安全问题校验
    if (!recoveryQuestion.trim()) errs.recoveryQuestion = t('signup.questionRequired')
    if (!recoveryAnswer.trim()) errs.recoveryAnswer = t('signup.answerRequired')

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSignUp = async () => {
    setFormError('')
    if (!validate()) return
    if (tab === 'phone') {
      setFormError(t('signup.phoneNotSupported'))
      return
    }
    setLoading(true)
    const res = await auth.register({
      email,
      nickname: nickname.trim(),
      password,
      recoveryQuestion: recoveryQuestion.trim(),
      recoveryAnswer: recoveryAnswer.trim(),
    })
    setLoading(false)
    if (!res.ok) {
      setFormError(res.error)
      return
    }
    // 跳转到昵称设置页（首次登录）
    nav('/nickname-setup', { replace: true, state: { justRegistered: true } })
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
        {/* 邮箱/手机号 Tab */}
        <div className="auth-tabs">
          <div className={'auth-tab' + (tab === 'email' ? ' active' : '')} onClick={() => { setTab('email'); setErrors({}); setFormError('') }}>
            {t('signup.tabEmail')}
          </div>
          <div className={'auth-tab' + (tab === 'phone' ? ' active' : '')} onClick={() => { setTab('phone'); setErrors({}); setFormError('') }}>
            {t('signup.tabPhone')}
          </div>
        </div>

        <div className="field">
          <label>{tab === 'email' ? t('signup.email') : t('signup.phone')}</label>
          {tab === 'email' ? (
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, account: '' })); setFormError('') }}
              placeholder={t('login.emailPlaceholder')}
              autoComplete="email"
            />
          ) : (
            <div className="phone-input-wrap">
              <button
                type="button"
                className="country-code-btn"
                onClick={() => setShowCountryList(true)}
              >
                {countryCode} <ChevronDown size={14} />
              </button>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, account: '' })); setFormError('') }}
                placeholder={t('signup.phonePlaceholder')}
                autoComplete="tel"
              />
            </div>
          )}
          {errors.account && <span className="field-error">{errors.account}</span>}
        </div>

        {/* 国家区号选择浮层 */}
        {showCountryList && (
          <div className="modal-mask" onClick={() => { setShowCountryList(false); setCountrySearch('') }}>
            <div className="modal country-modal" onClick={(e) => e.stopPropagation()}>
              <h4>{t('signup.countryCode')}</h4>
              <input
                className="country-search"
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="搜索国家/地区"
                autoFocus
              />
              <div className="country-list">
                {filteredCountries.map((c) => (
                  <div
                    key={c.code}
                    className={'country-item' + (countryCode === c.code ? ' selected' : '')}
                    onClick={() => { setCountryCode(c.code); setShowCountryList(false); setCountrySearch('') }}
                  >
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

        {/* 安全问题：用于账号恢复和忘记密码 */}
        <div className="field">
          <label>{t('signup.recoveryQuestion')}</label>
          <input
            type="text"
            value={recoveryQuestion}
            onChange={(e) => { setRecoveryQuestion(e.target.value); setErrors((p) => ({ ...p, recoveryQuestion: '' })); setFormError('') }}
            onKeyDown={onKeyDown}
            placeholder={t('signup.questionPlaceholder')}
            maxLength={60}
          />
          {errors.recoveryQuestion && <span className="field-error">{errors.recoveryQuestion}</span>}
        </div>

        <div className="field">
          <label>{t('signup.recoveryAnswer')}</label>
          <input
            type="text"
            value={recoveryAnswer}
            onChange={(e) => { setRecoveryAnswer(e.target.value); setErrors((p) => ({ ...p, recoveryAnswer: '' })); setFormError('') }}
            onKeyDown={onKeyDown}
            placeholder={t('signup.answerPlaceholder')}
            maxLength={40}
          />
          {errors.recoveryAnswer && <span className="field-error">{errors.recoveryAnswer}</span>}
          <span className="field-hint">{t('signup.recoveryHint')}</span>
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
