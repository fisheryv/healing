import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../store.jsx'

export default function Gallery() {
  const { artworks, deleteArtwork } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const [filter, setFilter] = useState('all')
  const [actionMenu, setActionMenu] = useState(null) // { art }
  const [highlightId, setHighlightId] = useState(null)
  const highlightRef = useRef(null)

  // 从 FocusSession 跳转来时高亮定位
  useEffect(() => {
    if (loc.state?.highlightId) {
      setHighlightId(loc.state.highlightId)
      // 滚动到该元素
      setTimeout(() => {
        if (highlightRef.current) {
          highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
      // 3 秒后取消高亮
      const timer = setTimeout(() => setHighlightId(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [loc.state])

  const filtered = artworks.filter((a) => {
    if (filter === 'complete') return a.status === 'complete'
    if (filter === 'partial') return a.status !== 'complete'
    return true
  })

  // 长按处理
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)

  const handleTouchStart = (art) => {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      setActionMenu({ art })
      // 震动反馈
      if (navigator.vibrate) navigator.vibrate(30)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleClick = (art) => {
    // 如果是长按触发的，不跳转
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }
    nav(`/artwork/${art.id}`)
  }

  const handleDelete = () => {
    if (actionMenu?.art) {
      deleteArtwork(actionMenu.art.id)
    }
    setActionMenu(null)
  }

  const handleViewDetail = () => {
    if (actionMenu?.art) {
      const artId = actionMenu.art.id
      setActionMenu(null)
      nav(`/artwork/${artId}`)
    }
  }

  return (
    <div>
      <div className="page-pad" style={{ paddingBottom: 0 }}>
        <h1 className="page-title cn">Gallery</h1>
      </div>

      <div className="tab-bar">
        <div className={'tab-item' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>All</div>
        <div className={'tab-item' + (filter === 'complete' ? ' active' : '')} onClick={() => setFilter('complete')}>Complete</div>
        <div className={'tab-item' + (filter === 'partial' ? ' active' : '')} onClick={() => setFilter('partial')}>Incomplete</div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="icon" />
          <p>Begin your first focus<br/>Generate your first artwork</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {filtered.map((a) => (
            <div
              key={a.id}
              ref={a.id === highlightId ? highlightRef : null}
              className={'gallery-item' + (a.status !== 'complete' ? ' partial' : '') + (a.id === highlightId ? ' highlight' : '')}
              onTouchStart={() => handleTouchStart(a)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
              onMouseDown={() => handleTouchStart(a)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onClick={() => handleClick(a)}
              style={{ cursor: 'pointer' }}
            >
              {a.previewUrl ? (
                <img src={a.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <ArtworkPreview seed={a.id} curve={a.curveType} params={a.params} hue={a.hue} />
              )}
              {a.status !== 'complete' && (
                <div className="partial-tag">
                  残卷·中断于{a.elapsedMin || 1}min
                </div>
              )}
              <div className="footer">
                {new Date(a.createdAt).toISOString().slice(0, 10).replace(/-/g, '.')} · {a.duration} min
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 长按操作菜单 */}
      {actionMenu && (
        <div className="modal-mask" onClick={() => setActionMenu(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>{actionMenu.art.status === 'complete' ? 'Artwork' : 'Incomplete Artwork'}</h4>
            <p>{new Date(actionMenu.art.createdAt).toISOString().slice(0, 10).replace(/-/g, '.')} · {actionMenu.art.duration} min</p>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: 8 }}>
              <button className="btn block" onClick={handleViewDetail}>View Detail</button>
              <button className="btn ghost block" style={{ color: '#9a4a4a', borderColor: '#9a4a4a' }} onClick={handleDelete}>Delete</button>
              <button className="btn ghost block" onClick={() => setActionMenu(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ArtworkPreview({ seed, curve, params, hue }) {
  const path = makePath(seed, curve, params)
  const strokeColor = hue != null
    ? hslToRgba(hue, 0.35, 0.78, 0.85)
    : '#f1efe8'
  return (
    <svg viewBox="-1.2 -1.2 2.4 2.4" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', background: '#0c0c0c' }}>
      <path d={path} stroke={strokeColor} strokeWidth="0.012" fill="none" />
    </svg>
  )
}

function hslToRgba(h, s, l, a) {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r, g, b
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return `rgba(${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)},${a})`
}

function makePath(seed, curve, savedParams) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const rnd = () => {
    h = (h * 1664525 + 1013904223) >>> 0
    return (h / 0xffffffff)
  }
  const a = savedParams?.a ?? (2 + Math.floor(rnd() * 4))
  const b = savedParams?.b ?? (3 + Math.floor(rnd() * 4))
  const delta = savedParams?.delta ?? (rnd() * Math.PI)
  const k = savedParams?.k ?? (2 + Math.floor(rnd() * 5))
  const R = savedParams?.R ?? 5
  const r = savedParams?.r ?? (1 + Math.floor(rnd() * 4))
  const d = savedParams?.d ?? (2 + rnd() * 3)
  const q = savedParams?.q ?? (2 + Math.floor(rnd() * 5))
  const phase2 = savedParams?.phase2 ?? (rnd() * Math.PI)
  const amp1 = savedParams?.amp1 ?? (0.5 + rnd() * 0.5)
  const amp2 = savedParams?.amp2 ?? (0.3 + rnd() * 0.5)
  const freq1 = savedParams?.freq1 ?? (1 + rnd() * 3)
  const freq2 = savedParams?.freq2 ?? (1.5 + rnd() * 4)
  const decay = savedParams?.decay ?? 0.01
  let tMax = Math.PI * 8
  if (curve === 'Logarithmic Spiral') tMax = 40
  else if (curve === 'Fermat Spiral') tMax = 300
  else if (curve === 'Butterfly') tMax = Math.PI * 12

  let pd = ''
  const steps = 800
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tMax
    let x, y
    if (curve === 'Rhodonea') {
      const rho = Math.cos(k * t)
      x = rho * Math.cos(t); y = rho * Math.sin(t)
    } else if (curve === 'Hypotrochoid') {
      const diff = R - r
      x = (diff * Math.cos(t) + d * Math.cos((diff / r) * t)) / (R + d)
      y = (diff * Math.sin(t) - d * Math.sin((diff / r) * t)) / (R + d)
    } else if (curve === 'Logarithmic Spiral') {
      const rr = 0.05 * Math.exp(0.1 * t)
      x = rr * Math.cos(t); y = rr * Math.sin(t)
      if (Math.abs(x) > 1.2 || Math.abs(y) > 1.2) break
    } else if (curve === 'Butterfly') {
      const e = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5)
      x = (Math.sin(t) * e) / 4; y = (Math.cos(t) * e) / 4
    } else if (curve === 'Epicycloid') {
      const rr = (R + r) / r
      const denom = R + r
      x = ((R + r) * Math.cos(t) - r * Math.cos(rr * t)) / denom
      y = ((R + r) * Math.sin(t) - r * Math.sin(rr * t)) / denom
      x = x / 2; y = y / 2
    } else if (curve === 'Harmonograph') {
      const env = Math.exp(-decay * t)
      x = env * (amp1 * Math.sin(freq1 * t + delta) + amp2 * Math.sin(freq2 * t + phase2))
      y = env * (amp1 * Math.sin(freq1 * t + phase2) + amp2 * Math.sin(freq2 * t + delta))
    } else if (curve === 'Spirograph') {
      const r1 = R, r2 = r
      x = (a / 10) * Math.cos(t) + (r1 / 10) * Math.cos((a / r1) * t + delta)
      y = (a / 10) * Math.sin(t) + (r2 / 10) * Math.sin((b / r2) * t + delta)
    } else if (curve === 'Rose Flow') {
      const rho1 = Math.cos(k * t)
      const rho2 = 0.4 * Math.cos(q * t + phase2)
      const rho = rho1 + rho2
      x = rho * Math.cos(t + delta); y = rho * Math.sin(t + delta)
    } else if (curve === 'Fermat Spiral') {
      const golden = 2.39996
      const rr = Math.sqrt(t) * 0.15
      x = rr * Math.cos(golden * t); y = rr * Math.sin(golden * t)
      if (Math.abs(x) > 1.2 || Math.abs(y) > 1.2) break
    } else {
      x = Math.sin(a * t + delta); y = Math.sin(b * t)
    }
    pd += (i === 0 ? 'M' : 'L') + x.toFixed(3) + ' ' + y.toFixed(3) + ' '
  }
  return pd
}
