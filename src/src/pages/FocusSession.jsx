import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { pickCurve, pickQuote } from '../data.js'

function drawCurve(ctx, type, t, params) {
  const { a, b, delta, k, R, r, d, scale } = params
  let x, y
  switch (type) {
    case 'Lissajous': {
      x = Math.sin(a * t + delta)
      y = Math.sin(b * t)
      break
    }
    case 'Rhodonea': {
      const rho = Math.cos(k * t)
      x = rho * Math.cos(t)
      y = rho * Math.sin(t)
      break
    }
    case 'Hypotrochoid': {
      const diff = R - r
      x = (diff * Math.cos(t) + d * Math.cos((diff / r) * t)) / (R + d)
      y = (diff * Math.sin(t) - d * Math.sin((diff / r) * t)) / (R + d)
      break
    }
    case 'Logarithmic Spiral': {
      const rr = 0.1 * Math.exp(0.15 * t)
      x = rr * Math.cos(t)
      y = rr * Math.sin(t)
      break
    }
    case 'Butterfly': {
      const e = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5)
      x = (Math.sin(t) * e) / 4
      y = (Math.cos(t) * e) / 4
      break
    }
    default:
      x = 0; y = 0
  }
  return { x: x * scale, y: y * scale }
}

export default function FocusSession() {
  const nav = useNavigate()
  const loc = useLocation()
  const { addArtwork } = useApp()
  const duration = loc.state?.duration || 25
  const mix = loc.state?.mix

  const canvasRef = useRef(null)
  const animRef = useRef(0)
  const startRef = useRef(0)
  const pointsRef = useRef([])
  const paramsRef = useRef(null)
  const curveRef = useRef('Lissajous')

  const [countdown, setCountdown] = useState(3)
  const [phase, setPhase] = useState('countdown') // countdown | drawing | reward | abandoned
  const [showAbandonModal, setShowAbandonModal] = useState(false)
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    if (countdown <= 0) {
      setPhase('drawing')
      return
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 800)
    return () => clearTimeout(id)
  }, [countdown])

  useEffect(() => {
    if (phase !== 'drawing' && phase !== 'reward') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    if (phase === 'drawing' && !paramsRef.current) {
      curveRef.current = pickCurve()
      paramsRef.current = {
        a: 2 + Math.floor(Math.random() * 4),
        b: 3 + Math.floor(Math.random() * 4),
        delta: Math.random() * Math.PI,
        k: 2 + Math.floor(Math.random() * 5),
        R: 5,
        r: 1 + Math.floor(Math.random() * 4),
        d: 2 + Math.random() * 3,
        scale: Math.min(rect.width, rect.height) * 0.36
      }
      pointsRef.current = []
      startRef.current = performance.now()
    }

    const totalMs = duration * 1000 // demo: 1 min per minute compressed -> keep real for now
    // For demo, compress 25 min to 25 seconds to show full art:
    const demoTotalMs = duration * 1000

    const cx = rect.width / 2
    const cy = rect.height / 2

    const render = (now) => {
      const elapsed = now - startRef.current
      const progress = Math.min(1, elapsed / demoTotalMs)
      const tMax = curveRef.current === 'Logarithmic Spiral' ? 30 : Math.PI * 8
      const t = progress * tMax

      const breathing = 1 + 0.06 * Math.sin(now * 0.002)
      const params = { ...paramsRef.current, scale: paramsRef.current.scale * breathing }
      const { x, y } = drawCurve(ctx, curveRef.current, t, params)
      pointsRef.current.push({ x: cx + x, y: cy + y })

      ctx.fillStyle = '#0c0c0c'
      ctx.fillRect(0, 0, rect.width, rect.height)

      ctx.strokeStyle = 'rgba(241, 239, 232, 0.85)'
      ctx.lineWidth = 1.1
      ctx.beginPath()
      const pts = pointsRef.current
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()

      const head = pts[pts.length - 1]
      if (head && phase === 'drawing') {
        const grad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 10)
        grad.addColorStop(0, 'rgba(255,255,255,0.95)')
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(head.x, head.y, 10, 0, Math.PI * 2)
        ctx.fill()
      }

      if (progress >= 1 && phase === 'drawing') {
        cancelAnimationFrame(animRef.current)
        setQuote(pickQuote())
        setPhase('reward')
        return
      }
      animRef.current = requestAnimationFrame(render)
    }
    animRef.current = requestAnimationFrame(render)

    return () => cancelAnimationFrame(animRef.current)
  }, [phase, duration])

  const handleSaveReward = () => {
    addArtwork({
      status: 'complete',
      createdAt: Date.now(),
      duration,
      curveType: curveRef.current,
      mixName: mix?.name || 'Untitled',
      quote
    })
    nav('/gallery', { replace: true })
  }

  const handleConfirmAbandon = () => {
    addArtwork({
      status: 'abandoned',
      createdAt: Date.now(),
      duration,
      curveType: curveRef.current,
      mixName: mix?.name || 'Untitled',
      reason: 'Abandoned by user'
    })
    nav('/gallery', { replace: true })
  }

  return (
    <div className="focus-session">
      <canvas ref={canvasRef} />

      {phase === 'countdown' && (
        <div className="focus-countdown">{countdown > 0 ? countdown : ''}</div>
      )}

      {phase === 'drawing' && (
        <>
          <button className="focus-abandon" onClick={() => setShowAbandonModal(true)}>
            Abandon
          </button>
          {mix?.binaural && <div className="focus-headphone">Best with Headphones</div>}
        </>
      )}

      {phase === 'reward' && quote && (
        <div className="reward">
          <div className="canvas-area">
            {/* keep canvas frozen behind */}
          </div>
          <div className="quote">
            <div className="en">"{quote.en}"</div>
            <div className="cn">{quote.cn}</div>
          </div>
          <div className="save-hint" onClick={handleSaveReward}>
            → Tap to save artwork
          </div>
        </div>
      )}

      {showAbandonModal && (
        <div className="modal-mask">
          <div className="modal">
            <h4>Are you sure to abandon this focus session?</h4>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowAbandonModal(false)}>Continue</button>
              <button className="btn" onClick={handleConfirmAbandon}>Abandon</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
