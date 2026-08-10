import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, auth, validateEmail, validatePhone, validatePassword } from '../store.jsx'
import { Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react'

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

export default function Login() {
  const [tab, setTab] = useState('email') // 'email' | 'phone'
  const [email, setEmail] = useState(auth.loadRemember())
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+86')
  const [showCountryList, setShowCountryList] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(!!auth.loadRemember())
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const { setUser, t } = useApp()
  const nav = useNavigate()
  const pwdRef = useRef(null)

  const filteredCountries = COUNTRY_CODES.filter((c) =>
    c.label.toLowerCase().includes(countrySearch.toLowerCase())
  )

  const validate = () => {
    const errs = {}
    if (tab === 'email') {
      if (!email) errs.account = t('login.emailRequired')
      else if (!validateEmail(email)) errs.account = t('login.emailInvalid')
    } else {
      if (!phone) errs.account = t('login.phoneRequired')
      else if (!validatePhone(phone)) errs.account = t('login.phoneInvalid')
    }
    if (!password) errs.password = t('login.passwordRequired')
    else if (!validatePassword(password)) errs.password = t('login.passwordShort')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleLogin = async () => {
    setFormError('')
    if (!validate()) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const accountId = tab === 'phone' ? `${countryCode}${phone}` : email
    const res = auth.login({
      email: tab === 'email' ? email : '',
      phone: tab === 'phone' ? `${countryCode}${phone}` : '',
      password,
      type: tab,
    })
    setLoading(false)
    if (!res.ok) {
      setFormError(res.error)
      return
    }
    if (remember) auth.saveRemember(accountId)
    else auth.clearRemember()
    setUser({ nickname: res.user.nickname, account: res.user.account || accountId })
    nav('/home', { replace: true })
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (!password) pwdRef.current?.focus()
      else handleLogin()
    }
  }

  const handleThirdParty = (provider) => {
    // 第三方登录在 Demo 中未接入真实后端，仅提示
    setFormError(t('login.thirdPartySoon'))
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <img className="login-header-img" src="assets/signin.png" alt="" />
        <h1 className="login-header-title">{t('login.title')}</h1>
      </div>

      <div className="login-body">
        {/* 邮箱/手机号 Tab */}
        <div className="auth-tabs">
          <div className={'auth-tab' + (tab === 'email' ? ' active' : '')} onClick={() => { setTab('email'); setErrors({}); setFormError('') }}>
            {t('login.tabEmail')}
          </div>
          <div className={'auth-tab' + (tab === 'phone' ? ' active' : '')} onClick={() => { setTab('phone'); setErrors({}); setFormError('') }}>
            {t('login.tabPhone')}
          </div>
        </div>

        <div className="field">
          <label>{tab === 'email' ? t('login.email') : t('login.phone')}</label>
          {tab === 'email' ? (
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, account: '' })); setFormError('') }}
              onKeyDown={onKeyDown}
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
                onKeyDown={onKeyDown}
                placeholder={t('login.phonePlaceholder')}
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
              <h4>{t('login.countryCode')}</h4>
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
          <label>{t('login.password')}</label>
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
              aria-label={showPwd ? t('login.hidePassword') : t('login.showPassword')}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}
          <div className="field-forgot">
            <span className="text-link" onClick={() => nav('/forgot')}>{t('login.forgotPassword')}</span>
          </div>
        </div>

        <label className="field-remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>{t('login.rememberMe')}</span>
        </label>

        {formError && <div className="form-error">{formError}</div>}

        <button className="btn block" onClick={handleLogin} disabled={loading} style={{ marginTop: '12px' }}>
          {loading ? <><Loader2 size={16} className="spin" /> {t('login.signingIn')}</> : t('login.loginBtn')}
        </button>

        <div className="login-footer">
          <span className="login-footer-text">{t('login.noAccount')}</span>
          <span className="text-link" style={{ fontWeight: 600 }} onClick={() => nav('/register')}> {t('login.signUp')}</span>
        </div>

        {/* 第三方登录 */}
        <div className="third-party-login">
          <div className="third-party-divider">
            <span className="line" />
            <span className="text">{t('login.thirdPartyDivider')}</span>
            <span className="line" />
          </div>
          <div className="third-party-btns">
            <button className="third-party-btn" onClick={() => handleThirdParty('google')} aria-label="Google">
              <span className="tp-icon google-icon">G</span>
              <span className="tp-label">{t('login.google')}</span>
            </button>
            <button className="third-party-btn" onClick={() => handleThirdParty('apple')} aria-label="Apple">
              <span className="tp-icon apple-icon"></span>
              <span className="tp-label">{t('login.apple')}</span>
            </button>
            <button className="third-party-btn" onClick={() => handleThirdParty('wechat')} aria-label="WeChat" title={t('login.wechatUnavailable')}>
              <span className="tp-icon wechat-icon">微</span>
              <span className="tp-label">{t('login.wechat')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
