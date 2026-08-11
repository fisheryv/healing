/**
 * api.js — PocketBase 后端封装
 *
 * 封装 SDK 实例 + auth / bindings / favorites / presets / artworks 模块。
 *
 * 重要约定：
 *   - 返回结构尽量与旧 localStorage 模拟一致：{ ok: true, ... } 或 { ok: false, error }
 *   - recoveryAnswer 在前端先 SHA-256 哈希后再传给后端
 *   - 旧 token 自动从 localStorage 恢复
 */

import PocketBase from 'pocketbase'
import { noiseOptions, binauralOptions } from './data.js'

// ====== SDK 实例 ======
// dev 环境走相对路径，由 vite proxy 转发到 PocketBase。
// 这样浏览器只请求 vite（同源 5173），不会触发浏览器自身的代理设置，
// 手机/其他设备通过 LAN IP 访问时也不会有 CORS 或代理问题。
// 生产环境用 VITE_PB_URL 显式指定真实后端地址。
function resolvePbUrl() {
  if (import.meta.env.VITE_PB_URL) return import.meta.env.VITE_PB_URL
  // dev：用同源地址（window.location.origin），让 vite proxy 接管。
  // 不能用裸 '/'，否则 SDK 拼出的 URL 会变成 '//api/...' 被当成协议相对路径。
  if (import.meta.env.DEV) {
    return typeof window !== 'undefined'
      ? window.location.origin
      : 'http://127.0.0.1:5173'
  }
  // 兜底
  return typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://127.0.0.1:8090'
}
const PB_URL = resolvePbUrl()
export const pb = new PocketBase(PB_URL)

// 调试：在控制台暴露当前 PB URL，方便排查
if (typeof window !== 'undefined') {
  window.__PB_URL__ = PB_URL
  window.pb = pb
}

// SDK 默认就把 token 存到 localStorage 'pocketbase_auth'
// 浏览器刷新时会自动恢复，PB 自动续期。

// ====== 工具 ======

/** 把 PB user record 映射成前端 user 对象 */
function mapUser(record) {
  if (!record) return null
  let avatarUrl = null
  if (record.avatar) {
    try { avatarUrl = pb.files.getURL(record, record.avatar) } catch (e) { /* noop */ }
  }
  return {
    id: record.id,
    account: record.email || '',         // account 是登录账号（邮箱），不是 PB 的 id
    email: record.email || '',
    nickname: record.nickname || '',
    avatar: avatarUrl,                   // PB 的 URL 而不是 dataURL
    avatarData: null,                    // 兼容旧代码（旧逻辑里 avatar 是 dataURL）
    lang: record.lang || '',
    settings: record.settings || null,
  }
}

/** SHA-256 哈希（用于 recoveryAnswer），Promise 返回十六进制。
 *  注意：crypto.subtle 只在安全上下文（HTTPS / localhost）下可用。
 *  通过 LAN IP 访问 HTTP 时 crypto.subtle 为 undefined，需兜底。 */
async function sha256(str) {
  const input = str.trim().toLowerCase()
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = new TextEncoder().encode(input)
    const hash = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  // 非安全上下文兜底：用简单哈希（仅 dev 用，生产必须 HTTPS）
  let h1 = 0xdeadbeef ^ input.length, h2 = 0x41c6ce57 ^ input.length
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0')
}

/** 统一处理 PB 抛出的错误 */
function errMsg(e) {
  if (!e) return '未知错误'
  if (typeof e === 'string') return e
  // 浏览器原生 fetch 抛错（如 CORS、网络断开）—— PB 没机会返回
  if (e instanceof TypeError) {
    // 区分纯网络错误和其他 TypeError（如 crypto.subtle undefined）
    const msg = e.message || ''
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
      return '网络请求失败，请检查后端服务是否启动（CORS 或网络问题）'
    }
    return '发生错误：' + msg
  }
  // PB ClientResponseError 有 response.data 等
  if (e.response) {
    const data = e.response.data || {}
    if (data.message) return data.message
    const fieldErr = Object.values(data).find((v) => Array.isArray(v) && v.message)
    if (fieldErr) return fieldErr.message
  }
  return e.message || String(e)
}

// ====== auth 模块 ======

const REMEMBER_KEY = 'healing_app_remember_v1'

export const auth = {
  /**
   * 注册：先创建 user（带 nickname/recovery），再立刻登录
   */
  async register({ email, password, nickname, recoveryQuestion, recoveryAnswer }) {
    try {
      const recoveryAnswerHash = recoveryAnswer ? await sha256(recoveryAnswer) : ''
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        nickname: nickname || email.split('@')[0],
        recoveryQuestion: recoveryQuestion || '',
        recoveryAnswer: recoveryAnswerHash,
      })
      // 立刻登录
      await pb.collection('users').authWithPassword(email, password)
      return { ok: true, user: mapUser(pb.authStore.model) }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },

  /** 邮箱 + 密码登录 */
  async login({ email, password }) {
    try {
      await pb.collection('users').authWithPassword(email, password)
      return { ok: true, user: mapUser(pb.authStore.model) }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },

  /** 退出登录 */
  logout() {
    pb.authStore.clear()
  },

  /** 是否已登录（同步） */
  isLoggedIn() {
    return pb.authStore.isValid
  },

  /** 当前 user（同步） */
  currentUser() {
    return mapUser(pb.authStore.model)
  },

  /** 更新用户资料（昵称、头像、语言等） */
  async updateProfile(updates) {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      // avatar: PB 需要 FormData
      let payload = { ...updates }
      if (updates.avatar instanceof File) {
        const form = new FormData()
        Object.entries(updates).forEach(([k, v]) => {
          if (v !== undefined && v !== null && k !== 'avatar') form.append(k, v)
        })
        form.append('avatar', updates.avatar)
        payload = form
      } else if (typeof updates.avatar === 'string' && updates.avatar.startsWith('data:')) {
        // dataURL → Blob → File
        const blob = await (await fetch(updates.avatar)).blob()
        const form = new FormData()
        Object.entries(updates).forEach(([k, v]) => {
          if (v !== undefined && v !== null && k !== 'avatar') form.append(k, v)
        })
        form.append('avatar', blob, 'avatar.png')
        payload = form
      }
      const record = await pb.collection('users').update(id, payload)
      return { ok: true, user: mapUser(record) }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },

  /** 修改密码（需要旧密码） */
  async changePassword({ oldPassword, newPassword }) {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      await pb.collection('users').update(id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: newPassword,
      })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },

  /** 读取安全问题（用于忘记密码流程） */
  async getRecoveryQuestion({ email }) {
    try {
      const record = await pb.collection('users').getFirstListItem(`email="${email.replace(/"/g, '\\"')}"`)
      return { ok: true, question: record.recoveryQuestion || '' }
    } catch (e) {
      return { ok: false, error: '未找到该邮箱对应的账号。' }
    }
  },

  /** 用安全问题答案重置密码 */
  async resetPassword({ email, recoveryAnswer, newPassword }) {
    try {
      const record = await pb.collection('users').getFirstListItem(`email="${email.replace(/"/g, '\\"')}"`)
      const providedHash = await sha256(recoveryAnswer)
      if (record.recoveryAnswer !== providedHash) {
        return { ok: false, error: '安全问题的答案不正确。' }
      }
      await pb.collection('users').update(record.id, {
        password: newPassword,
        passwordConfirm: newPassword,
      })
      // 自动登录
      await pb.collection('users').authWithPassword(email, newPassword)
      return { ok: true, user: mapUser(pb.authStore.model) }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },

  /** 检查邮箱是否已注册（用于注册时实时校验） */
  async exists(email, type = 'email') {
    if (type !== 'email') return false  // 手机号暂不支持
    try {
      await pb.collection('users').getFirstListItem(`email="${email.replace(/"/g, '\\"')}"`)
      return true
    } catch (e) {
      return false
    }
  },

  /** 记住账号（本地存储，与服务端无关） */
  saveRemember(email) {
    try { localStorage.setItem(REMEMBER_KEY, email) } catch (e) {}
  },
  loadRemember() {
    try { return localStorage.getItem(REMEMBER_KEY) || '' } catch (e) { return '' }
  },
  clearRemember() {
    try { localStorage.removeItem(REMEMBER_KEY) } catch (e) {}
  },
}

// ====== bindings 模块（暂时留空，后续 Day 3 接入） ======
export const bindings = {
  get(email) {
    return { phone: null, google: null, apple: null }
  },
  bind(email, channel, value) {
    console.warn('[bindings] not yet implemented')
    return { ok: true }
  },
  unbind(email, channel) {
    console.warn('[bindings] not yet implemented')
    return { ok: true }
  },
  clear(email) {
    return { ok: true }
  },
}

// ====== 业务数据 mapper（favorites / presets / artworks） ======

/** 查找噪音选项（pure + ambient 合并）by id */
function findNoiseOption(id) {
  if (!id) return null
  return noiseOptions.pure.find((n) => n.id === id) || noiseOptions.ambient.find((n) => n.id === id) || null
}

/** 查找双耳节拍选项 by id */
function findBinauralOption(id) {
  if (!id) return null
  return binauralOptions.find((b) => b.id === id) || null
}

/** 把 PB preset record 映射成前端 preset 对象 */
function mapPreset(record) {
  if (!record) return null
  const noise = findNoiseOption(record.bgNoiseId)
  const binaural = findBinauralOption(record.binauralId)
  return {
    id: record.id,
    name: record.name || '',
    mainMusicId: record.mainMusicId || '',
    mainMusicTitle: record.mainMusicTitle || '',
    mainVolume: record.mainVolume ?? 0,
    bgNoise: noise ? { id: noise.id, name: noise.name } : null,
    bgVolume: record.bgVolume ?? 0,
    ambient: Array.isArray(record.ambient) ? record.ambient : [],
    binaural: binaural ? { id: binaural.id, name: binaural.name, range: binaural.range } : null,
    binauralVolume: record.binauralVolume ?? 0,
    createdAt: record.created ? new Date(record.created).getTime() : Date.now(),
  }
}

/** 把前端 preset 对象映射成 PB record 字段 */
function presetToPB(preset, userId) {
  return {
    user: userId,
    name: preset.name || '',
    mainMusicId: preset.mainMusicId || '',
    mainMusicTitle: preset.mainMusicTitle || '',
    mainVolume: preset.mainVolume ?? 0,
    bgNoiseId: preset.bgNoise?.id || '',
    bgVolume: preset.bgVolume ?? 0,
    ambient: Array.isArray(preset.ambient) ? preset.ambient : [],
    binauralId: preset.binaural?.id || '',
    binauralVolume: preset.binauralVolume ?? 0,
  }
}

/** 把 PB artwork record 映射成前端 artwork 对象 */
function mapArtwork(record) {
  if (!record) return null
  let mixMeta = {}
  try {
    mixMeta = typeof record.mix === 'string' ? JSON.parse(record.mix) : (record.mix || {})
  } catch (e) { mixMeta = {} }
  let previewUrl = null
  if (record.image) {
    try { previewUrl = pb.files.getURL(record, record.image) } catch (e) { /* noop */ }
  }
  const quoteEn = record.quoteEn || ''
  const quoteCn = record.quoteCn || ''
  return {
    id: record.id,
    title: mixMeta.title || '',
    curveType: record.curveType || '',
    previewUrl,
    status: record.status || 'complete',
    duration: record.duration ?? 0,
    mixName: mixMeta.mixName || '',
    interruptReason: mixMeta.interruptReason || '',
    quote: (quoteEn || quoteCn) ? { en: quoteEn, cn: quoteCn } : undefined,
    elapsedMin: record.elapsed ? record.elapsed / 60 : undefined,
    createdAt: record.created ? new Date(record.created).getTime() : Date.now(),
  }
}

// ====== favorites 模块 ======
export const favorites = {
  /** 列出当前用户所有收藏，返回 musicId 数组 */
  async list() {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      const records = await pb.collection('favorites').getFullList({ sort: '-created' })
      return { ok: true, items: records.map((r) => r.musicId) }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },

  /** 收藏一首音乐（幂等：已存在也返回 ok） */
  async add(musicId) {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      await pb.collection('favorites').create({ user: id, musicId })
      return { ok: true }
    } catch (e) {
      // UNIQUE 冲突 = 已收藏，当成功处理（幂等）
      const data = e?.response?.data
      if (data && Object.values(data).some((v) => v && v.code === 'validation_not_unique')) {
        return { ok: true }
      }
      return { ok: false, error: errMsg(e) }
    }
  },

  /** 取消收藏（按 musicId 查找并删除，幂等） */
  async remove(musicId) {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      const rec = await pb.collection('favorites').getFirstListItem(
        `musicId="${musicId.replace(/"/g, '\\"')}"`
      )
      await pb.collection('favorites').delete(rec.id)
      return { ok: true }
    } catch (e) {
      // 不存在也算成功（幂等）
      if (e?.status === 404) return { ok: true }
      return { ok: false, error: errMsg(e) }
    }
  },
}

// ====== presets 模块 ======
export const presets = {
  async list() {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      const records = await pb.collection('presets').getFullList({ sort: '-created' })
      return { ok: true, items: records.map(mapPreset) }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },

  async create(preset) {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      const record = await pb.collection('presets').create(presetToPB(preset, id))
      return { ok: true, preset: mapPreset(record) }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },

  async update(presetId, preset) {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      const record = await pb.collection('presets').update(presetId, presetToPB(preset, id))
      return { ok: true, preset: mapPreset(record) }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },

  async remove(presetId) {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      await pb.collection('presets').delete(presetId)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },
}

// ====== artworks 模块 ======
export const artworks = {
  async list() {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      const records = await pb.collection('artworks').getFullList({ sort: '-created' })
      return { ok: true, items: records.map(mapArtwork) }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },

  /** 创建画作：dataUrl 是 WebGL canvas 的 PNG dataURL，转 Blob 后用 FormData 上传 */
  async create(art, dataUrl) {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      const mixMeta = JSON.stringify({
        title: art.title || '',
        mixName: art.mixName || '',
        interruptReason: art.interruptReason || '',
      })
      const form = new FormData()
      form.append('user', id)
      form.append('duration', String(art.duration ?? 0))
      form.append('curveType', art.curveType || '')
      form.append('mix', mixMeta)
      form.append('status', art.status || 'complete')
      form.append('quoteEn', art.quote?.en || '')
      form.append('quoteCn', art.quote?.cn || '')
      form.append('elapsed', String(art.elapsedMin ? Math.round(art.elapsedMin * 60) : 0))
      if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        const blob = await (await fetch(dataUrl)).blob()
        form.append('image', blob, 'artwork.png')
      } else {
        return { ok: false, error: 'artwork image is required' }
      }
      const record = await pb.collection('artworks').create(form)
      return { ok: true, artwork: mapArtwork(record) }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },

  async remove(artworkId) {
    try {
      const id = pb.authStore.model?.id
      if (!id) return { ok: false, error: 'Not logged in' }
      await pb.collection('artworks').delete(artworkId)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: errMsg(e) }
    }
  },
}

// ====== 校验器（与旧 store.jsx 保持同名导出） ======
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhone(phone) {
  if (typeof phone !== 'string') return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

export function validatePassword(pwd) {
  if (typeof pwd !== 'string') return false
  if (pwd.length < 8 || pwd.length > 20) return false
  const hasLetter = /[a-zA-Z]/.test(pwd)
  const hasDigit = /\d/.test(pwd)
  return hasLetter && hasDigit
}

// ====== 鉴权状态变更订阅 ======
// store.jsx 会调 onAuthChange(cb) 监听登录/退出
export function onAuthChange(cb) {
  return pb.authStore.onChange((token, model) => {
    cb(mapUser(model), !!token)
  }, true)
}

/**
 * 初始化鉴权：若 localStorage 有 token 但 model 为空（典型情况：浏览器刷新），
 * 调一次 authRefresh 校验 token 并填充 model。
 * 失败则清空 authStore（用户需重新登录）。
 */
export async function initAuth() {
  if (!pb.authStore.token) return false
  if (pb.authStore.model) return true
  try {
    await pb.collection('users').authRefresh()
    return true
  } catch (e) {
    console.warn('[api] authRefresh failed:', errMsg(e))
    pb.authStore.clear()
    return false
  }
}