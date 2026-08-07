/**
 * audioEngine.js — Web Audio API 多轨混音引擎
 *
 * 职责:
 *  - 管理 AudioContext 生命周期（懒创建，用户交互后 resume）
 *  - 加载多轨音频文件（主音乐 + 氛围音）并循环播放
 *  - 实时合成白/粉/褐噪音（BufferSource + 滤波器）
 *  - 实时合成双耳节拍（两个 OscillatorNode 左右声道频率差）
 *  - 每轨 GainNode 控制音量
 *  - AnalyserNode 实时频谱分析，输出振幅/频率/节拍数据
 *  - fadeOut(n) 平滑停止
 *  - playChime() 完成提示音
 */

import { findMusicById, getCarrierFreqFromKey } from './data.js'

// ====== 单例 ======
let ctx = null
let masterGain = null
let analyser = null
let analysing = false

// 每轨引用：{ id, type, node, gain, source, buffer, loop, playing }
const tracks = new Map()

// 噪音合成节点缓存
const noiseNodes = new Map()

// 双耳节拍节点缓存
const binauralNodes = new Map()

// 分析数据缓存
let analyserData = null
let analysisRaf = 0

// 停止令牌：每次 stopAll/loadMix 时递增，异步加载完成后检查令牌是否匹配
let stopToken = 0

// ====== 工具 ======
// 噪音/氛围音的感知响度远高于主音乐，在相同 volume 下会盖过主音乐。
// 对噪音/氛围音轨统一施加缩放因子，使滑块值与实际响度更匹配。
const NOISE_SCALE = 0.25

// 判断某 trackId 是否属于噪音/氛围音轨（需要施加缩放）
function isNoiseTrackId(trackId) {
  return trackId === 'bgNoise' || trackId === 'atmos_0' || trackId === 'atmos_1'
}

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    masterGain = ctx.createGain()
    masterGain.gain.value = 1
    analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8
    masterGain.connect(analyser)
    analyser.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx
}

async function loadBuffer(url) {
  const c = ensureCtx()
  const resp = await fetch(url)
  if (!resp.ok) throw new Error('Failed to load audio: ' + url)
  const arr = await resp.arrayBuffer()
  return await c.decodeAudioData(arr)
}

// ====== 噪音合成 ======
function createNoiseBuffer(type) {
  /**
   * 白噪音：均匀分布
   * 粉噪音：Voss-McCartney 近似（多白噪声叠加）
   * 褐噪音：白噪音 + 低通滤波（6dB/oct 近似）
   */
  const c = ensureCtx()
  const len = c.sampleRate * 4 // 4 秒循环
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)

  if (type === 'white') {
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1
    }
  } else if (type === 'pink') {
    // Voss-McCartney 简化：7 个独立白噪声按 1/f 分布叠加
    const rows = 7
    const bins = new Array(rows).fill(0)
    for (let i = 0; i < len; i++) {
      const idx = (i & (rows - 1))
      for (let r = 0; r < rows; r++) {
        if ((idx & (1 << r)) === 0 || r === rows - 1) {
          bins[r] = Math.random() * 2 - 1
        }
      }
      let s = 0
      for (let r = 0; r < rows; r++) s += bins[r]
      data[i] = s / rows
    }
  } else if (type === 'brown') {
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      data[i] = last * 3.5
    }
  }
  return buf
}

function startNoiseTrack(id, noiseType) {
  const c = ensureCtx()
  // 停掉旧的
  stopNoiseTrack(id)

  const buf = createNoiseBuffer(noiseType)
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true

  const gain = c.createGain()
  gain.gain.value = 0
  src.connect(gain).connect(masterGain)
  src.start()
  noiseNodes.set(id, { src, gain, buf, noiseType })
  return { src, gain }
}

function stopNoiseTrack(id) {
  const n = noiseNodes.get(id)
  if (n) {
    try { n.src.stop() } catch (e) { /* noop */ }
    try { n.src.disconnect() } catch (e) { /* noop */ }
    try { n.gain.disconnect() } catch (e) { /* noop */ }
    noiseNodes.delete(id)
  }
}

// ====== 双耳节拍合成 ======
/**
 * 双耳节拍原理：左耳和右耳分别播放频率相差 beatHz 的纯音，
 * 大脑感知到两频率之差的"节拍"频率。
 * 采用对称分布：左 = baseFreq − beatHz/2, 右 = baseFreq + beatHz/2
 * 载波中心（左右平均）精确等于 baseFreq，便于对齐音乐调性主音。
 * 例如 baseFreq=200, beatHz=10 → 左 195Hz / 右 205Hz，中心 200Hz
 */
function startBinaural(id, baseFreq, beatHz) {
  const c = ensureCtx()
  stopBinaural(id)

  const halfBeat = beatHz / 2
  const merger = c.createChannelMerger(2)
  const leftOsc = c.createOscillator()
  const rightOsc = c.createOscillator()
  const leftGain = c.createGain()
  const rightGain = c.createGain()

  leftOsc.type = 'sine'
  rightOsc.type = 'sine'
  leftOsc.frequency.value = baseFreq - halfBeat
  rightOsc.frequency.value = baseFreq + halfBeat

  leftGain.gain.value = 0.15
  rightGain.gain.value = 0.15

  leftOsc.connect(leftGain)
  rightOsc.connect(rightGain)
  leftGain.connect(merger, 0, 0)
  rightGain.connect(merger, 0, 1)

  const gain = c.createGain()
  gain.gain.value = 0
  merger.connect(gain).connect(masterGain)

  leftOsc.start()
  rightOsc.start()

  binauralNodes.set(id, { leftOsc, rightOsc, leftGain, rightGain, merger, gain })
  return { gain }
}

function stopBinaural(id) {
  const b = binauralNodes.get(id)
  if (b) {
    try { b.leftOsc.stop() } catch (e) { /* noop */ }
    try { b.rightOsc.stop() } catch (e) { /* noop */ }
    try { b.leftOsc.disconnect() } catch (e) { /* noop */ }
    try { b.rightOsc.disconnect() } catch (e) { /* noop */ }
    try { b.leftGain.disconnect() } catch (e) { /* noop */ }
    try { b.rightGain.disconnect() } catch (e) { /* noop */ }
    try { b.merger.disconnect() } catch (e) { /* noop */ }
    try { b.gain.disconnect() } catch (e) { /* noop */ }
    binauralNodes.delete(id)
  }
}

// ====== 文件轨道 ======
async function startFileTrack(id, url, volume, loop = true, myToken = 0) {
  const c = ensureCtx()
  stopFileTrack(id)

  const buf = await loadBuffer(url)
  // 加载完成前如果 stopToken 已变（说明已 stopAll/loadMix 重新开始），放弃这次加载
  if (myToken !== 0 && myToken !== stopToken) return { src: null, gain: null }

  // 噪音/氛围音施加缩放
  const scaled = isNoiseTrackId(id) ? volume * NOISE_SCALE : volume

  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = loop

  const gain = c.createGain()
  gain.gain.value = scaled
  src.connect(gain).connect(masterGain)
  src.start()
  tracks.set(id, { type: 'file', src, gain, buf, url, loop, playing: true })
  return { src, gain }
}

function stopFileTrack(id) {
  const t = tracks.get(id)
  if (t) {
    try { t.src.stop() } catch (e) { /* noop */ }
    try { t.src.disconnect() } catch (e) { /* noop */ }
    try { t.gain.disconnect() } catch (e) { /* noop */ }
    tracks.delete(id)
  }
}

// ====== 公开 API ======

/**
 * 加载一个 mix 配置并开始播放
 * mix 对象结构（来自 store/Mixer.buildMix）：
 *   { mainMusicId, mainVolume, bgNoise:{id,name}, bgVolume,
 *     ambient:[{id,name,volume}], binaural:{id,name,range}, binauralVolume }
 * srcMap: 各 id 对应的 src 路径或合成指令
 *   例如 { m1: 'sound/music/m1.mp3', rain: 'sound/ambient/rain.mp3',
 *         white: { synth: 'noise', type: 'white' },
 *         alpha: { synth: 'binaural', baseFreq: 200, beatHz: 10 } }
 */
export async function loadMix(mix, srcMap) {
  ensureCtx()
  // 先停止所有，并获取本次加载的令牌
  stopAll()
  const myToken = stopToken

  // 恢复 masterGain（stopAll 不再负责重置）；
  // 上一次会话结束时可能调用了 fadeOut，masterGain 已被压到 0。
  const now = ctx.currentTime
  masterGain.gain.cancelScheduledValues(now)
  masterGain.gain.setValueAtTime(1, now)

  if (!mix) return

  // 主音乐
  if (mix.mainMusicId && srcMap[mix.mainMusicId]) {
    try {
      await startFileTrack('main', srcMap[mix.mainMusicId], mix.mainVolume ?? 0.7, true, myToken)
    } catch (e) {
      console.warn('[audioEngine] main music load failed:', e)
    }
  }

  // 背景噪音（纯噪音或氛围音，只选一个）
  if (mix.bgNoise && srcMap[mix.bgNoise.id]) {
    const cfg = srcMap[mix.bgNoise.id]
    if (cfg && cfg.synth === 'noise') {
      startNoiseTrack('bgNoise', cfg.type)
      setTrackVolume('bgNoise', mix.bgVolume ?? 0.5)
    } else if (typeof cfg === 'string') {
      try {
        await startFileTrack('bgNoise', cfg, mix.bgVolume ?? 0.5, true, myToken)
      } catch (e) {
        console.warn('[audioEngine] bg noise load failed:', e)
      }
    }
  }

  // 氛围音（最多2个，叠加）
  if (mix.ambient && mix.ambient.length > 0) {
    mix.ambient.forEach((a, i) => {
      const cfg = srcMap[a.id]
      if (!cfg) return
      if (cfg.synth === 'noise') {
        startNoiseTrack('atmos_' + i, cfg.type)
        setTrackVolume('atmos_' + i, a.volume ?? 0.4)
      } else if (typeof cfg === 'string') {
        startFileTrack('atmos_' + i, cfg, a.volume ?? 0.4, true, myToken).catch((e) => {
          console.warn('[audioEngine] atmos load failed:', e)
        })
      }
    })
  }

  // 双耳节拍
  if (mix.binaural && srcMap[mix.binaural.id]) {
    const cfg = srcMap[mix.binaural.id]
    if (cfg.synth === 'binaural') {
      // 根据主音乐调性计算载波中心频率，使双耳节拍与音乐调性吻合
      let carrierFreq = cfg.baseFreq
      if (mix.mainMusicId) {
        const music = findMusicById(mix.mainMusicId)
        if (music && music.key) {
          const keyFreq = getCarrierFreqFromKey(music.key, music.mode)
          if (keyFreq) carrierFreq = keyFreq
        }
      }
      startBinaural('binaural', carrierFreq, cfg.beatHz)
      setTrackVolume('binaural', mix.binauralVolume ?? 0.3)
    }
  }
}

export function setTrackVolume(trackId, vol) {
  // 噪音/氛围音施加缩放，降低感知响度
  const scaled = isNoiseTrackId(trackId) ? vol * NOISE_SCALE : vol
  // 噪音
  const n = noiseNodes.get(trackId)
  if (n) {
    n.gain.gain.setTargetAtTime(scaled, ctx.currentTime, 0.05)
    return
  }
  // 双耳
  const b = binauralNodes.get(trackId)
  if (b) {
    b.gain.gain.setTargetAtTime(scaled, ctx.currentTime, 0.05)
    return
  }
  // 文件
  const t = tracks.get(trackId)
  if (t) {
    t.gain.gain.setTargetAtTime(scaled, ctx.currentTime, 0.05)
    return
  }
}

export function stopAll() {
  // 递增令牌，使所有正在进行的异步加载在完成后被丢弃
  stopToken++
  // 停止文件轨
  for (const id of Array.from(tracks.keys())) stopFileTrack(id)
  // 停止噪音
  for (const id of Array.from(noiseNodes.keys())) stopNoiseTrack(id)
  // 停止双耳
  for (const id of Array.from(binauralNodes.keys())) stopBinaural(id)
  // 停止分析
  stopAnalysis()
  // 注意：此处不再强制将 masterGain 重置为 1。
  // 因为 stopAll 可能在 fadeOut 淡出过程中被调用（例如会话结束/放弃/保存），
  // 若把 masterGain 设回 1，会让尚未真正停止的异步加载轨道以满音量继续播放，
  // 导致"focus 结束后仍然在播放音乐"。masterGain 的恢复改由 loadMix 负责。
}

/**
 * 平滑淡出并停止所有
 * @param {number} seconds 默认 3 秒
 * @returns {Promise<void>}
 */
export function fadeOut(seconds = 3) {
  return new Promise((resolve) => {
    if (!ctx || !masterGain) {
      stopAll()
      resolve()
      return
    }
    const now = ctx.currentTime
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(masterGain.gain.value, now)
    masterGain.gain.linearRampToValueAtTime(0, now + seconds)
    setTimeout(() => {
      stopAll()
      resolve()
    }, seconds * 1000 + 100)
  })
}

/**
 * 完成提示音：两个短促上行正弦音
 */
export function playChime() {
  const c = ensureCtx()
  const t0 = c.currentTime
  // 第一个音 660Hz
  const o1 = c.createOscillator()
  const g1 = c.createGain()
  o1.type = 'sine'
  o1.frequency.value = 660
  g1.gain.setValueAtTime(0, t0)
  g1.gain.linearRampToValueAtTime(0.25, t0 + 0.02)
  g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5)
  o1.connect(g1).connect(masterGain)
  o1.start(t0)
  o1.stop(t0 + 0.55)

  // 第二个音 880Hz，延迟 0.3 秒
  const o2 = c.createOscillator()
  const g2 = c.createGain()
  o2.type = 'sine'
  o2.frequency.value = 880
  g2.gain.setValueAtTime(0, t0 + 0.3)
  g2.gain.linearRampToValueAtTime(0.25, t0 + 0.32)
  g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9)
  o2.connect(g2).connect(masterGain)
  o2.start(t0 + 0.3)
  o2.stop(t0 + 0.95)
}

// ====== 实时分析 ======
/**
 * 启动分析循环，每帧写入 analysingData
 */
export function startAnalysis() {
  if (!analyser) return
  analysing = true
  analyserData = {
    timeData: new Uint8Array(analyser.fftSize),
    freqData: new Uint8Array(analyser.frequencyBinCount)
  }
  const tick = () => {
    if (!analysing || !analyser) return
    analyser.getByteTimeDomainData(analyserData.timeData)
    analyser.getByteFrequencyData(analyserData.freqData)
    analysisRaf = requestAnimationFrame(tick)
  }
  tick()
}

export function stopAnalysis() {
  analysing = false
  if (analysisRaf) cancelAnimationFrame(analysisRaf)
  analysisRaf = 0
}

/**
 * 获取实时分析数据
 * 返回: { amplitude, centroid, flux }
 *  - amplitude: 振幅 RMS，0~1
 *  - centroid: 频谱质心（归一化到 0~1），代表"亮度"/频率重心
 *  - flux: 频谱通量（节拍/瞬态指示），0~1
 */
export function getAnalysisData() {
  if (!analyserData || !analyser) {
    return { amplitude: 0.5, centroid: 0.5, flux: 0 }
  }

  const td = analyserData.timeData
  const fd = analyserData.freqData

  // 振幅 RMS
  let sumSq = 0
  for (let i = 0; i < td.length; i++) {
    const v = (td[i] - 128) / 128
    sumSq += v * v
  }
  const amplitude = Math.sqrt(sumSq / td.length)

  // 频谱质心
  let sumMag = 0
  let sumWeighted = 0
  for (let i = 0; i < fd.length; i++) {
    const mag = fd[i] / 255
    sumMag += mag
    sumWeighted += mag * i
  }
  const centroid = sumMag > 0 ? sumWeighted / (sumMag * fd.length) : 0.5

  // 频谱通量（与上一帧对比，近似节拍）
  if (!getAnalysisData._prev) getAnalysisData._prev = new Float32Array(fd.length)
  let fluxSum = 0
  for (let i = 0; i < fd.length; i++) {
    const cur = fd[i] / 255
    const prev = getAnalysisData._prev[i]
    const diff = cur - prev
    if (diff > 0) fluxSum += diff
    getAnalysisData._prev[i] = cur
  }
  const flux = Math.min(1, fluxSum / fd.length * 3)

  return { amplitude, centroid, flux }
}

/**
 * 确保 AudioContext 处于运行状态
 * 必须在用户手势的同步调用栈中调用，否则浏览器 autoplay policy 会阻止
 */
export function resumeContext() {
  ensureCtx()
  // 恢复 masterGain，避免上次会话 fadeOut 后残留为 0
  if (masterGain) {
    const now = ctx.currentTime
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(1, now)
  }
}

/**
 * 单轨预览：用于 Mixer 页面选轨道时试听
 * 先停止该 trackId 的旧预览，然后播放新的
 * trackId 作为预览轨道的 id（'main'/'bgNoise'/'binaural'/'atmos_0' 等）
 * 各 trackId 互不影响，可以多轨同时预览
 * @param {string} trackId - 轨道 id
 * @param {object|string} cfg - src 配置（路径或合成指令）
 * @param {number} [volume=0.7] - 音量 0~1
 * @param {object} [opts] - 额外选项
 * @param {string} [opts.musicKey] - 主音音名（如 'C','A','F#'），双耳节拍预览时用于计算载波频率
 * @param {string} [opts.musicMode] - 调式 'major'|'minor'
 */
export async function previewTrack(trackId, cfg, volume = 0.7, opts = {}) {
  // 先停止该 trackId 的旧预览
  stopPreview(trackId)
  ensureCtx()
  if (!cfg) return
  const myToken = stopToken
  if (cfg.synth === 'noise') {
    startNoiseTrack(trackId, cfg.type)
    setTrackVolume(trackId, volume)
  } else if (cfg.synth === 'binaural') {
    // 预览双耳节拍时，若提供了音乐调性，则载波跟随调性
    let carrierFreq = cfg.baseFreq
    if (opts.musicKey) {
      const keyFreq = getCarrierFreqFromKey(opts.musicKey, opts.musicMode)
      if (keyFreq) carrierFreq = keyFreq
    }
    startBinaural(trackId, carrierFreq, cfg.beatHz)
    setTrackVolume(trackId, volume)
  } else if (typeof cfg === 'string') {
    try {
      await startFileTrack(trackId, cfg, volume, true, myToken)
    } catch (e) {
      console.warn('[audioEngine] preview load failed:', e)
    }
  }
}

/**
 * 停止预览轨道
 * 不传 id 则停止所有可能的预览轨道
 */
export function stopPreview(trackId) {
  if (trackId) {
    stopFileTrack(trackId)
    stopNoiseTrack(trackId)
    stopBinaural(trackId)
  } else {
    // 停止所有可能的预览轨道
    const previewIds = ['main', 'bgNoise', 'binaural', 'atmos_0', 'atmos_1']
    previewIds.forEach((id) => {
      stopFileTrack(id)
      stopNoiseTrack(id)
      stopBinaural(id)
    })
  }
}

/**
 * 是否已初始化
 */
export function isActive() {
  return !!ctx && ctx.state === 'running'
}
