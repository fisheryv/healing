import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp, auth, bindings, validatePassword } from '../store.jsx'
import { ChevronLeft, Eye, EyeOff, Loader2 } from 'lucide-react'

/**
 * 账号安全设置页面
 * 支持的 type: password | binding | deactivate
 */
export default function SettingsPage() {
  const { type } = useParams()
  const nav = useNavigate()
  const { user, setUser, t } = useApp()
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('info')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [deactivateInput, setDeactivateInput] = useState('')
  const [deactivateError, setDeactivateError] = useState('')

  const email = user?.account || ''
  const [bindState, setBindState] = useState(() => email ? bindings.get(email) : { phone: null, google: null, apple: null })
  const [bindChannel, setBindChannel] = useState(null)
  const [bindValue, setBindValue] = useState('')
  const [bindError, setBindError] = useState('')

  const flashToast = (msg, ty = 'info') => {
    setToast(msg)
    setToastType(ty)
    setTimeout(() => setToast(''), 2200)
  }

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd || !confirmPwd) {
      flashToast(t('settings.fillAllFields'), 'error')
      return
    }
    if (newPwd !== confirmPwd) {
      flashToast(t('settings.passwordsNotMatch'), 'error')
      return
    }
    if (!validatePassword(newPwd)) {
      flashToast(t('settings.passwordShort'), 'error')
      return
    }
    setLoading(true)
    const res = await auth.changePassword({ oldPassword: oldPwd, newPassword: newPwd })
    setLoading(false)
    if (!res.ok) {
      flashToast(t('settings.currentPasswordIncorrect'), 'error')
      return
    }
    // PB 改密码会让旧 token 失效，需要重新登录
    flashToast(t('settings.passwordChanged'), 'success')
    setOldPwd('')
    setNewPwd('')
    setConfirmPwd('')
    setTimeout(() => {
      auth.logout()
      nav('/login', { replace: true })
    }, 1200)
  }

  const handleDeactivate = () => {
    auth.clearRemember()
    auth.logout()
    nav('/login', { replace: true })
  }

  const openBindDialog = (channel) => {
    setBindChannel(channel)
    setBindValue('')
    setBindError('')
  }

  const confirmBind = () => {
    if (!bindChannel) return
    const val = bindValue.trim()
    if (!val) {
      setBindError(t('settings.enterValue'))
      return
    }
    if (bindChannel === 'phone' && !/^\+?[\d\s-]{6,}$/.test(val)) {
      setBindError(t('settings.invalidPhone'))
      return
    }
    bindings.bind(email, bindChannel, val)
    setBindState(bindings.get(email))
    flashToast(`${bindChannel} ${t('settings.linkedSuccess')}`, 'success')
    setBindChannel(null)
    setBindValue('')
    setBindError('')
  }

  const handleUnbind = (channel) => {
    bindings.unbind(email, channel)
    setBindState(bindings.get(email))
    flashToast(`${channel} ${t('settings.unlinked')}`, 'info')
  }

  const titles = {
    password: t('settings.changePassword'),
    binding: t('settings.linkedAccounts'),
    deactivate: t('settings.deactivate')
  }

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => nav('/profile')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        <h2>{titles[type] || t('settings.settingsTitle')}</h2>
        <div style={{ width: 24 }} />
      </div>

      <div className="settings-page-body">
        {type === 'password' && (
          <>
            <div className="field">
              <label>{t('settings.currentPassword')}</label>
              <div className="field-pwd">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  placeholder={t('settings.currentPasswordPlaceholder')}
                  autoComplete="current-password"
                />
                <button type="button" className="pwd-toggle" onClick={() => setShowOld((v) => !v)} tabIndex={-1}>
                  {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="field">
              <label>{t('settings.newPassword')}</label>
              <div className="field-pwd">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder={t('settings.newPasswordPlaceholder')}
                  autoComplete="new-password"
                />
                <button type="button" className="pwd-toggle" onClick={() => setShowNew((v) => !v)} tabIndex={-1}>
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="field">
              <label>{t('settings.confirmPassword')}</label>
              <div className="field-pwd">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder={t('settings.confirmPlaceholder')}
                  autoComplete="new-password"
                />
                <button type="button" className="pwd-toggle" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className="btn block" style={{ marginTop: 24 }} onClick={handleChangePassword} disabled={loading}>
              {loading ? <><Loader2 size={16} className="spin" /> {t('settings.updating')}</> : t('settings.updatePassword')}
            </button>
          </>
        )}

        {type === 'binding' && (
          <div className="binding-list">
            <div className="binding-row">
              <div className="binding-info">
                <div className="binding-name">{t('settings.email')}</div>
                <div className="binding-value">{user?.account?.includes('@') ? user.account : t('settings.notBound')}</div>
              </div>
              <span className="binding-tag bound">{t('settings.primary')}</span>
            </div>
            <div className="binding-row">
              <div className="binding-info">
                <div className="binding-name">{t('settings.phone')}</div>
                <div className="binding-value">{bindState.phone || t('settings.notBound')}</div>
              </div>
              {bindState.phone ? (
                <button className="btn ghost" style={{ height: 32, fontSize: 11, padding: '0 14px' }} onClick={() => handleUnbind('phone')}>{t('settings.unlink')}</button>
              ) : (
                <button className="btn ghost" style={{ height: 32, fontSize: 11, padding: '0 14px' }} onClick={() => openBindDialog('phone')}>{t('settings.link')}</button>
              )}
            </div>
            <div className="binding-row">
              <div className="binding-info">
                <div className="binding-name">{t('settings.google')}</div>
                <div className="binding-value">{bindState.google || t('settings.notBound')}</div>
              </div>
              {bindState.google ? (
                <button className="btn ghost" style={{ height: 32, fontSize: 11, padding: '0 14px' }} onClick={() => handleUnbind('google')}>{t('settings.unlink')}</button>
              ) : (
                <button className="btn ghost" style={{ height: 32, fontSize: 11, padding: '0 14px' }} onClick={() => openBindDialog('google')}>{t('settings.link')}</button>
              )}
            </div>
            <div className="binding-row">
              <div className="binding-info">
                <div className="binding-name">{t('settings.appleId')}</div>
                <div className="binding-value">{bindState.apple || t('settings.notBound')}</div>
              </div>
              {bindState.apple ? (
                <button className="btn ghost" style={{ height: 32, fontSize: 11, padding: '0 14px' }} onClick={() => handleUnbind('apple')}>{t('settings.unlink')}</button>
              ) : (
                <button className="btn ghost" style={{ height: 32, fontSize: 11, padding: '0 14px' }} onClick={() => openBindDialog('apple')}>{t('settings.link')}</button>
              )}
            </div>
          </div>
        )}

        {type === 'deactivate' && (
          <div className="deactivate-section">
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              {t('settings.deactivateDesc')}
            </p>
            <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 24 }}>
              {t('settings.deactivateConfirm')}
            </p>
            <button
              className="btn block"
              style={{ background: '#9a4a4a', borderColor: '#9a4a4a' }}
              onClick={() => { setConfirmDeactivate(true); setDeactivateInput(''); setDeactivateError('') }}
            >
              {t('settings.deactivateBtn')}
            </button>
          </div>
        )}
      </div>

      {/* 注销确认 */}
      {confirmDeactivate && (
        <div className="modal-mask" onClick={() => setConfirmDeactivate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>{t('settings.confirmDeactivation')}</h4>
            <p>{t('settings.confirmDeactivationDesc')}</p>
            <div className="field" style={{ marginTop: 12 }}>
              <label>{t('settings.confirmDeactivateType')}</label>
              <input
                type="text"
                value={deactivateInput}
                onChange={(e) => { setDeactivateInput(e.target.value); setDeactivateError('') }}
                placeholder={t('settings.confirmDeactivateMatch')}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deactivateInput.trim() === t('settings.confirmDeactivateMatch')) handleDeactivate()
                }}
              />
              {deactivateError && <span className="field-error">{deactivateError}</span>}
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setConfirmDeactivate(false)}>{t('common.cancel')}</button>
              <button
                className="btn"
                style={{ background: '#9a4a4a', borderColor: '#9a4a4a' }}
                onClick={() => {
                  if (deactivateInput.trim() === t('settings.confirmDeactivateMatch')) {
                    handleDeactivate()
                  } else {
                    setDeactivateError(t('settings.confirmDeactivateMismatch'))
                  }
                }}
              >
                {t('settings.deleteForever')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 绑定输入弹窗 */}
      {bindChannel && (
        <div className="modal-mask" onClick={() => setBindChannel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>{bindChannel === 'phone' ? t('settings.linkPhone') : bindChannel === 'google' ? t('settings.linkGoogle') : t('settings.linkApple')}</h4>
            <div className="field" style={{ marginTop: 12 }}>
              <label>{bindChannel === 'phone' ? t('settings.phoneNumber') : t('settings.accountId')}</label>
              <input
                type={bindChannel === 'phone' ? 'tel' : 'text'}
                value={bindValue}
                onChange={(e) => { setBindValue(e.target.value); setBindError('') }}
                placeholder={bindChannel === 'phone' ? '+1 555 000 0000' : 'your-account-id'}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && confirmBind()}
              />
              {bindError && <span className="field-error">{bindError}</span>}
            </div>
            <div className="modal-actions" style={{ marginTop: 18 }}>
              <button className="btn ghost" onClick={() => setBindChannel(null)}>{t('common.cancel')}</button>
              <button className="btn" onClick={confirmBind}>{t('settings.link')}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toastType}`}>{toast}</div>}
    </div>
  )
}

/**
 * 关于页面
 * 支持的 type: terms | privacy | feedback | info
 */
export function AboutPage() {
  const { type } = useParams()
  const nav = useNavigate()
  const { t } = useApp()
  const [feedback, setFeedback] = useState('')
  const [toast, setToast] = useState('')

  const titles = {
    terms: t('about.terms'),
    privacy: t('about.privacy'),
    feedback: t('about.feedback'),
    info: t('about.about')
  }

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      setToast(t('about.enterFeedback'))
      setTimeout(() => setToast(''), 2000)
      return
    }
    // 打开系统邮件客户端（预填收件地址和正文）
    const subject = encodeURIComponent('Healing Feedback')
    const body = encodeURIComponent(feedback.trim())
    const mailtoLink = `mailto:support@healing.app?subject=${subject}&body=${body}`
    try {
      window.location.href = mailtoLink
    } catch (e) {
      // 降级：mailto 失败时仅提示
    }
    setToast(t('about.feedbackSent'))
    setFeedback('')
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => nav('/profile')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        <h2>{titles[type] || t('about.about')}</h2>
        <div style={{ width: 24 }} />
      </div>

      <div className="settings-page-body">
        {type === 'terms' && (
          <div className="legal-content">
            <h3>希音 Healing — {t('about.terms')}</h3>
            <p>Last updated: 2026.08.01</p>
            <p>Welcome to Healing ("希音"). By using this app, you agree to the following terms:</p>
            <p><strong>1. Service Description</strong></p>
            <p>Healing provides focus meditation tools that combine parametric art generation with ambient soundscapes to support your mindfulness practice.</p>
            <p><strong>2. User Content</strong></p>
            <p>Your focus artworks and presets are stored locally on your device. We do not collect or transmit your personal focus data.</p>
            <p><strong>3. Acceptable Use</strong></p>
            <p>You agree to use the app for its intended purpose. Do not attempt to reverse engineer or abuse the service.</p>
            <p><strong>4. Disclaimer</strong></p>
            <p>The app is provided "as is" without warranties. Focus results may vary per individual.</p>
            <p><strong>5. Changes</strong></p>
            <p>We may update these terms periodically. Continued use constitutes acceptance.</p>
          </div>
        )}

        {type === 'privacy' && (
          <div className="legal-content">
            <h3>希音 Healing — {t('about.privacy')}</h3>
            <p>Last updated: 2026.08.01</p>
            <p><strong>1. Data We Collect</strong></p>
            <p>Account information (email/phone, nickname, avatar) for authentication. Focus session data (duration, artworks) is stored locally.</p>
            <p><strong>2. How We Use Data</strong></p>
            <p>To provide and improve the focus experience. Your artworks remain on your device unless you choose to share them.</p>
            <p><strong>3. Data Storage</strong></p>
            <p>Focus data uses browser localStorage. Clearing browser data will remove your artworks and presets.</p>
            <p><strong>4. Third-Party Services</strong></p>
            <p>We do not sell or share your data with third parties.</p>
            <p><strong>5. Your Rights</strong></p>
            <p>You can delete your account and all associated data at any time from Settings.</p>
            <p><strong>6. Contact</strong></p>
            <p>For privacy concerns, please use the Feedback option.</p>
          </div>
        )}

        {type === 'feedback' && (
          <>
            <div className="field">
              <label>{t('about.yourFeedback')}</label>
              <textarea
                className="feedback-textarea"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('about.feedbackPlaceholder')}
                rows={6}
                maxLength={500}
              />
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'right', marginTop: 4 }}>
                {feedback.length} / 500
              </div>
            </div>
            <button className="btn block" style={{ marginTop: 16 }} onClick={handleSubmitFeedback}>
              {t('about.sendFeedback')}
            </button>
          </>
        )}

        {(!type || type === 'info') && (
          <div className="about-info">
            <div className="about-logo">
              <img src="assets/logo.png" alt="" style={{ width: 80, height: 80, objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            </div>
            <h3>希音 Healing</h3>
            <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{t('about.version')}</p>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, marginTop: 20, padding: '0 10px' }}>
              {t('about.desc')}
            </p>
            <div className="about-links">
              <div className="settings-row" onClick={() => nav('/about/terms')} style={{ cursor: 'pointer' }}>
                <span>{t('about.terms')}</span><span className="arrow">›</span>
              </div>
              <div className="settings-row" onClick={() => nav('/about/privacy')} style={{ cursor: 'pointer' }}>
                <span>{t('about.privacy')}</span><span className="arrow">›</span>
              </div>
              <div className="settings-row" onClick={() => nav('/about/feedback')} style={{ cursor: 'pointer' }}>
                <span>{t('about.feedback')}</span><span className="arrow">›</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
