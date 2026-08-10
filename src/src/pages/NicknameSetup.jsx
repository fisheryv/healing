import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { Loader2 } from 'lucide-react'

export default function NicknameSetup() {
  const { user, setUser, t } = useApp()
  const nav = useNavigate()
  const location = useLocation()
  const justRegistered = location.state?.justRegistered
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const avatarInputRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null)

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleComplete = async () => {
    setError('')
    const name = nickname.trim()
    if (!name) {
      setError(t('nicknameSetup.nicknameRequired'))
      return
    }
    if (name.length > 20) {
      setError(t('nicknameSetup.nicknameLong'))
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    setUser({ ...user, nickname: name, avatar: avatarPreview })
    setLoading(false)
    nav('/home', { replace: true })
  }

  const handleSkip = () => {
    // 跳过时使用默认昵称：用户 + 账号后4位
    const account = user?.account || ''
    const tail = account.replace(/\D/g, '').slice(-4) || '0000'
    const defaultName = `用户${tail}`
    setUser({ ...user, nickname: defaultName, avatar: avatarPreview })
    nav('/home', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <img className="login-header-img" src="assets/signin.png" alt="" />
        <h1 className="login-header-title">{t('nicknameSetup.title')}</h1>
      </div>

      <div className="login-body">
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14, margin: '0 0 24px' }}>
          {t('nicknameSetup.desc')}
        </p>

        {/* 头像占位圆 */}
        <div className="nickname-avatar-wrap">
          <div className="nickname-avatar" onClick={() => avatarInputRef.current?.click()}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="" />
            ) : (
              <span className="nickname-avatar-placeholder">{(nickname || user?.nickname || '?').slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          <span className="nickname-avatar-hint">{t('nicknameSetup.uploadAvatar')}</span>
        </div>

        <div className="field">
          <label>{t('nicknameSetup.nicknamePlaceholder')}</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setError('') }}
            placeholder={t('nicknameSetup.nicknamePlaceholder')}
            maxLength={20}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleComplete()}
          />
          {error && <span className="field-error">{error}</span>}
        </div>

        <button className="btn block" onClick={handleComplete} disabled={loading} style={{ marginTop: '12px' }}>
          {loading ? <><Loader2 size={16} className="spin" /> {t('nicknameSetup.complete')}</> : t('nicknameSetup.complete')}
        </button>

        <div className="login-footer">
          <span className="text-link" style={{ fontWeight: 400 }} onClick={handleSkip}>{t('nicknameSetup.skip')}</span>
        </div>
      </div>
    </div>
  )
}
