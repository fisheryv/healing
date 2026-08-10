import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { resumeContext } from '../audioEngine'
import { requestMotionPermission } from '../useScreenDown'

const DURATIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]

function localized(field, lang) {
  if (field && typeof field === 'object' && (field.zh || field.en)) {
    return field[lang] || field.en
  }
  return field
}

export default function FocusConfig() {
  const nav = useNavigate()
  const location = useLocation()
  const { presets, currentMix, setCurrentMix, settings, lang, t } = useApp()
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
    try { resumeContext() } catch (e) { /* noop */ }
    if (settings.screenDown) {
      requestMotionPermission().catch(() => {})
    }
    setCurrentMix(activeMix)
    nav('/focus/session', { state: { duration, mix: activeMix } })
  }

  return (
    <div className="focus-config">
      <div className="label-sm">{t('focusConfig.duration')}</div>
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
          <div className="name">{activeMix ? activeMix.name : t('focusConfig.choosePreset')}</div>
          <div className="desc">
            {activeMix
              ? [
                  activeMix.mainMusicTitle && localized(activeMix.mainMusicTitle, lang),
                  activeMix.bgNoise?.name && localized(activeMix.bgNoise.name, lang),
                  activeMix.binaural?.name && (lang === 'zh'
                    ? localized(activeMix.binaural.name, lang) + t('focusConfig.wave')
                    : localized(activeMix.binaural.name, lang) + ' ' + t('focusConfig.wave'))
                ]
                  .filter(Boolean)
                  .join(' · ')
              : t('focusConfig.tapToChoose')}
          </div>
        </div>
        <div style={{ color: 'var(--ink-muted)' }}>›</div>
      </div>

      {activeMix?.binaural && (
        <div className="headphone-hint">
          <img className="airpod airpod-left" src="assets/airpod.png" alt="" />
          <span>{t('focusConfig.bestWithHeadphones')}</span>
          <img className="airpod airpod-right" src="assets/airpod.png" alt="" />
        </div>
      )}

      <div className="start-area">
        <button className="btn block" disabled={!activeMix} onClick={handleStart}>
          {t('focusConfig.beginFocus')}
        </button>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <span className="text-link" onClick={() => nav(-1)}>{t('focusConfig.cancel')}</span>
        </div>
      </div>

      {showPicker && (
        <div className="sheet-mask" onClick={() => setShowPicker(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{t('focusConfig.selectMix')}</h4>
            {presets.length === 0 ? (
              <div className="empty">
                <p>{t('focusConfig.noPresets')}</p>
                <button className="btn" onClick={() => { setShowPicker(false); nav('/mixer') }}>{t('focusConfig.mixSpace')}</button>
              </div>
            ) : (
              presets.map((p) => (
                <div key={p.id} className={'opt' + (activeMix?.name === p.name ? ' checked' : '')} onClick={() => { setActiveMix(p); setShowPicker(false) }}>
                  <div className="left">
                    <div>{p.name}</div>
                    <div className="desc">
                      {[
                        p.mainMusicTitle && localized(p.mainMusicTitle, lang),
                        p.bgNoise?.name && localized(p.bgNoise.name, lang),
                        p.binaural?.name && (lang === 'zh'
                          ? localized(p.binaural.name, lang) + t('focusConfig.wave')
                          : localized(p.binaural.name, lang) + ' ' + t('focusConfig.wave'))
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div className="opt" onClick={() => { setShowPicker(false); nav('/mixer') }}>
              <div className="left"><div>{t('focusConfig.mixSpace')} →</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
