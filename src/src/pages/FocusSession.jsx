import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Suminagashi, INKS, INK_KEYS } from '../suminagashi'
import { useApp } from '../store.jsx'
import { useScreenDown } from '../useScreenDown'
import { loadMix, fadeOut, startAnalysis, stopAnalysis, stopAll, resumeContext, getAnalysisData } from '../audioEngine'
import { buildSrcMap, pickQuote } from '../data'

// ── 防分心机制常量 ──
const DISTRACT_GRACE = 15       // 放下手机宽限期（秒）
const DISTRACT_COUNTDOWN_START = 15 // 倒计时起始数字

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
  const { recentQuotes, recordQuote, addArtwork, setCurrentMix, settings, lang, t } = useApp()

  // 从 FocusConfig 传入的导航 state
  const { duration = 25, mix = null } = location.state || {}
  const durationSec = duration // Demo: 1秒 = 1分钟

  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const rafRef = useRef(null)
  const startTimeRef = useRef(0)
  // 会话结束后的兜底停止定时器
  const stopGuardRef = useRef(null)
  const [phase, setPhase] = useState('countdown')
  const [countdown, setCountdown] = useState(3)
  const [quote, setQuote] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)

  // ── 防分心机制状态 ──
  const { screenDown } = useScreenDown(settings.screenDown)
  // 是否处于分心状态（拿起/切后台）
  const [distracted, setDistracted] = useState(false)
  // 倒计时剩余秒数
  const [distractCountdown, setDistractCountdown] = useState(DISTRACT_COUNTDOWN_START)
  // 是否已超时（永久半透明）
  const [permanentlyFaded, setPermanentlyFaded] = useState(false)
  // 恢复中（触发 2 秒反向褪色动画）
  const [recovering, setRecovering] = useState(false)
  // 用于绘制循环内读取的分心暂停标志（ref 避免重建帧循环）
  const distractedRef = useRef(false)
  // 分心开始时间戳
  const distractStartRef = useRef(0)
  // 分心倒计时定时器
  const distractTimerRef = useRef(null)

  // 组件卸载时确保停止所有音频（防止离开页面后音效继续播放）
  useEffect(() => {
    return () => {
      stopAll()
      if (stopGuardRef.current) clearTimeout(stopGuardRef.current)
      if (distractTimerRef.current) clearInterval(distractTimerRef.current)
    }
  }, [])

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

  // ── 防分心触发/恢复逻辑 ──
  // 仅在 drawing 阶段且"强制屏幕朝下"开启时生效
  useEffect(() => {
    if (phase !== 'drawing') return
    if (!settings.screenDown) return

    if (!screenDown && !distractedRef.current) {
      // ── 触发分心：线条停止 + 褪色开始 + 15 秒倒计时 ──
      distractedRef.current = true
      setDistracted(true)
      if (!permanentlyFaded) {
        distractStartRef.current = Date.now()
        setDistractCountdown(DISTRACT_COUNTDOWN_START)
        // 启动每秒倒计时
        if (distractTimerRef.current) clearInterval(distractTimerRef.current)
        distractTimerRef.current = setInterval(() => {
          const elapsed = (Date.now() - distractStartRef.current) / 1000
          const remain = Math.max(0, DISTRACT_GRACE - elapsed)
          setDistractCountdown(Math.ceil(remain))
          if (remain <= 0) {
            // 超时：永久半透明
            if (distractTimerRef.current) {
              clearInterval(distractTimerRef.current)
              distractTimerRef.current = null
            }
            setPermanentlyFaded(true)
          }
        }, 250) // 250ms 刷新，倒计时更平滑
      }
    } else if (screenDown && distractedRef.current && !permanentlyFaded) {
      // ── 恢复：15 秒内放回 => 褪色反向恢复，线条继续 ──
      distractedRef.current = false
      setDistracted(false)
      if (distractTimerRef.current) {
        clearInterval(distractTimerRef.current)
        distractTimerRef.current = null
      }
      setDistractCountdown(DISTRACT_COUNTDOWN_START)
      // 触发反向褪色恢复动画（2 秒）
      setRecovering(true)
      setTimeout(() => setRecovering(false), 2000)
    }
    // permanentlyFaded 后即使放回也不再恢复清晰度
  }, [screenDown, phase, settings.screenDown, permanentlyFaded])

  // 完成会话
  const finishSession = useCallback((engine) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    stopAnalysis()
    const url = engine ? engine.captureDataURL() : null
    setPreviewUrl(url)
    const q = pickQuote(recentQuotes)
    setQuote(q)
    if (q) recordQuote(q.en)
    // 会话已结束：清掉 store 中的 currentMix，避免下次进入 Mixer 时自动载入本次配置
    setCurrentMix(null)
    // 先平滑淡出（2 秒），并设置兜底定时器确保会话结束后不再有音乐残留
    fadeOut(2)
    if (stopGuardRef.current) clearTimeout(stopGuardRef.current)
    stopGuardRef.current = setTimeout(() => {
      stopGuardRef.current = null
      stopAll()
    }, 3000)
    // PRD: 设备产生短促双震动提示 + 轻柔完成提示音
    try {
      if ('vibrate' in navigator) navigator.vibrate([60, 80, 60])
    } catch (e) { /* noop */ }
    // 轻柔完成提示音（短促的 sine 衰减）
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6)
        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 1.3)
      }
    } catch (e) { /* noop */ }
    setPhase('reward')
  }, [recentQuotes, recordQuote, setCurrentMix])

  // 保存残卷的统一逻辑：interruptReason 区分 'abandoned'（主动放弃）/'distracted'（长时间未放下手机）
  const saveFragment = useCallback((interruptReason) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    stopAnalysis()
    const engine = engineRef.current
    const url = engine ? engine.captureDataURL() : null
    const elapsedSec = Math.round((Date.now() - startTimeRef.current) / 1000)
    const elapsedMin = Math.max(1, elapsedSec)
    const reasonLabel = interruptReason === 'distracted' ? t('focusSession.fragmentDistracted') : t('focusSession.fragmentAbandoned')
    addArtwork({
      title: `${reasonLabel} ${t('focusSession.atMin')} ${elapsedMin}`,
      curveType: 'Suminagashi',
      previewUrl: url,
      status: 'abandoned',
      interruptReason, // 'abandoned' | 'distracted'
      duration: elapsedMin,
      elapsedMin,
      mixName: mix?.name || '',
      createdAt: Date.now(),
    })
    setCurrentMix(null)
    return url
  }, [addArtwork, mix, setCurrentMix, t])

  // ── 长时间未放下手机 → 自动保存残卷并退出 ──
  // permanentlyFaded 由倒计时归零触发；此处只处理一次残卷保存与跳转
  const savedByDistractRef = useRef(false)
  useEffect(() => {
    if (!permanentlyFaded) return
    if (savedByDistractRef.current) return
    savedByDistractRef.current = true
    saveFragment('distracted')
    fadeOut(0.8)
    stopAll()
    navigate('/gallery')
  }, [permanentlyFaded, saveFragment, navigate])

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

      // ── 防分心：分心时画笔停止移动、不溅墨，但渲染继续（用于褪色过渡） ──
      const isDistracted = distractedRef.current

      // ── 读取音频分析数据 ──
      const { amplitude: amp, centroid, flux } = getAnalysisData()

      // ── 振幅低通滤波，避免速度抖动 ──
      brush.smoothAmp = brush.smoothAmp * 0.9 + amp * 0.1

      if (!isDistracted) {
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
      }

      // ── 推进模拟并渲染（分心时仍渲染，便于褪色过渡呈现） ──
      engine.step(dt)
      engine.render(now)

      // ── 进度推进（Demo: 1秒 = 1分钟） ──
      stepCount += dt
      // 兜底：同时用墙钟判断，避免 raf 被限流/暂停导致 stepCount 累加不足
      const wallElapsed = (Date.now() - startTimeRef.current) / 1000
      if (stepCount >= durationSec || wallElapsed >= durationSec) {
        try {
          finishSession(engine)
        } catch (e) {
          // 即使 finishSession 抛异常（例如 WebGL 截图失败），也要保证会话能进入 reward 阶段，
          // 否则 session 会卡在 drawing 阶段无法结束
          console.error('[FocusSession] finishSession failed:', e)
          if (rafRef.current) cancelAnimationFrame(rafRef.current)
          stopAnalysis()
          try { setPreviewUrl(engine ? engine.captureDataURL() : null) } catch (e2) { setPreviewUrl(null) }
          setCurrentMix(null)
          fadeOut(2)
          if (stopGuardRef.current) clearTimeout(stopGuardRef.current)
          stopGuardRef.current = setTimeout(() => {
            stopGuardRef.current = null
            stopAll()
          }, 3000)
          setPhase('reward')
        }
        return
      }
    }

    // ── 兜底定时器：切后台时 requestAnimationFrame 会被浏览器暂停，
    //    导致 frame 循环里的进度判断无法触发。用 setInterval + 墙钟
    //    确保会话能按时结束（即使被限流，切回前台时也会立即触发）。
    const finishGuard = setInterval(() => {
      const wallElapsed = (Date.now() - startTimeRef.current) / 1000
      if (wallElapsed >= durationSec) {
        clearInterval(finishGuard)
        try {
          finishSession(engineRef.current)
        } catch (e) {
          console.error('[FocusSession] finishGuard failed:', e)
          setPhase('reward')
        }
      }
    }, 250)

    rafRef.current = requestAnimationFrame(frame)

    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(finishGuard)
      window.removeEventListener('resize', onResize)
      stopAnalysis()
      engine.dispose()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // 放弃会话 → 保存残卷（主动放弃）
  const handleAbandon = useCallback(() => {
    saveFragment('abandoned')
    fadeOut(0.8)
    stopAll()
    navigate('/gallery')
  }, [saveFragment, navigate])

  // 保存完成的作品
  const handleSave = useCallback(() => {
    addArtwork({
      title: `${t('focusSession.inkFlow')} · ${new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}`,
      curveType: 'Suminagashi',
      previewUrl,
      status: 'complete',
      duration,
      mixName: mix?.name || '',
      quote,
      createdAt: Date.now(),
    })
    // 完成保存后清掉 currentMix，避免下次进入 Mixer 时自动载入本次配置
    setCurrentMix(null)
    stopAll()
    navigate('/gallery')
  }, [addArtwork, previewUrl, duration, mix, setCurrentMix, quote, lang, t])

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
    // 防分心褪色状态：分心时褪色，超时后维持半透明
    const fadeClass = (distracted || permanentlyFaded) ? ' faded' : ''
    const recoverClass = recovering ? ' recovering' : ''
    const showDistractOverlay = distracted && !permanentlyFaded

    return (
      <div className={'focus-session suminagashi-session' + fadeClass + recoverClass}>
        <canvas ref={canvasRef} />
        <button className="focus-abandon" onClick={() => setShowAbandonConfirm(true)}>{t('focusSession.abandonBtn')}</button>
        {mix?.binaural && (
          <div className="focus-headphone">{t('focusSession.bestWithHeadphones')}</div>
        )}
        {showDistractOverlay && (
          <div className="distract-overlay">
            <div className="distract-hint">{t('focusSession.putDownPhone')}</div>
            <div className="distract-countdown">{distractCountdown}s</div>
          </div>
        )}
        {permanentlyFaded && (
          <div className="distract-overlay permanent">
            <div className="distract-hint">{t('focusSession.focusInterrupted')}</div>
          </div>
        )}
        {showAbandonConfirm && (
          <div className="modal-mask" onClick={() => setShowAbandonConfirm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h4>{t('focusSession.abandonTitle')}</h4>
              <p>{t('focusSession.abandonConfirm')}</p>
              <div className="modal-actions">
                <button className="btn ghost" onClick={() => setShowAbandonConfirm(false)}>{t('focusSession.continueFocus')}</button>
                <button className="btn" style={{ background: '#9a4a4a', borderColor: '#9a4a4a' }} onClick={handleAbandon}>{t('focusSession.abandon')}</button>
              </div>
            </div>
          </div>
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
            <div className={lang === 'zh' ? 'cn' : 'en'}>"{lang === 'zh' ? quote.cn : quote.en}"</div>
            <div className={lang === 'zh' ? 'en' : 'cn'} style={{ opacity: 0.6 }}>{lang === 'zh' ? quote.en : quote.cn}</div>
          </div>
        )}
        <div className="reward-actions">
          <button className="btn reward-save-btn" onClick={handleSave}>{t('focusSession.save')}</button>
        </div>
      </div>
    )
  }

  return null
}
