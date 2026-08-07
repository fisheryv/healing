import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { ChevronLeft, Share2, ZoomIn, ZoomOut } from 'lucide-react'

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

export default function ArtworkDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { artworks } = useApp()
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [showShare, setShowShare] = useState(false)
  const [shareToast, setShareToast] = useState('')
  const pinchRef = useRef({ dist: 0, scale: 1 })
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, posX: 0, posY: 0, moved: false })
  const canvasRef = useRef(null)
  const imgRef = useRef(null) // img 元素（用于读取 naturalWidth/naturalHeight）

  const art = artworks.find((a) => a.id === id)

  // 计算 contain 自适应后画作的实际渲染尺寸（scale=1 时）
  // 对于 SVG（无 previewUrl）使用 viewBox 比例
  const getArtRenderSize = () => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return null
    const cw = canvasEl.clientWidth
    const ch = canvasEl.clientHeight
    let aspect = 1 // 画作宽高比（w/h）
    if (art?.previewUrl && imgRef.current && imgRef.current.naturalWidth) {
      aspect = imgRef.current.naturalWidth / imgRef.current.naturalHeight
    } else if (art) {
      // SVG viewBox 是 -1.2 -1.2 2.4 2.4，即正方形
      aspect = 1
    } else {
      return null
    }
    // contain：画作在容器内最大化显示，保持比例
    let w, h
    if (cw / ch > aspect) {
      // 容器更宽，画作高度填满，宽度按比例
      h = ch
      w = ch * aspect
    } else {
      // 容器更高，画作宽度填满，高度按比例
      w = cw
      h = cw / aspect
    }
    return { w, h }
  }

  // 限制拖动范围：画作缩放后不能完全拖出预览区域
  const clampPos = (x, y, s) => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return { x, y }
    const size = getArtRenderSize()
    if (!size) return { x, y }
    const cw = canvasEl.clientWidth
    const ch = canvasEl.clientHeight
    // 画作缩放后的实际尺寸
    const scaledW = size.w * s
    const scaledH = size.h * s
    // 可拖动范围 = (缩放后尺寸 - 容器尺寸) / 2，最小为 0
    const maxX = Math.max(0, (scaledW - cw) / 2)
    const maxY = Math.max(0, (scaledH - ch) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y))
    }
  }

  // 拖动（鼠标）
  const onMouseDown = (e) => {
    if (scale <= 1) return
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y, moved: false }
  }
  const onMouseMove = (e) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true
    setPos(clampPos(dragRef.current.posX + dx, dragRef.current.posY + dy, scale))
  }
  const onMouseUp = () => { dragRef.current.dragging = false }

  // 拖动（触摸单指）
  const onPointerDown = (e) => {
    if (e.touches && e.touches.length !== 1) return
    if (scale <= 1) return
    const t = e.touches ? e.touches[0] : e
    dragRef.current = { dragging: true, startX: t.clientX, startY: t.clientY, posX: pos.x, posY: pos.y, moved: false }
  }
  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return
    if (e.touches && e.touches.length !== 1) return
    const t = e.touches ? e.touches[0] : e
    const dx = t.clientX - dragRef.current.startX
    const dy = t.clientY - dragRef.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true
    if (e.cancelable) e.preventDefault()
    setPos(clampPos(dragRef.current.posX + dx, dragRef.current.posY + dy, scale))
  }
  const onPointerUp = () => { dragRef.current.dragging = false }

  // 缩放变化时重置位置
  const handleZoom = (newScale) => {
    const ns = Math.max(1, Math.min(3, newScale))
    setScale(ns)
    if (ns <= 1.01) setPos({ x: 0, y: 0 })
  }

  // 双指缩放
  useEffect(() => {
    const el = document.querySelector('.artwork-detail-canvas')
    if (!el) return

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        dragRef.current.dragging = false
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        pinchRef.current.dist = Math.hypot(dx, dy)
        pinchRef.current.scale = scale
      }
    }

    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.hypot(dx, dy)
        handleZoom(pinchRef.current.scale * (dist / pinchRef.current.dist))
      }
    }

    const onWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        handleZoom(scale + delta)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('wheel', onWheel)
    }
  }, [scale])

  if (!art) {
    return (
      <div className="artwork-detail">
        <div className="artwork-detail-header">
          <button className="back-btn" onClick={() => nav('/gallery')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        </div>
        <div className="empty" style={{ marginTop: 100 }}>
          <p>Artwork not found</p>
        </div>
      </div>
    )
  }

  const dateStr = new Date(art.createdAt).toISOString().slice(0, 10).replace(/-/g, '.')
  const strokeColor = art.hue != null ? hslToRgba(art.hue, 0.35, 0.78, 0.85) : '#f1efe8'

  const handleShareImage = async () => {
    // 使用 canvas 生成带水印的图片
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1080
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#0c0c0c'
      ctx.fillRect(0, 0, 1080, 1080)

      if (art.previewUrl) {
        const img = new Image()
        img.src = art.previewUrl
        await new Promise((res) => { img.onload = res; img.onerror = res })
        ctx.drawImage(img, 0, 0, 1080, 1080)
      } else {
        // 绘制 SVG 路径
        const path = makePath(art.id, art.curveType, art.params)
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 1.5
        ctx.translate(540, 540)
        ctx.scale(420, 420)
        const pts = path.match(/[ML][\d.-]+ [\d.-]+/g) || []
        ctx.beginPath()
        pts.forEach((p) => {
          const cmd = p[0]
          const [x, y] = p.slice(1).split(' ').map(Number)
          if (cmd === 'M') ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
      }

      // 水印
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = 'rgba(241, 239, 232, 0.4)'
      ctx.font = '20px serif'
      ctx.textAlign = 'right'
      ctx.fillText('Healing', 1050, 1050)

      if (showShare === 'withQuote' && art.quote) {
        ctx.fillStyle = 'rgba(241, 239, 232, 0.8)'
        ctx.font = 'italic 24px serif'
        ctx.textAlign = 'center'
        // 自动换行
        const words = art.quote.en.split(' ')
        let line = ''
        let y = 1000
        for (let i = words.length - 1; i >= 0; i--) {
          const test = words[i] + ' ' + line
          if (ctx.measureText(test).width > 900) {
            ctx.fillText(line, 540, y)
            line = words[i]
            y -= 30
          } else {
            line = test
          }
        }
        ctx.fillText(line, 540, y)
      }

      // 尝试系统分享
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], 'healing-artwork.png', { type: 'image/png' })
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My Healing Artwork',
              text: art.quote ? `"${art.quote.en}"` : ''
            })
            setShareToast('Shared ✓')
          } catch (e) {
            // 用户取消或失败，下载
            downloadImage(canvas)
          }
        } else {
          downloadImage(canvas)
        }
        setTimeout(() => setShareToast(''), 2000)
      })
    } catch (e) {
      console.warn('[share] failed:', e)
      setShareToast('Share failed')
      setTimeout(() => setShareToast(''), 2000)
    }
    setShowShare(null)
  }

  const downloadImage = (canvas) => {
    try {
      const link = document.createElement('a')
      link.download = `healing-${dateStr}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setShareToast('Saved to device ✓')
    } catch (e) {
      setShareToast('Save failed')
    }
  }

  return (
    <div className="artwork-detail">
      <div className="artwork-detail-header">
        <button className="back-btn" onClick={() => nav('/gallery')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        <button className="back-btn" onClick={() => setShowShare('menu')}><Share2 size={20} strokeWidth={1.5} /></button>
      </div>

      <div
        ref={canvasRef}
        className={'artwork-detail-canvas' + (scale > 1 ? ' draggable' : '')}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
        style={{ cursor: scale > 1 ? (dragRef.current.dragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <div className="artwork-detail-canvas-inner" style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, transition: dragRef.current.dragging ? 'none' : 'transform 0.1s' }}>
          {art.previewUrl ? (
            <img ref={imgRef} src={art.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
          ) : (
            <svg viewBox="-1.2 -1.2 2.4 2.4" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', background: '#0c0c0c' }}>
              <path d={makePath(art.id, art.curveType, art.params)} stroke={strokeColor} strokeWidth="0.01" fill="none" />
            </svg>
          )}
        </div>
      </div>

      <div className="artwork-detail-controls">
        <button onClick={() => handleZoom(scale - 0.2)}><ZoomOut size={18} strokeWidth={1.5} /></button>
        <span className="zoom-val">{Math.round(scale * 100)}%</span>
        <button onClick={() => handleZoom(scale + 0.2)}><ZoomIn size={18} strokeWidth={1.5} /></button>
      </div>

      {art.quote && (
        <div className="artwork-detail-quote">
          <div className="en">"{art.quote.en}"</div>
          <div className="cn">{art.quote.cn}</div>
        </div>
      )}

      <div className="artwork-detail-info">
        <div className="info-row">
          <span className="label">Date</span>
          <span className="value">{dateStr}</span>
        </div>
        <div className="info-row">
          <span className="label">Duration</span>
          <span className="value">{art.duration} min</span>
        </div>
        <div className="info-row">
          <span className="label">Curve</span>
          <span className="value">{art.curveType}</span>
        </div>
        <div className="info-row">
          <span className="label">Mix</span>
          <span className="value">{art.mixName || '—'}</span>
        </div>
        <div className="info-row">
          <span className="label">Status</span>
          {art.status === 'complete' ? (
            <span className="value" style={{ color: '#4a7a4a' }}>Complete</span>
          ) : (
            <span className="value" style={{ color: '#9a4a4a' }}>Fragment · {art.interruptReason === 'distracted' ? 'Distracted' : 'Abandoned'} at {art.elapsedMin || 1}min</span>
          )}
        </div>
      </div>

      {/* 分享菜单 */}
      {showShare === 'menu' && (
        <div className="modal-mask" onClick={() => setShowShare(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>Share Artwork</h4>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: 8 }}>
              <button className="btn block" onClick={() => { setShowShare('imageOnly'); handleShareImage() }}>Share Artwork Only</button>
              <button className="btn block" onClick={() => { setShowShare('withQuote'); setTimeout(handleShareImage, 50) }}>Share with Quote</button>
              <button className="btn ghost block" onClick={() => setShowShare(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {shareToast && <div className="toast">{shareToast}</div>}
    </div>
  )
}
