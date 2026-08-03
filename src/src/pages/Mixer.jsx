import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { officialMusic, noiseOptions, atmosOptions, binauralOptions, findMusicById } from '../data.js'
import * as audioEngine from '../audioEngine.js'

export default function Mixer() {
  const nav = useNavigate()
  const { savePreset, setCurrentMix, isPresetNameExist, currentMix } = useApp()

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

  // 标记配置是否有改动（用于判断"未保存"）
  const [dirty, setDirty] = useState(false)

  const flashToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1500)
  }

  // 进入页面：启动分析
  useEffect(() => {
    audioEngine.startAnalysis()
    return () => {
      audioEngine.stopPreview()
      audioEngine.stopAll()
      audioEngine.stopAnalysis()
    }
  }, [])

  // 从 currentMix 载入配置（从 FocusConfig 返回时）
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
      audioEngine.previewTrack('binaural', binaural.src, biMuted ? 0 : biVol / 100)
      setDirty(true)
    } else {
      audioEngine.stopPreview('binaural')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binaural])

  useEffect(() => {
    if (binaural) {
      audioEngine.setTrackVolume('binaural', biMuted ? 0 : biVol / 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biVol, biMuted])

  const buildMix = () => ({
    name: presetName.trim() || 'Untitled',
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
    flashToast('Preset saved ✓')
  }

  const handleStart = () => {
    if (!main) {
      flashToast('Please select a main music.')
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

  // 主音乐搜索过滤
  const filteredMusic = officialMusic.filter((m) =>
    m.name.toLowerCase().includes(mainSearch.toLowerCase()) ||
    m.tag.toLowerCase().includes(mainSearch.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100% - 0px)' }}>
      <div className="page-pad" style={{ paddingBottom: 0 }}>
        <h1 className="page-title cn">Mix Space</h1>
      </div>

      <div className="track">
        <div className="head">
          <span className="label">Main Music</span>
          <span className={'mute' + (mainMuted ? ' active' : '')} onClick={handleMuteMain}>Mute</span>
        </div>
        <div className="body" onClick={() => handleOpenSheet('main')}>
          {main ? main.name : <span className="placeholder">Select a main music.</span>}
        </div>
        {main && <div className="desc">{main.tag} · {main.duration}</div>}
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
          <span className="label">Noise & Ambience</span>
          <span className={'mute' + (bgMuted ? ' active' : '')} onClick={handleMuteBg}>Mute</span>
        </div>
        <div className="body" onClick={() => handleOpenSheet('noise')}>
          {bgNoise || atmos.length > 0 ? (
            <>
              {bgNoise?.name || 'No background noise'}
              {atmos.length > 0 ? ' · ' + atmos.map((a) => a.name).join(' · ') : ''}
            </>
          ) : (
            <span className="placeholder">Select noise / ambient.</span>
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
            <span className="atmos-name">{a.name}</span>
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
          <span className="label">Binaural Beats</span>
          <span className={'mute' + (biMuted ? ' active' : '')} onClick={handleMuteBi}>Mute</span>
        </div>
        <div className="body" onClick={() => handleOpenSheet('binaural')}>
          {binaural ? `${binaural.name} Wave` : <span className="placeholder">Select a binaural beat.</span>}
        </div>
        {binaural && <div className="desc">{binaural.range} — Headphones recommended</div>}
        {binaural && (
          <div className="slider">
            <span>VOL</span>
            <input type="range" min={0} max={100} value={biVol} onChange={(e) => setBiVol(+e.target.value)} />
            <span className="val">{biVol}</span>
          </div>
        )}
      </div>

      <div className="mixer-actions">
        <button className="btn ghost" onClick={() => setShowSave(true)}>Save</button>
        <button className="btn" onClick={handleStart}>Begin Focus</button>
      </div>

      {showMain && (
        <div className="sheet-mask" onClick={() => setShowMain(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>Select Main Music</h4>
            <div className="search" style={{ margin: '0 0 14px' }}>
              <input
                type="text"
                placeholder="Search music..."
                value={mainSearch}
                onChange={(e) => setMainSearch(e.target.value)}
              />
            </div>
            {filteredMusic.map((m) => (
              <div key={m.id} className={'opt' + (main?.id === m.id ? ' checked' : '')} onClick={() => { setMain(m); setShowMain(false); setMainSearch('') }}>
                <div className="left">
                  <div>{m.name}</div>
                  <div className="desc">{m.tag} · {m.duration}</div>
                </div>
              </div>
            ))}
            {filteredMusic.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '20px 0', fontSize: 13 }}>
                No music found
              </div>
            )}
          </div>
        </div>
      )}

      {showNoise && (
        <div className="sheet-mask" onClick={() => setShowNoise(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>Background Noise</h4>
            <div className="grid-opt">
              {[...noiseOptions.pure, ...noiseOptions.ambient].map((n) => (
                <div
                  key={n.id}
                  className={'pill' + (bgNoise?.id === n.id ? ' checked' : '')}
                  onClick={() => setBgNoise(bgNoise?.id === n.id ? null : n)}
                >
                  {n.name}
                </div>
              ))}
            </div>
            <h4 style={{ marginTop: 22 }}>Atmosphere (已选 {atmos.length} / 2)</h4>
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
                    {a.name}
                  </div>
                )
              })}
            </div>
            <button className="btn block" style={{ marginTop: 22 }} onClick={() => setShowNoise(false)}>Done</button>
          </div>
        </div>
      )}

      {showBinaural && (
        <div className="sheet-mask" onClick={() => setShowBinaural(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>Binaural Beats</h4>
            {binauralOptions.map((b) => (
              <div key={b.id} className={'opt' + (binaural?.id === b.id ? ' checked' : '')} onClick={() => { setBinaural(b); setShowBinaural(false) }}>
                <div className="left">
                  <div>{b.name} 波 · {b.range}</div>
                  <div className="desc">{b.desc}</div>
                </div>
              </div>
            ))}
            <div className="opt" onClick={() => { setBinaural(null); setShowBinaural(false) }}>
              <div className="left"><div>暂不使用</div></div>
            </div>
          </div>
        </div>
      )}

      {showSave && (
        <div className="modal-mask" onClick={() => setShowSave(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>Save Mix Preset</h4>
            <p>Give your preset a name.</p>
            <input
              className="field"
              style={{ width: '100%', height: 42, border: 'none', borderBottom: '1px solid var(--line-strong)', fontSize: 16, marginBottom: 18 }}
              maxLength={20}
              placeholder="e.g. Afternoon Reading"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowSave(false)}>Cancel</button>
              <button className="btn" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* 重名覆盖确认 */}
      {showOverwrite && (
        <div className="modal-mask" onClick={() => setShowOverwrite(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>Name Already Exists</h4>
            <p>A preset named "{presetName.trim()}" already exists. Do you want to overwrite it or rename?</p>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: 8 }}>
              <button className="btn block" onClick={doSave}>Overwrite</button>
              <button className="btn ghost block" onClick={() => { setShowOverwrite(false); setShowSave(true) }}>Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* 未保存配置提示 */}
      {showUnsaved && (
        <div className="modal-mask" onClick={() => setShowUnsaved(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>Unsaved Changes</h4>
            <p>Your current mix configuration has unsaved changes. What would you like to do?</p>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: 8 }}>
              <button className="btn block" onClick={() => { setShowUnsaved(false); setShowSave(true) }}>Save & Start</button>
              <button className="btn ghost block" onClick={() => { setShowUnsaved(false); doStart() }}>Start Without Saving</button>
              <button className="btn ghost block" onClick={() => setShowUnsaved(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
