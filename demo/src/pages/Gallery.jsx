import { useState } from 'react'
import { useApp } from '../store.jsx'

export default function Gallery() {
  const { artworks } = useApp()
  const [filter, setFilter] = useState('all')

  const filtered = artworks.filter((a) => {
    if (filter === 'complete') return a.status === 'complete'
    if (filter === 'partial') return a.status !== 'complete'
    return true
  })

  return (
    <div>
      <div className="page-pad" style={{ paddingBottom: 0 }}>
        <h1 className="page-title cn">画廊</h1>
      </div>

      <div className="tab-bar">
        <div className={'tab-item' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>All</div>
        <div className={'tab-item' + (filter === 'complete' ? ' active' : '')} onClick={() => setFilter('complete')}>Complete</div>
        <div className={'tab-item' + (filter === 'partial' ? ' active' : '')} onClick={() => setFilter('partial')}>残卷</div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="icon" />
          <p>完成一次专注，解锁你的第一幅画作</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {filtered.map((a) => (
            <div
              key={a.id}
              className={'gallery-item' + (a.status !== 'complete' ? ' partial' : '')}
            >
              <ArtworkPreview seed={a.id} curve={a.curveType} />
              {a.status !== 'complete' && <div className="partial-tag">残卷</div>}
              <div className="footer">
                {new Date(a.createdAt).toISOString().slice(0, 10).replace(/-/g, '.')} · {a.duration} min
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ArtworkPreview({ seed, curve }) {
  // generate simple deterministic SVG curve preview
  const path = makePath(seed, curve)
  return (
    <svg viewBox="-1.2 -1.2 2.4 2.4" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', background: '#0c0c0c' }}>
      <path d={path} stroke="#f1efe8" strokeWidth="0.012" fill="none" />
    </svg>
  )
}

function makePath(seed, curve) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const rnd = () => {
    h = (h * 1664525 + 1013904223) >>> 0
    return (h / 0xffffffff)
  }
  const a = 2 + Math.floor(rnd() * 4)
  const b = 3 + Math.floor(rnd() * 4)
  const delta = rnd() * Math.PI
  const k = 2 + Math.floor(rnd() * 5)
  let d = ''
  const steps = 700
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 8
    let x, y
    if (curve === 'Rhodonea') {
      const rho = Math.cos(k * t)
      x = rho * Math.cos(t); y = rho * Math.sin(t)
    } else if (curve === 'Logarithmic Spiral') {
      const rr = 0.05 * Math.exp(0.1 * t)
      x = rr * Math.cos(t); y = rr * Math.sin(t)
      if (Math.abs(x) > 1.2 || Math.abs(y) > 1.2) break
    } else if (curve === 'Butterfly') {
      const e = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5)
      x = (Math.sin(t) * e) / 4; y = (Math.cos(t) * e) / 4
    } else {
      x = Math.sin(a * t + delta); y = Math.sin(b * t)
    }
    d += (i === 0 ? 'M' : 'L') + x.toFixed(3) + ' ' + y.toFixed(3) + ' '
  }
  return d
}
