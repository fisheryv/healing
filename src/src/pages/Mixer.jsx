import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { officialMusic, noiseOptions, atmosOptions, binauralOptions, findMusicById } from '../data.js'
import * as audioEngine from '../audioEngine.js'

// Helper: 取双语字段在当前语言下的字符串
function localized(field, lang) {
  if (field && typeof field === 'object' && (field.zh || field.en)) {
    return field[lang] || field.en
  }
  return field
}

export default function Mixer() {
  const nav = useNavigate()
  const { savePreset, setCurrentMix, isPresetNameExist, currentMix, lang, t } = useApp()

  const [main, setMain] = useState(null)
  const [mainVol, setMainVol] = useState(70)
  const [mainMuted, setMainMuted] = useState(false)
  const [bgNoise, setBgNoise] = useState(null)
  const [bgVol, setBgVol] = useState(50)
  const [bgMuted, setBgMuted] = useState(false)
  // 氛围音：每项带独立 volume
  const [atmos, setAtmos] = useState([])
  const [binaural, setBinaural] = useState(null)
  const [biVol, setBiVol] = useState(30)
  const [biMuted, setBiMuted] = useState(false)

  const [showMain, setShowMain] = useState(false)
  const [showNoise, setShowNoise] = useState(false)
  const [showBinaural, setShowBinaural] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [toast, setToast] = useState('')
  const [mainSearch, setMainSearch] = useState('')

  // 重名覆盖确认
  const [showOverwrite, setShowOverwrite] = useState(false)
  // 未保存配置提示
  const [showUnsaved, setShowUnsaved] = useState(false)
  // 保存后自动开始（用于 "Save & Start" 流程）
  const [pendingStart, setPendingStart] = useState(false)

  // 标记配置是否有改动（用于判断"未保存"）
  const [dirty, setDirty] = useState(false)

  const flashToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1500)
  }

  // 跟踪最新状态，用于卸载时同步到 store（实现跨页面保留选择）
  const stateRef = useRef({ dirty: false })
  useEffect(() => {
    stateRef.current = {
      dirty,
      mix: buildMix(),
      hasAny: !!(main || bgNoise || atmos.length > 0 || binaural)
    }
  })

  // 进入页面：启动分析
  useEffect(() => {
    audioEngine.startAnalysis()
    return () => {
      audioEngine.stopPreview()
      audioEngine.stopAll()
      audioEngine.stopAnalysis()
      // 卸载时把当前选择同步到 store：只要用户有改动且选择了内容，
      // 就保留到 currentMix，使下次回到 Mixer 时能恢复（除非用户点击 Clear）。
      const s = stateRef.current
      if (s.dirty && s.hasAny) {
        setCurrentMix(s.mix)
      }
    }
  }, [])

  // 从 currentMix 载入配置（进入页面时若有保存的 currentMix 则恢复）
  useEffect(() => {
    if (currentMix && !dirty) {
      if (currentMix.mainMusicId) {
        const m = findMusicById(currentMix.mainMusicId)
        if (m) setMain(m)
      }
      if (currentMix.mainVolume != null) setMainVol(Math.round(currentMix.mainVolume * 100))
      if (currentMix.bgNoise) {
        const allNoise = [...noiseOptions.pure, ...noiseOptions.ambient]
        const found = allNoise.find((n) => n.id === currentMix.bgNoise.id)
        if (found) setBgNoise(found)
      }
      if (currentMix.bgVolume != null) setBgVol(Math.round(currentMix.bgVolume * 100))
      if (currentMix.ambient && currentMix.ambient.length > 0) {
        const loaded = currentMix.ambient
          .map((a) => {
            const found = atmosOptions.find((opt) => opt.id === a.id)
            return found ? { ...found, volume: a.volume ?? 0.5 } : null
          })
          .filter(Boolean)
        setAtmos(loaded)
      }
      if (currentMix.binaural) {
        const found = binauralOptions.find((b) => b.id === currentMix.binaural.id)
        if (found) setBinaural(found)
      }
      if (currentMix.binauralVolume != null) setBiVol(Math.round(currentMix.binauralVolume * 100))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenSheet = (sheetName) => {
    audioEngine.resumeContext()
    if (sheetName === 'main') setShowMain(true)
    else if (sheetName === 'noise') setShowNoise(true)
    else if (sheetName === 'binaural') setShowBinaural(true)
  }

  // 主音乐变更：预览
  useEffect(() => {
    if (main) {
      audioEngine.previewTrack('main', main.src, mainMuted ? 0 : mainVol / 100)
      setDirty(true)
    } else {
      audioEngine.stopPreview('main')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [main])

  useEffect(() => {
    if (main) {
      audioEngine.setTrackVolume('main', mainMuted ? 0 : mainVol / 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainVol, mainMuted])

  // 背景噪音变更：预览
  useEffect(() => {
    if (bgNoise) {
      audioEngine.previewTrack('bgNoise', bgNoise.src, bgMuted ? 0 : bgVol / 100)
      setDirty(true)
    } else {
      audioEngine.stopPreview('bgNoise')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgNoise])

  useEffect(() => {
    if (bgNoise) {
      audioEngine.setTrackVolume('bgNoise', bgMuted ? 0 : bgVol / 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgVol, bgMuted])

  // 氛围音变更：预览（每个氛围音独立 track）
  useEffect(() => {
    // 停止所有旧的 atmos 预览
    audioEngine.stopPreview('atmos_0')
    audioEngine.stopPreview('atmos_1')
    atmos.forEach((a, i) => {
      audioEngine.previewTrack('atmos_' + i, a.src, a.volume ?? 0.5)
    })
    setDirty(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atmos.map((a) => a.id).join(',')])

  // 氛围音量实时调整
  useEffect(() => {
    atmos.forEach((a, i) => {
      audioEngine.setTrackVolume('atmos_' + i, a.volume ?? 0.5)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atmos])

  // 双耳节拍变更：预览
  useEffect(() => {
    if (binaural) {
      // 预览时载波跟随当前选中主音乐的调性（若有），使预览听感与实际播放一致
      audioEngine.previewTrack('binaural', binaural.src, biMuted ? 0 : biVol / 100, {
        musicKey: main?.key,
        musicMode: main?.mode
      })
      setDirty(true)
    } else {
      audioEngine.stopPreview('binaural')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binaural, main?.key, main?.mode])

  useEffect(() => {
    if (binaural) {
      audioEngine.setTrackVolume('binaural', biMuted ? 0 : biVol / 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biVol, biMuted])

  const buildMix = () => ({
    name: presetName.trim() || t('mixer.untitled'),
    mainMusicId: main?.id,
    mainMusicTitle: main?.name,
    mainVolume: mainVol / 100,
    bgNoise: bgNoise ? { id: bgNoise.id, name: bgNoise.name } : null,
    bgVolume: bgVol / 100,
    ambient: atmos.map((a) => ({ id: a.id, name: a.name, volume: a.volume ?? 0.5 })),
    binaural: binaural ? { id: binaural.id, name: binaural.name, range: binaural.range } : null,
    binauralVolume: biVol / 100
  })

  const handleSave = () => {
    if (!presetName.trim()) return
    // 检查重名
    if (isPresetNameExist(presetName.trim())) {
      setShowSave(false)
      setShowOverwrite(true)
      return
    }
    doSave()
  }

  const doSave = () => {
    savePreset(buildMix())
    setShowSave(false)
    setShowOverwrite(false)
    setPresetName('')
    setDirty(false)
    flashToast(t('mixer.presetSaved'))
    if (pendingStart) {
      setPendingStart(false)
      doStart()
    }
  }

  const handleStart = () => {
    if (!main) {
      flashToast(t('mixer.selectMainFirst'))
      return
    }
    // 检查是否有未保存的更改
    if (dirty) {
      setShowUnsaved(true)
      return
    }
    doStart()
  }

  const doStart = () => {
    setCurrentMix(buildMix())
    audioEngine.stopPreview()
    nav('/focus/config')
  }

  // 氛围音操作
  const toggleAtmos = (a) => {
    const exist = atmos.find((x) => x.id === a.id)
    if (exist) {
      setAtmos(atmos.filter((x) => x.id !== a.id))
    } else {
      if (atmos.length >= 2) return
      setAtmos([...atmos, { ...a, volume: 0.5 }])
    }
  }

  const setAtmosVolume = (id, vol) => {
    setAtmos(atmos.map((a) => (a.id === id ? { ...a, volume: vol } : a)))
  }

  const removeAtmos = (id) => {
    setAtmos(atmos.filter((a) => a.id !== id))
  }

  const handleMuteMain = () => setMainMuted((v) => !v)
  const handleMuteBg = () => setBgMuted((v) => !v)
  const handleMuteBi = () => setBiMuted((v) => !v)

  // 一键清除所有配置（同时清掉 store 中的 currentMix，避免下次进入时残留）
  const handleClear = () => {
    audioEngine.stopPreview()
    audioEngine.stopAll()
    setCurrentMix(null)
    setMain(null)
    setMainVol(70)
    setMainMuted(false)
    setBgNoise(null)
    setBgVol(50)
    setBgMuted(false)
    setAtmos([])
    setBinaural(null)
    setBiVol(30)
    setBiMuted(false)
    setDirty(false)
    stateRef.current = { dirty: false, hasAny: false }
    flashToast(t('mixer.cleared'))
  }

  // 主音乐搜索过滤
  const filteredMusic = officialMusic.filter((m) => {
    const name = (m.name && (m.name[lang] || m.name.en) || '').toLowerCase()
    const tag = (m.tag && (m.tag[lang] || m.tag.en) || '').toLowerCase()
    const search = mainSearch.toLowerCase()
    return name.includes(search) || tag.includes(search)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100% - 0px)' }}>
      <div className="page-pad" style={{ paddingBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="page-title cn">{t('mixer.title')}</h1>
        <span className="text-link" onClick={handleClear} style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{t('mixer.clear')}</span>
      </div>

      <div className="track">
        <div className="head">
          <span className="label">{t('mixer.mainMusic')}</span>
          <span className={'mute' + (mainMuted ? ' active' : '')} onClick={handleMuteMain}>{t('mixer.mute')}</span>
        </div>
        <div className="body" onClick={() => handleOpenSheet('main')}>
          {main ? localized(main.name, lang) : <span className="placeholder">{t('mixer.selectMain')}</span>}
        </div>
        {main && <div className="desc">{localized(main.tag, lang)} · {main.duration}</div>}
        {main && (
          <div className="slider">
            <span>VOL</span>
            <input type="range" min={0} max={100} value={mainVol} onChange={(e) => setMainVol(+e.target.value)} />
            <span className="val">{mainVol}</span>
          </div>
        )}
      </div>

      <div className="track">
        <div className="head">
          <span className="label">{t('mixer.noiseAmbience')}</span>
          <span className={'mute' + (bgMuted ? ' active' : '')} onClick={handleMuteBg}>{t('mixer.mute')}</span>
        </div>
        <div className="body" onClick={() => handleOpenSheet('noise')}>
          {bgNoise || atmos.length > 0 ? (
            <>
              {bgNoise ? localized(bgNoise.name, lang) : t('mixer.noBgNoise')}
              {atmos.length > 0 ? ' · ' + atmos.map((a) => localized(a.name, lang)).join(' · ') : ''}
            </>
          ) : (
            <span className="placeholder">{t('mixer.selectNoise')}</span>
          )}
        </div>
        {bgNoise && (
          <div className="slider">
            <span>BG</span>
            <input type="range" min={0} max={100} value={bgVol} onChange={(e) => setBgVol(+e.target.value)} />
            <span className="val">{bgVol}</span>
          </div>
        )}
        {/* 氛围音独立音量滑块和 × 取消 */}
        {atmos.map((a) => (
          <div key={a.id} className="atmos-row">
            <span className="atmos-name">{localized(a.name, lang)}</span>
            <div className="slider" style={{ flex: 1, margin: 0 }}>
              <input type="range" min={0} max={100} value={Math.round((a.volume ?? 0.5) * 100)} onChange={(e) => setAtmosVolume(a.id, +e.target.value / 100)} />
              <span className="val">{Math.round((a.volume ?? 0.5) * 100)}</span>
            </div>
            <span className="atmos-remove" onClick={() => removeAtmos(a.id)}>×</span>
          </div>
        ))}
      </div>

      <div className="track">
        <div className="head">
          <span className="label">{t('mixer.binauralBeats')}</span>
          <span className={'mute' + (biMuted ? ' active' : '')} onClick={handleMuteBi}>{t('mixer.mute')}</span>
        </div>
        <div className="body" onClick={() => handleOpenSheet('binaural')}>
          {binaural ? (lang === 'zh' ? `${localized(binaural.name, lang)}${t('mixer.wave')}` : `${localized(binaural.name, lang)} Wave`) : <span className="placeholder">{t('mixer.selectBinaural')}</span>}
        </div>
        {binaural && <div className="desc">{binaural.range} — {t('mixer.headphonesRec')}</div>}
        {binaural && (
          <div className="slider">
            <span>VOL</span>
            <input type="range" min={0} max={100} value={biVol} onChange={(e) => setBiVol(+e.target.value)} />
            <span className="val">{biVol}</span>
          </div>
        )}
      </div>

      <div className="mixer-actions">
        <button className="btn ghost" onClick={() => setShowSave(true)}>{t('mixer.save')}</button>
        <button className="btn" onClick={handleStart}>{t('mixer.beginFocus')}</button>
      </div>

      {showMain && (
        <div className="sheet-mask" onClick={() => setShowMain(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.selectMainMusic')}</h4>
            <div className="search" style={{ margin: '0 0 14px' }}>
              <input
                type="text"
                placeholder={t('mixer.searchMusic')}
                value={mainSearch}
                onChange={(e) => setMainSearch(e.target.value)}
              />
            </div>
            {filteredMusic.map((m) => (
              <div key={m.id} className={'opt' + (main?.id === m.id ? ' checked' : '')} onClick={() => { setMain(m); setShowMain(false); setMainSearch('') }}>
                <div className="left">
                  <div>{localized(m.name, lang)}</div>
                  <div className="desc">{localized(m.tag, lang)} · {m.duration}</div>
                </div>
              </div>
            ))}
            {filteredMusic.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '20px 0', fontSize: 13 }}>
                {t('mixer.noMusicFound')}
              </div>
            )}
          </div>
        </div>
      )}

      {showNoise && (
        <div className="sheet-mask" onClick={() => setShowNoise(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.backgroundNoise')}</h4>
            <div className="grid-opt">
              {[...noiseOptions.pure, ...noiseOptions.ambient].map((n) => (
                <div
                  key={n.id}
                  className={'pill' + (bgNoise?.id === n.id ? ' checked' : '')}
                  onClick={() => setBgNoise(bgNoise?.id === n.id ? null : n)}
                >
                  {localized(n.name, lang)}
                </div>
              ))}
            </div>
            <h4 style={{ marginTop: 22 }}>{t('mixer.atmosphere')} ({atmos.length} / 2 {t('mixer.selected')})</h4>
            <div className="grid-opt">
              {atmosOptions.map((a) => {
                const isChecked = atmos.find((x) => x.id === a.id)
                const isDisabled = !isChecked && atmos.length >= 2
                return (
                  <div
                    key={a.id}
                    className={'pill' + (isChecked ? ' checked' : '') + (isDisabled ? ' disabled' : '')}
                    onClick={() => {
                      if (isDisabled) return
                      toggleAtmos(a)
                    }}
                  >
                    {localized(a.name, lang)}
                  </div>
                )
              })}
            </div>
            <button className="btn block" style={{ marginTop: 22 }} onClick={() => setShowNoise(false)}>{t('mixer.done')}</button>
          </div>
        </div>
      )}

      {showBinaural && (
        <div className="sheet-mask" onClick={() => setShowBinaural(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.binauralBeats')}</h4>
            {binauralOptions.map((b) => (
              <div key={b.id} className={'opt' + (binaural?.id === b.id ? ' checked' : '')} onClick={() => { setBinaural(b); setShowBinaural(false) }}>
                <div className="left">
                  <div>{lang === 'zh' ? `${localized(b.name, lang)}${t('mixer.wave')}` : `${localized(b.name, lang)} Wave`} · {b.range}</div>
                  <div className="desc">{localized(b.desc, lang)}</div>
                </div>
              </div>
            ))}
            <div className="opt" onClick={() => { setBinaural(null); setShowBinaural(false) }}>
              <div className="left"><div>{t('mixer.none')}</div></div>
            </div>
          </div>
        </div>
      )}

      {showSave && (
        <div className="modal-mask" onClick={() => { setShowSave(false); setPendingStart(false) }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.saveMixPreset')}</h4>
            <p>{t('mixer.presetNamePrompt')}</p>
            <input
              className="field"
              style={{ width: '100%', height: 42, border: 'none', borderBottom: '1px solid var(--line-strong)', fontSize: 16, marginBottom: 18 }}
              maxLength={20}
              placeholder={t('mixer.presetNamePlaceholder')}
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => { setShowSave(false); setPendingStart(false) }}>{t('mixer.cancel')}</button>
              <button className="btn" onClick={handleSave}>{t('mixer.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 重名覆盖确认 */}
      {showOverwrite && (
        <div className="modal-mask" onClick={() => setShowOverwrite(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.nameExists')}</h4>
            <p>{t('mixer.nameExistsDesc', { name: presetName.trim() })}</p>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: 8 }}>
              <button className="btn block" onClick={doSave}>{t('mixer.overwrite')}</button>
              <button className="btn ghost block" onClick={() => { setShowOverwrite(false); setShowSave(true) }}>{t('mixer.rename')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 未保存配置提示 */}
      {showUnsaved && (
        <div className="modal-mask" onClick={() => setShowUnsaved(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.unsavedChanges')}</h4>
            <p>{t('mixer.unsavedDesc')}</p>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: 8 }}>
              <button className="btn block" onClick={() => { setShowUnsaved(false); setShowSave(true); setPendingStart(true) }}>{t('mixer.saveAndStart')}</button>
              <button className="btn ghost block" onClick={() => { setShowUnsaved(false); doStart() }}>{t('mixer.justStart')}</button>
              <button className="btn ghost block" onClick={() => setShowUnsaved(false)}>{t('mixer.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
