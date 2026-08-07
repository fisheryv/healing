import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { resumeContext } from '../audioEngine'
import { requestMotionPermission } from '../useScreenDown'

const DURATIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]

export default function FocusConfig() {
  const nav = useNavigate()
  const location = useLocation()
  const { presets, currentMix, setCurrentMix, settings } = useApp()
  const [duration, setDuration] = useState(25)
  const [showPicker, setShowPicker] = useState(false)
  const [activeMix, setActiveMix] = useState(location.state?.mix || currentMix || presets[0] || null)

  const pickerRef = useRef(null)

  useEffect(() => {
    if (pickerRef.current) {
      const idx = DURATIONS.indexOf(duration)
      pickerRef.current.scrollTop = idx * 60
    }
  }, [])

  const handleScroll = () => {
    if (!pickerRef.current) return
    const idx = Math.round(pickerRef.current.scrollTop / 60)
    const d = DURATIONS[Math.max(0, Math.min(DURATIONS.length - 1, idx))]
    if (d !== duration) setDuration(d)
  }

  const handleStart = () => {
    if (!activeMix) return
    // 必须在用户手势同步调用栈中：
    // 1) resume AudioContext —— iOS/Android 自动播放策略要求
    // 2) 请求 DeviceMotion 权限 —— iOS 13+ 要求
    // 否则到了 FocusSession 的 useEffect 里再调用会被浏览器拦截。
    try { resumeContext() } catch (e) { /* noop */ }
    if (settings.screenDown) {
      requestMotionPermission().catch(() => {})
    }
    setCurrentMix(activeMix)
    nav('/focus/session', { state: { duration, mix: activeMix } })
  }

  return (
    <div className="focus-config">
      <div className="label-sm">Duration · Minutes</div>
      <div className="duration-picker" ref={pickerRef} onScroll={handleScroll}>
        <div className="pad" />
        {DURATIONS.map((d) => (
          <div key={d} className={'item' + (d === duration ? ' active' : '')}>
            {d}
          </div>
        ))}
        <div className="pad" />
      </div>

      <div className="mix-summary" onClick={() => setShowPicker(true)}>
        <div className="left">
          <div className="name">{activeMix ? activeMix.name : 'Choose a music preset'}</div>
          <div className="desc">
            {activeMix
              ? [activeMix.mainMusicTitle, activeMix.bgNoise?.name, activeMix.binaural?.name + ' Wave']
                  .filter(Boolean)
                  .join(' · ')
              : 'Tap to choose'}
          </div>
        </div>
        <div style={{ color: 'var(--ink-muted)' }}>›</div>
      </div>

      {activeMix?.binaural && (
        <div className="headphone-hint">
          <img className="airpod airpod-left" src="assets/airpod.png" alt="" />
          <span>Best with Headphones</span>
          <img className="airpod airpod-right" src="assets/airpod.png" alt="" />
        </div>
      )}

      <div className="start-area">
        <button className="btn block" disabled={!activeMix} onClick={handleStart}>
          Begin Focus
        </button>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <span className="text-link" onClick={() => nav(-1)}>Cancel</span>
        </div>
      </div>

      {showPicker && (
        <div className="sheet-mask" onClick={() => setShowPicker(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>Select Mix</h4>
            {presets.length === 0 ? (
              <div className="empty">
                <p>No presets available, please create one in the mix space</p>
                <button className="btn" onClick={() => { setShowPicker(false); nav('/mixer') }}>Mix Space</button>
              </div>
            ) : (
              presets.map((p) => (
                <div key={p.id} className={'opt' + (activeMix?.name === p.name ? ' checked' : '')} onClick={() => { setActiveMix(p); setShowPicker(false) }}>
                  <div className="left">
                    <div>{p.name}</div>
                    <div className="desc">
                      {[p.mainMusicTitle, p.bgNoise?.name, p.binaural?.name + ' Wave'].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div className="opt" onClick={() => { setShowPicker(false); nav('/mixer') }}>
              <div className="left"><div>Mix Space →</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
