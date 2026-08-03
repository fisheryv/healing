import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { ChevronLeft } from 'lucide-react'

/**
 * 账号安全设置页面
 * 支持的 type: password | binding | deactivate
 */
export default function SettingsPage() {
  const { type } = useParams()
  const nav = useNavigate()
  const { user, setUser } = useApp()
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [toast, setToast] = useState('')
  const [feedback, setFeedback] = useState('')
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const flashToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const handleChangePassword = () => {
    if (!oldPwd || !newPwd || !confirmPwd) {
      flashToast('Please fill in all fields')
      return
    }
    if (newPwd !== confirmPwd) {
      flashToast('Passwords do not match')
      return
    }
    if (newPwd.length < 6) {
      flashToast('Password must be at least 6 characters')
      return
    }
    // Mock: 实际应调用后端
    flashToast('Password changed ✓')
    setOldPwd('')
    setNewPwd('')
    setConfirmPwd('')
  }

  const handleDeactivate = () => {
    // Mock: 实际应调用后端注销
    setUser(null)
    nav('/login', { replace: true })
  }

  const titles = {
    password: 'Change Password',
    binding: 'Linked Accounts',
    deactivate: 'Deactivate Account'
  }

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => nav('/profile')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        <h2>{titles[type] || 'Settings'}</h2>
        <div style={{ width: 24 }} />
      </div>

      <div className="settings-page-body">
        {type === 'password' && (
          <>
            <div className="field">
              <label>Current Password</label>
              <input
                type="password"
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="field">
              <label>New Password</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="field">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
            <button className="btn block" style={{ marginTop: 24 }} onClick={handleChangePassword}>
              Update Password
            </button>
          </>
        )}

        {type === 'binding' && (
          <div className="binding-list">
            <div className="binding-row">
              <div className="binding-info">
                <div className="binding-name">Email</div>
                <div className="binding-value">{user?.account?.includes('@') ? user.account : 'Not bound'}</div>
              </div>
              <button className="btn ghost" style={{ height: 32, fontSize: 11, padding: '0 14px' }}>
                {user?.account?.includes('@') ? 'Manage' : 'Bind'}
              </button>
            </div>
            <div className="binding-row">
              <div className="binding-info">
                <div className="binding-name">Phone</div>
                <div className="binding-value">Not bound</div>
              </div>
              <button className="btn ghost" style={{ height: 32, fontSize: 11, padding: '0 14px' }}>Bind</button>
            </div>
            <div className="binding-row">
              <div className="binding-info">
                <div className="binding-name">Google</div>
                <div className="binding-value">Not bound</div>
              </div>
              <button className="btn ghost" style={{ height: 32, fontSize: 11, padding: '0 14px' }}>Bind</button>
            </div>
            <div className="binding-row">
              <div className="binding-info">
                <div className="binding-name">Apple ID</div>
                <div className="binding-value">Not bound</div>
              </div>
              <button className="btn ghost" style={{ height: 32, fontSize: 11, padding: '0 14px' }}>Bind</button>
            </div>
          </div>
        )}

        {type === 'deactivate' && (
          <div className="deactivate-section">
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Deactivating your account will permanently delete all your focus data, artworks, and presets. This action cannot be undone.
            </p>
            <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 24 }}>
              If you're sure, please confirm below.
            </p>
            <button
              className="btn block"
              style={{ background: '#9a4a4a', borderColor: '#9a4a4a' }}
              onClick={() => setConfirmDeactivate(true)}
            >
              Deactivate My Account
            </button>
          </div>
        )}
      </div>

      {/* 注销确认 */}
      {confirmDeactivate && (
        <div className="modal-mask" onClick={() => setConfirmDeactivate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>Confirm Deactivation</h4>
            <p>This will permanently delete your account and all data. Are you absolutely sure?</p>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setConfirmDeactivate(false)}>Cancel</button>
              <button className="btn" style={{ background: '#9a4a4a', borderColor: '#9a4a4a' }} onClick={handleDeactivate}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
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
  const { user } = useApp()
  const [feedback, setFeedback] = useState('')
  const [toast, setToast] = useState('')

  const titles = {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    feedback: 'Feedback',
    info: 'About'
  }

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      setToast('Please enter your feedback')
      setTimeout(() => setToast(''), 2000)
      return
    }
    // Mock: 实际应调用后端
    setToast('Feedback sent ✓')
    setFeedback('')
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => nav('/profile')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        <h2>{titles[type] || 'About'}</h2>
        <div style={{ width: 24 }} />
      </div>

      <div className="settings-page-body">
        {type === 'terms' && (
          <div className="legal-content">
            <h3>希音 Healing — Terms of Service</h3>
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
            <h3>希音 Healing — Privacy Policy</h3>
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
              <label>Your Feedback</label>
              <textarea
                className="feedback-textarea"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think, or report an issue..."
                rows={6}
                maxLength={500}
              />
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'right', marginTop: 4 }}>
                {feedback.length} / 500
              </div>
            </div>
            <button className="btn block" style={{ marginTop: 16 }} onClick={handleSubmitFeedback}>
              Send Feedback
            </button>
          </>
        )}

        {(!type || type === 'info') && (
          <div className="about-info">
            <div className="about-logo">
              <img src="assets/logo.png" alt="" style={{ width: 80, height: 80, objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            </div>
            <h3>希音 Healing</h3>
            <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Version 0.1.0</p>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6, marginTop: 20, padding: '0 10px' }}>
              An invisible focus tool that turns your attention into art. Draw your stillness, one curve at a time.
            </p>
            <div className="about-links">
              <div className="settings-row" onClick={() => nav('/about/terms')} style={{ cursor: 'pointer' }}>
                <span>Terms of Service</span><span className="arrow">›</span>
              </div>
              <div className="settings-row" onClick={() => nav('/about/privacy')} style={{ cursor: 'pointer' }}>
                <span>Privacy Policy</span><span className="arrow">›</span>
              </div>
              <div className="settings-row" onClick={() => nav('/about/feedback')} style={{ cursor: 'pointer' }}>
                <span>Feedback</span><span className="arrow">›</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
