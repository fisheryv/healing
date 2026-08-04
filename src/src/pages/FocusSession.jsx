import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Suminagashi, INKS, INK_KEYS } from '../suminagashi'
import { useApp } from '../store.jsx'
import { loadMix, fadeOut, startAnalysis, stopAnalysis, stopAll, resumeContext, getAnalysisData } from '../audioEngine'
import { buildSrcMap, pickQuote } from '../data'

// ── 画笔随机游走状态 ──
function createBrush() {
  const a0 = Math.random() * Math.PI * 2
  return {
    x: 0.5,
    y: 0.5,
    px: 0.5,        // 上一帧位置（用于子步插值）
    py: 0.5,
    angle: a0,      // 当前方向（平滑后）
    targetAngle: a0, // 目标方向（缓慢漂移）
    smoothAmp: 0.1,  // 振幅低通滤波
    // 颜色相位：0~1 循环穿过 4 种墨色
    colorPhase: Math.random(),
  }
}

/** 将角度差归一化到 [-π, π] */
function wrapAngle(d) {
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

/** 根据相位在 4 种墨色之间平滑插值，返回 {r,g,b} 对象 */
function inkColorAt(phase) {
  const n = INK_KEYS.length
  const p = ((phase % 1) + 1) % 1
  const scaled = p * n
  const i = Math.floor(scaled)
  const f = scaled - i
  const a = INKS[INK_KEYS[i % n]]
  const b = INKS[INK_KEYS[(i + 1) % n]]
  return {
    r: a.r + (b.r - a.r) * f,
    g: a.g + (b.g - a.g) * f,
    b: a.b + (b.b - a.b) * f,
  }
}

export default function FocusSession() {
  const navigate = useNavigate()
  const location = useLocation()
  const { recentQuotes, recordQuote, addArtwork } = useApp()

  // 从 FocusConfig 传入的导航 state
  const { duration = 25, mix = null } = location.state || {}
  const durationSec = duration // Demo: 1秒 = 1分钟

  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const rafRef = useRef(null)
  const startTimeRef = useRef(0)
  const [phase, setPhase] = useState('countdown')
  const [countdown, setCountdown] = useState(3)
  const [quote, setQuote] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // 倒计时阶段
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setPhase('drawing')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  // 绘制阶段：初始化水墨引擎 + 加载音乐 + 运行动画循环
  useEffect(() => {
    if (phase !== 'drawing') return
    if (!canvasRef.current) return

    startTimeRef.current = Date.now()

    // 加载并播放音乐混音
    resumeContext()
    const srcMap = buildSrcMap()
    loadMix(mix, srcMap)
    startAnalysis()

    // 初始化水墨引擎
    const engine = new Suminagashi(canvasRef.current)
    engineRef.current = engine

    // 画笔
    const brush = createBrush()
    let stepCount = 0
    let lastT = performance.now()
    const colorDrift = 0.00012 // 每毫秒颜色相位增量
    let beatCooldown = 0

    // 种子墨滴：开局落 3 滴不同色
    engine.dropInk(0.38, 0.58, INKS.sumi, 0.75)
    setTimeout(() => engine.dropInk(0.62, 0.42, INKS.ai, 0.6), 300)
    setTimeout(() => engine.dropInk(0.5, 0.5, INKS.shu, 0.5), 600)

    const frame = (now) => {
      rafRef.current = requestAnimationFrame(frame)
      let dt = (now - lastT) / 1000
      lastT = now
      dt = Math.min(dt, 1 / 30)
      if (dt <= 0) return

      // ── 读取音频分析数据 ──
      const { amplitude: amp, centroid, flux } = getAnalysisData()

      // ── 振幅低通滤波，避免速度抖动 ──
      brush.smoothAmp = brush.smoothAmp * 0.9 + amp * 0.1

      // ── 目标方向缓慢漂移（小幅度随机 + 频谱质心影响） ──
      brush.targetAngle += (Math.random() - 0.5) * 0.06 + (centroid - 0.3) * 0.015

      // ── 软边界：靠近边缘时，目标方向强制转向中心 ──
      const distEdge = Math.min(brush.x, brush.y, 1 - brush.x, 1 - brush.y)
      const edgeZone = 0.22
      if (distEdge < edgeZone) {
        const pull = Math.pow((edgeZone - distEdge) / edgeZone, 1.5) // 越近边缘越强（指数增长）
        const centerAngle = Math.atan2(0.5 - brush.y, 0.5 - brush.x)
        brush.targetAngle += wrapAngle(centerAngle - brush.targetAngle) * pull * 0.25
      }

      // ── 当前方向平滑追踪目标方向（低通滤波，消除抖动） ──
      brush.angle += wrapAngle(brush.targetAngle - brush.angle) * 0.08

      // ── 平滑速度 ──
      const speed = 0.0022 + brush.smoothAmp * 0.008

      // 记录上一帧位置
      brush.px = brush.x
      brush.py = brush.y

      // 移动
      brush.x += Math.cos(brush.angle) * speed
      brush.y += Math.sin(brush.angle) * speed

      // 硬钳制到安全范围（0.08~0.92），防止画笔跑出屏幕
      brush.x = Math.max(0.08, Math.min(0.92, brush.x))
      brush.y = Math.max(0.08, Math.min(0.92, brush.y))

      // 颜色随时间循环漂移
      brush.colorPhase += colorDrift * dt * 1000 + centroid * 0.0006
      const color = inkColorAt(brush.colorPhase)

      // ── 连续墨迹：在上一帧位置到当前位置之间插值 deposition，避免快速移动时断笔 ──
      const dirX = Math.cos(brush.angle)
      const dirY = Math.sin(brush.angle)
      const moveDist = Math.hypot(brush.x - brush.px, brush.y - brush.py)
      const subSteps = Math.max(1, Math.ceil(moveDist / 0.0035))
      const strength = 0.1 + brush.smoothAmp * 0.35
      for (let i = 1; i <= subSteps; i++) {
        const t = i / subSteps
        const sx = brush.px + (brush.x - brush.px) * t
        const sy = brush.py + (brush.y - brush.py) * t
        engine.strokeInk(sx, sy, color, strength, dirX, dirY, 0.75)
      }

      // 节拍触发：频谱通量突增时额外溅墨（保持随机溅墨用于节拍点缀）
      beatCooldown -= dt
      if (flux > 0.06 && beatCooldown <= 0) {
        const bx = brush.x + (Math.random() - 0.5) * 0.1
        const by = brush.y + (Math.random() - 0.5) * 0.1
        engine.dropInk(
          Math.max(0.05, Math.min(0.95, bx)),
          Math.max(0.05, Math.min(0.95, by)),
          color, 0.4 + brush.smoothAmp * 0.4
        )
        beatCooldown = 0.3
      }

      // ── 推进模拟并渲染 ──
      engine.step(dt)
      engine.render(now)

      // ── 进度推进（Demo: 1秒 = 1分钟） ──
      stepCount += dt
      if (stepCount >= durationSec) {
        finishSession(engine)
        return
      }
    }

    rafRef.current = requestAnimationFrame(frame)

    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      stopAnalysis()
      engine.dispose()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // 完成会话
  const finishSession = useCallback((engine) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    stopAnalysis()
    const url = engine ? engine.captureDataURL() : null
    setPreviewUrl(url)
    const q = pickQuote(recentQuotes)
    setQuote(q)
    if (q) recordQuote(q.en)
    fadeOut(2)
    setPhase('reward')
  }, [recentQuotes, recordQuote])

  // 放弃会话 → 保存残卷
  const handleAbandon = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    stopAnalysis()
    const engine = engineRef.current
    const url = engine ? engine.captureDataURL() : null
    const elapsedSec = Math.round((Date.now() - startTimeRef.current) / 1000)
    const elapsedMin = Math.max(1, elapsedSec)
    addArtwork({
      title: `残卷·中断于 ${elapsedMin}min`,
      curveType: 'Suminagashi',
      previewUrl: url,
      status: 'abandoned',
      duration: elapsedMin,
      createdAt: Date.now(),
    })
    fadeOut(0.8)
    stopAll()
    navigate('/gallery')
  }, [addArtwork, navigate])

  // 保存完成的作品
  const handleSave = useCallback(() => {
    addArtwork({
      title: `墨流·${new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`,
      curveType: 'Suminagashi',
      previewUrl,
      status: 'complete',
      duration,
      createdAt: Date.now(),
    })
    stopAll()
    navigate('/gallery')
  }, [addArtwork, previewUrl, duration])

  // 倒计时阶段
  if (phase === 'countdown') {
    return (
      <div className="focus-session suminagashi-session">
        <div className="focus-countdown suminagashi-countdown">
          {countdown > 0 ? countdown : ''}
        </div>
      </div>
    )
  }

  // 绘制阶段
  if (phase === 'drawing') {
    return (
      <div className="focus-session suminagashi-session">
        <canvas ref={canvasRef} />
        <button className="focus-abandon" onClick={handleAbandon}>放弃</button>
        {mix?.binaural && (
          <div className="focus-headphone">建议佩戴耳机</div>
        )}
      </div>
    )
  }

  // 奖励阶段
  if (phase === 'reward') {
    return (
      <div className="reward suminagashi-reward">
        <div className="canvas-area">
          <div className="reward-halo" />
          {previewUrl && <img src={previewUrl} alt="artwork" />}
        </div>
        {quote && (
          <div className="quote visible">
            <div className="en">"{quote.en}"</div>
            <div className="cn">{quote.cn}</div>
          </div>
        )}
        <div className="reward-actions">
          <button className="btn reward-save-btn" onClick={handleSave}>保存</button>
        </div>
      </div>
    )
  }

  return null
}
