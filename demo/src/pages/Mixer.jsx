import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { officialMusic, noiseOptions, atmosOptions, binauralOptions } from '../data.js'

export default function Mixer() {
  const nav = useNavigate()
  const { savePreset, setCurrentMix } = useApp()

  const [main, setMain] = useState(null)
  const [mainVol, setMainVol] = useState(70)
  const [bgNoise, setBgNoise] = useState(null)
  const [bgVol, setBgVol] = useState(50)
  const [atmos, setAtmos] = useState([])
  const [binaural, setBinaural] = useState(null)
  const [biVol, setBiVol] = useState(30)

  const [showMain, setShowMain] = useState(false)
  const [showNoise, setShowNoise] = useState(false)
  const [showBinaural, setShowBinaural] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [toast, setToast] = useState('')

  const flashToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1500)
  }

  const buildMix = () => ({
    name: presetName.trim() || 'Untitled',
    mainMusicId: main?.id,
    mainMusicTitle: main?.name,
    mainVolume: mainVol / 100,
    bgNoise: bgNoise ? { id: bgNoise.id, name: bgNoise.name } : null,
    bgVolume: bgVol / 100,
    ambient: atmos.map((a) => ({ ...a, volume: 0.5 })),
    binaural: binaural ? { id: binaural.id, name: binaural.name, range: binaural.range } : null,
    binauralVolume: biVol / 100
  })

  const handleSave = () => {
    if (!presetName.trim()) return
    savePreset(buildMix())
    setShowSave(false)
    setPresetName('')
    flashToast('Preset saved ✓')
  }

  const handleStart = () => {
    if (!main) {
      flashToast('Please select a main music.')
      return
    }
    setCurrentMix(buildMix())
    nav('/focus/config')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100% - 0px)' }}>
      <div className="page-pad" style={{ paddingBottom: 0 }}>
        <h1 className="page-title cn">Mix Space</h1>
      </div>

      <div className="track">
        <div className="head">
          <span className="label">Main Music</span>
          <span className="mute">Mute</span>
        </div>
        <div className="body" onClick={() => setShowMain(true)}>
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
          <span className="mute">Mute</span>
        </div>
        <div className="body" onClick={() => setShowNoise(true)}>
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
      </div>

      <div className="track">
        <div className="head">
          <span className="label">Binaural Beats</span>
          <span className="mute">Mute</span>
        </div>
        <div className="body" onClick={() => setShowBinaural(true)}>
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
            {officialMusic.map((m) => (
              <div key={m.id} className={'opt' + (main?.id === m.id ? ' checked' : '')} onClick={() => { setMain(m); setShowMain(false) }}>
                <div className="left">
                  <div>{m.name}</div>
                  <div className="desc">{m.tag} · {m.duration}</div>
                </div>
              </div>
            ))}
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
            <h4 style={{ marginTop: 22 }}>Atmosphere ({atmos.length}/2)</h4>
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
                      if (isChecked) setAtmos(atmos.filter((x) => x.id !== a.id))
                      else setAtmos([...atmos, a])
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
            />
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowSave(false)}>Cancel</button>
              <button className="btn" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
