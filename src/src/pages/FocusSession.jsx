import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { pickCurve, pickQuote, buildSrcMap } from '../data.js'
import * as audioEngine from '../audioEngine.js'

/**
 * 每种曲线类型的参数生成器
 * 参数空间大幅扩展，让图形形态千变万化
 */
function generateParams(type, rect) {
  const baseScale = Math.min(rect.width, rect.height)
  const rand = (min, max) => min + Math.random() * (max - min)
  const randInt = (min, max) => Math.floor(rand(min, max + 1))

  // 通用参数（所有曲线都会用到部分）
  const common = {
    delta: rand(0, Math.PI * 2),
    scale: baseScale * rand(0.28, 0.42),
    // 额外的相位/频率参数，供某些曲线使用
    p: randInt(3, 8),
    q: randInt(2, 7),
    phase2: rand(0, Math.PI * 2),
    amp1: rand(0.5, 1.0),
    amp2: rand(0.3, 0.8),
    freq1: rand(1, 5),
    freq2: rand(1.5, 6),
    decay: rand(0.005, 0.03)
  }

  switch (type) {
    case 'Lissajous': {
      const useInteger = Math.random() < 0.4
      return {
        ...common,
        a: useInteger ? randInt(2, 7) : rand(1.5, 6.5),
        b: useInteger ? randInt(3, 8) : rand(2.5, 7.5)
      }
    }
    case 'Rhodonea': {
      const useInteger = Math.random() < 0.6
      return {
        ...common,
        k: useInteger ? randInt(2, 9) : rand(1.5, 8.5)
      }
    }
    case 'Hypotrochoid': {
      const r = randInt(1, 6)
      const R = randInt(r + 2, r + 12)
      return { ...common, R, r, d: rand(1, R * 0.6) }
    }
    case 'Logarithmic Spiral': {
      return {
        ...common,
        scale: baseScale * rand(0.1, 0.3)
      }
    }
    case 'Butterfly': {
      return {
        ...common,
        scale: baseScale * rand(0.3, 0.4)
      }
    }
    case 'Epicycloid': {
      const r = randInt(1, 6)
      const R = randInt(2, 8)
      return { ...common, R, r }
    }
    case 'Harmonograph': {
      return {
        ...common,
        freq1: rand(1, 4),
        freq2: rand(1.3, 5.5),
        amp1: rand(0.4, 1.0),
        amp2: rand(0.3, 0.9),
        decay: rand(0.003, 0.02),
        phase2: rand(0, Math.PI * 2)
      }
    }
    case 'Spirograph': {
      return {
        ...common,
        a: randInt(3, 10),
        b: randInt(3, 10),
        R: randInt(3, 8),
        r: randInt(2, 6),
        scale: baseScale * rand(0.25, 0.4)
      }
    }
    case 'Rose Flow': {
      return {
        ...common,
        k: randInt(2, 8),
        q: randInt(3, 9)
      }
    }
    case 'Fermat Spiral': {
      return {
        ...common,
        scale: baseScale * rand(0.35, 0.45)
      }
    }
    default:
      return { ...common, a: 3, b: 4 }
  }
}

/**
 * 每种曲线的总参数范围 tMax
 */
function getTMax(type) {
  switch (type) {
    case 'Lissajous': return Math.PI * (6 + Math.random() * 6)
    case 'Rhodonea': return Math.PI * (8 + Math.random() * 8)
    case 'Hypotrochoid': return Math.PI * (10 + Math.random() * 12)
    case 'Logarithmic Spiral': return 30 + Math.random() * 20
    case 'Butterfly': return Math.PI * 12
    case 'Epicycloid': return Math.PI * (8 + Math.random() * 10)
    case 'Harmonograph': return Math.PI * (10 + Math.random() * 8)
    case 'Spirograph': return Math.PI * (8 + Math.random() * 8)
    case 'Rose Flow': return Math.PI * (6 + Math.random() * 8)
    case 'Fermat Spiral': return 200 + Math.random() * 200
    default: return Math.PI * 8
  }
}

function drawCurve(type, t, params) {
  const { a, b, delta, k, R, r, d, scale, q, freq1, freq2, phase2, amp1, amp2, decay } = params
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
    case 'Epicycloid': {
      const rr = (R + r) / r
      const denom = R + r
      x = ((R + r) * Math.cos(t) - r * Math.cos(rr * t)) / denom
      y = ((R + r) * Math.sin(t) - r * Math.sin(rr * t)) / denom
      break
    }
    case 'Harmonograph': {
      const env = Math.exp(-decay * t)
      x = env * (amp1 * Math.sin(freq1 * t + delta) + amp2 * Math.sin(freq2 * t + phase2))
      y = env * (amp1 * Math.sin(freq1 * t + phase2) + amp2 * Math.sin(freq2 * t + delta))
      break
    }
    case 'Spirograph': {
      const r1 = R
      const r2 = r
      x = (a / 10) * Math.cos(t) + (r1 / 10) * Math.cos((a / r1) * t + delta)
      y = (a / 10) * Math.sin(t) + (r2 / 10) * Math.sin((b / r2) * t + delta)
      break
    }
    case 'Rose Flow': {
      const rho1 = Math.cos(k * t)
      const rho2 = 0.4 * Math.cos(q * t + phase2)
      const rho = rho1 + rho2
      x = rho * Math.cos(t + delta)
      y = rho * Math.sin(t + delta)
      break
    }
    case 'Fermat Spiral': {
      const golden = 2.39996
      const rr = Math.sqrt(t) * 0.15
      x = rr * Math.cos(golden * t)
      y = rr * Math.sin(golden * t)
      break
    }
    default:
      x = 0; y = 0
  }
  return { x: x * scale, y: y * scale }
}

/**
 * HSL → RGBA 字符串
 */
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

/**
 * 震动反馈（双震动）
 */
function vibrateDouble() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([60, 80, 120])
  }
}

export default function FocusSession() {
  const nav = useNavigate()
  const loc = useLocation()
  const { addArtwork, recentQuotes, recordQuote, settings } = useApp()
  const duration = loc.state?.duration || 25
  const mix = loc.state?.mix

  const canvasRef = useRef(null)
  const animRef = useRef(0)
  const startRef = useRef(0)
  const pointsRef = useRef([])
  const paramsRef = useRef(null)
  const curveRef = useRef('Lissajous')
  const srcMapRef = useRef(buildSrcMap())
  const audioStartedRef = useRef(false)
  const fadingRef = useRef(false)
  // 每次会话随机选定的色相（低饱和高亮度）
  const hueRef = useRef(40 + Math.random() * 280)
  const rewardStartRef = useRef(0)

  const [countdown, setCountdown] = useState(3)
  const [phase, setPhase] = useState('countdown') // countdown | drawing | reward | abandoned
  const [showAbandonModal, setShowAbandonModal] = useState(false)
  const [quote, setQuote] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [rewardGlow, setRewardGlow] = useState(false)
  const [quoteVisible, setQuoteVisible] = useState(false)

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) {
      setPhase('drawing')
      return
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 800)
    return () => clearTimeout(id)
  }, [countdown])

  // 进入会话时启动音频
  useEffect(() => {
    if (mix && !audioStartedRef.current) {
      audioStartedRef.current = true
      audioEngine.startAnalysis()
      audioEngine.loadMix(mix, srcMapRef.current).catch((e) => {
        console.warn('[FocusSession] loadMix failed:', e)
      })
    }
    return () => {
      audioEngine.stopAnalysis()
      audioEngine.stopAll()
      audioStartedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mix])

  // 完成或放弃时的音频处理
  const handleAudioFinish = useCallback(async (completed) => {
    if (fadingRef.current) return
    fadingRef.current = true
    if (completed) {
      await audioEngine.fadeOut(3)
      audioEngine.playChime()
      // 双震动
      vibrateDouble()
    } else {
      await audioEngine.fadeOut(1)
    }
    audioEngine.stopAnalysis()
  }, [])

  // 绘制主循环
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
      paramsRef.current = generateParams(curveRef.current, rect)
      pointsRef.current = []
      startRef.current = performance.now()
    }

    const demoTotalMs = duration * 1000
    const cx = rect.width / 2
    const cy = rect.height / 2

    const tMax = getTMax(curveRef.current)

    let smoothAmp = 0.5
    let smoothCentroid = 0.5
    let smoothFlux = 0
    let beatPhase = 0

    const render = (now) => {
      const elapsed = now - startRef.current
      const progress = Math.min(1, elapsed / demoTotalMs)
      const t = progress * tMax

      const ad = audioEngine.getAnalysisData()

      smoothAmp += (ad.amplitude - smoothAmp) * 0.15
      smoothCentroid += (ad.centroid - smoothCentroid) * 0.05
      smoothFlux += (ad.flux - smoothFlux) * 0.2

      const breathScale = 1 + (smoothAmp - 0.3) * 0.4
      const breathing = breathScale * (1 + 0.04 * Math.sin(now * 0.002))

      const phaseWarp = (smoothCentroid - 0.5) * 0.6

      beatPhase += smoothFlux * 0.15
      const tWithBeat = t + beatPhase * 0.05

      const params = {
        ...paramsRef.current,
        scale: paramsRef.current.scale * breathing,
        delta: paramsRef.current.delta + phaseWarp
      }
      const { x, y } = drawCurve(curveRef.current, tWithBeat, params)
      pointsRef.current.push({ x: cx + x, y: cy + y })

      ctx.fillStyle = '#0c0c0c'
      ctx.fillRect(0, 0, rect.width, rect.height)

      // 轨迹渐隐：越早的线段越透明（墨水质感）
      const pts = pointsRef.current
      const total = pts.length
      if (total >= 2) {
        ctx.lineWidth = 1.1
        // 分段绘制，每段透明度随 index 递增
        const segments = Math.min(total - 1, 60)
        const step = Math.max(1, Math.floor((total - 1) / segments))
        for (let i = 0; i < total - 1; i += step) {
          const ratio = i / (total - 1)
          // 透明度从 0.08 渐变到 0.85
          const alpha = 0.08 + ratio * 0.77
          ctx.strokeStyle = hslToRgba(hueRef.current, 0.35, 0.78, alpha)
          ctx.beginPath()
          ctx.moveTo(pts[i].x, pts[i].y)
          // 画到下一个分段起点
          const end = Math.min(i + step, total - 1)
          for (let j = i + 1; j <= end; j++) {
            ctx.lineTo(pts[j].x, pts[j].y)
          }
          ctx.stroke()
        }
      }

      // 发光圆点（绘制头）
      const head = pts[pts.length - 1]
      if (head && phase === 'drawing') {
        const haloR = 8 + smoothAmp * 12
        const grad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, haloR)
        grad.addColorStop(0, 'rgba(255,255,255,0.95)')
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(head.x, head.y, haloR, 0, Math.PI * 2)
        ctx.fill()
      }

      if (progress >= 1 && phase === 'drawing') {
        cancelAnimationFrame(animRef.current)
        try {
          setPreviewUrl(canvas.toDataURL('image/png'))
        } catch (e) { /* noop */ }
        // 选取去重后的文学摘录
        const q = pickQuote(recentQuotes)
        setQuote(q)
        recordQuote(q.en)
        setPhase('reward')
        handleAudioFinish(true)
        return
      }
      animRef.current = requestAnimationFrame(render)
    }
    animRef.current = requestAnimationFrame(render)

    return () => cancelAnimationFrame(animRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, duration])

  // reward 阶段：触发呼吸光晕 + 摘录上浮动画
  useEffect(() => {
    if (phase === 'reward') {
      rewardStartRef.current = performance.now()
      // 延迟触发光晕和摘录显示（让画作先定格）
      const glowTimer = setTimeout(() => setRewardGlow(true), 300)
      const quoteTimer = setTimeout(() => setQuoteVisible(true), 1200)
      return () => {
        clearTimeout(glowTimer)
        clearTimeout(quoteTimer)
      }
    }
  }, [phase])

  const handleSaveReward = () => {
    audioEngine.stopAll()
    audioStartedRef.current = false
    const newArt = addArtwork({
      status: 'complete',
      createdAt: Date.now(),
      duration,
      curveType: curveRef.current,
      mixName: mix?.name || 'Untitled',
      quote,
      previewUrl,
      params: paramsRef.current,
      hue: hueRef.current
    })
    // 跳转画廊并定位至该画作
    nav('/gallery', { replace: true, state: { highlightId: newArt.id } })
  }

  const handleConfirmAbandon = async () => {
    setShowAbandonModal(false)
    // 截取当前画布作为残卷预览（半透明保存）
    let abandonedPreview = null
    try {
      if (canvasRef.current) {
        abandonedPreview = canvasRef.current.toDataURL('image/png')
      }
    } catch (e) { /* noop */ }
    audioEngine.stopAll()
    audioStartedRef.current = false
    const elapsed = startRef.current ? Math.round((performance.now() - startRef.current) / 60000) : 0
    const newArt = addArtwork({
      status: 'abandoned',
      createdAt: Date.now(),
      duration,
      elapsedMin: Math.max(1, elapsed),
      curveType: curveRef.current,
      mixName: mix?.name || 'Untitled',
      reason: 'Abandoned by user',
      previewUrl: abandonedPreview,
      params: paramsRef.current,
      hue: hueRef.current
    })
    nav('/gallery', { replace: true, state: { highlightId: newArt.id } })
  }

  // 勿扰设置生效（通过 Notification API）
  useEffect(() => {
    if (settings.dnd && 'Notification' in window && Notification.permission === 'granted') {
      // Web 端无法真正屏蔽系统通知，这里仅作为标记
    }
  }, [settings.dnd])

  // 完成通知
  useEffect(() => {
    if (phase === 'reward' && settings.completeNotice && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('Focus Complete', {
            body: `You completed a ${duration} minute focus session.`,
            silent: true
          })
        } catch (e) { /* noop */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

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

      {phase === 'reward' && (
        <div className={'reward' + (rewardGlow ? ' glow' : '')}>
          <div className="canvas-area">
            {previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
            {rewardGlow && <div className="reward-halo" />}
          </div>
          {quote && (
            <div className={'quote' + (quoteVisible ? ' visible' : '')}>
              <div className="en">"{quote.en}"</div>
              <div className="cn">{quote.cn}</div>
            </div>
          )}
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
