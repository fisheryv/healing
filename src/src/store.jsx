import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { translate, DEFAULT_LANG } from './i18n.js'

const AppContext = createContext(null)

const STORAGE_KEY = 'healing_app_state_v1'
const ACCOUNTS_KEY = 'healing_app_accounts_v1'
const REMEMBER_KEY = 'healing_app_remember_v1'
const BINDINGS_KEY = 'healing_app_bindings_v1'
const LANG_KEY = 'healing_app_lang_v1'
const LOCK_KEY = 'healing_app_lock_v1'
const CODE_KEY = 'healing_app_code_v1'
const LOCK_MAX = 5
const LOCK_MS = 30 * 60 * 1000

// ====== localStorage 持久化 ======
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // 迁移旧版本预设：把纯字符串 name 字段升级为 {en, zh} 对象
    if (data && Array.isArray(data.presets)) {
      data.presets = data.presets.map(migratePreset)
    }
    return data
  } catch (e) {
    console.warn('[store] loadState failed:', e)
    return null
  }
}

// 把一个 mix preset 中的字段（name/title）从字符串升级为双语对象
function localizeField(field) {
  if (field == null) return field
  if (typeof field === 'object' && (field.en || field.zh)) return field
  if (typeof field === 'string') {
    return { en: field, zh: field }
  }
  return field
}

// 从 data.js 中按 id 反查双语对象，找不到则回退为 {en: str, zh: str}
function resolveName(field) {
  if (field == null) return field
  if (typeof field === 'object' && (field.en || field.zh)) return field
  if (typeof field !== 'string') return field
  // 尝试按 id 在 noise / atmos / binaural / 音乐列表中查找
  try {
    // 动态引入避免循环依赖问题（仅在迁移阶段需要）
    const data = window.__HEALING_DATA__ || null
    if (data) {
      const all = [
        ...(data.officialMusic || []),
        ...(data.noiseOptions?.pure || []),
        ...(data.noiseOptions?.ambient || []),
        ...(data.atmosOptions || []),
        ...(data.binauralOptions || [])
      ]
      const hit = all.find((x) => x && (x.name === field || x.id === field))
      if (hit && typeof hit.name === 'object') return hit.name
    }
  } catch (e) { /* noop */ }
  return localizeField(field)
}

function migratePreset(p) {
  if (!p) return p
  // name 是用户起的名字，保留原值
  // 但 mainMusicTitle / bgNoise.name / ambient[].name / binaural.name 这些应是数据字段
  const next = { ...p }
  if (p.mainMusicTitle != null) next.mainMusicTitle = resolveName(p.mainMusicTitle)
  if (p.bgNoise && p.bgNoise.name != null) {
    next.bgNoise = { ...p.bgNoise, name: resolveName(p.bgNoise.name) }
  }
  if (Array.isArray(p.ambient)) {
    next.ambient = p.ambient.map((a) => a && a.name != null ? { ...a, name: resolveName(a.name) } : a)
  }
  if (p.binaural && p.binaural.name != null) {
    next.binaural = { ...p.binaural, name: resolveName(p.binaural.name) }
  }
  return next
}

// ====== 本地账户库（模拟后端） ======
function loadAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

function saveAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch (e) {
    console.warn('[store] saveAccounts failed:', e)
  }
}

// 极简 hash，仅用于本地演示，不要用于真实生产
function hashPassword(pwd) {
  let h = 0
  for (let i = 0; i < pwd.length; i++) {
    h = (h << 5) - h + pwd.charCodeAt(i)
    h |= 0
  }
  return 'h' + (h >>> 0).toString(16)
}

export const auth = {
  // 注册：成功返回 { ok:true, user }，失败返回 { ok:false, error }
  // account 字段可来自 email 或 phone；类型通过 type 区分
  // recoveryQuestion/recoveryAnswer 用于账号恢复和忘记密码
  register({ email, phone, nickname, password, type = 'email', recoveryQuestion = '', recoveryAnswer = '' }) {
    const accounts = loadAccounts()
    const id = type === 'phone' ? phone : email
    if (accounts.some((a) => (a.email && a.email === email) || (a.phone && a.phone === phone))) {
      return { ok: false, error: 'This account is already registered.' }
    }
    const account = {
      email: type === 'email' ? email : (email || ''),
      phone: type === 'phone' ? phone : (phone || ''),
      nickname: nickname || (type === 'email' ? email.split('@')[0] : 'user' + (phone || '').slice(-4)),
      passwordHash: hashPassword(password),
      recoveryQuestion,
      recoveryAnswer: hashPassword(recoveryAnswer.trim().toLowerCase()),
      createdAt: Date.now()
    }
    accounts.push(account)
    saveAccounts(accounts)
    return { ok: true, user: { email: account.email, phone: account.phone, nickname: account.nickname, account: id } }
  },
  // 登录（支持 email 或 phone + 密码）
  login({ email, phone, password, type = 'email' }) {
    const accounts = loadAccounts()
    const id = type === 'phone' ? phone : email
    // 锁定检查
    const locks = loadLocks()
    const lockInfo = locks[id]
    if (lockInfo && Date.now() - lockInfo.lockedAt < LOCK_MS) {
      const remainMin = Math.ceil((LOCK_MS - (Date.now() - lockInfo.lockedAt)) / 60000)
      return { ok: false, error: `Account locked. Try again in ${remainMin} min.`, locked: true, remainMin }
    }
    // 锁定过期，清理
    if (lockInfo && Date.now() - lockInfo.lockedAt >= LOCK_MS) {
      delete locks[id]
      saveLocks(locks)
    }

    const acc = type === 'phone'
      ? accounts.find((a) => a.phone === phone)
      : accounts.find((a) => a.email === email)
    if (!acc) {
      return { ok: false, error: 'Account not found. Please sign up first.' }
    }
    if (acc.passwordHash !== hashPassword(password)) {
      // 记录错误次数
      const newLocks = loadLocks()
      const cur = newLocks[id] || { count: 0, lockedAt: 0 }
      cur.count += 1
      if (cur.count >= LOCK_MAX) {
        cur.lockedAt = Date.now()
        cur.count = 0
        newLocks[id] = cur
        saveLocks(newLocks)
        return { ok: false, error: 'Account locked for 30 minutes due to too many failed attempts.', locked: true, remainMin: 30 }
      }
      newLocks[id] = cur
      saveLocks(newLocks)
      const left = LOCK_MAX - cur.count
      return { ok: false, error: `Incorrect password. ${left} attempt${left === 1 ? '' : 's'} left before lockout.` }
    }
    // 成功登录，清除锁定
    const newLocks = loadLocks()
    if (newLocks[id]) {
      delete newLocks[id]
      saveLocks(newLocks)
    }
    return { ok: true, user: { email: acc.email, phone: acc.phone, nickname: acc.nickname, account: id } }
  },
  // 获取某账号的安全问题（用于忘记密码时展示）
  getRecoveryQuestion({ email, phone, type = 'email' }) {
    const accounts = loadAccounts()
    const acc = type === 'phone'
      ? accounts.find((a) => a.phone === phone)
      : accounts.find((a) => a.email === email)
    if (!acc) return { ok: false, error: 'Account not found. Please sign up first.' }
    return { ok: true, question: acc.recoveryQuestion || '' }
  },
  // 重置密码：通过安全问题答案验证
  resetPassword({ email, phone, password, recoveryAnswer = '', type = 'email' }) {
    const accounts = loadAccounts()
    const idx = type === 'phone'
      ? accounts.findIndex((a) => a.phone === phone)
      : accounts.findIndex((a) => a.email === email)
    if (idx === -1) {
      return { ok: false, error: 'Account not found. Please sign up first.' }
    }
    if (!accounts[idx].recoveryAnswer || accounts[idx].recoveryAnswer !== hashPassword(recoveryAnswer.trim().toLowerCase())) {
      return { ok: false, error: 'Incorrect recovery answer.' }
    }
    accounts[idx].passwordHash = hashPassword(password)
    saveAccounts(accounts)
    // 同时返回用户信息以便自动登录
    const acc = accounts[idx]
    const id = type === 'phone' ? acc.phone : acc.email
    return { ok: true, user: { email: acc.email, phone: acc.phone, nickname: acc.nickname, account: id } }
  },
  // 修改密码：校验旧密码
  changePassword({ email, phone, oldPassword, newPassword, type = 'email' }) {
    const accounts = loadAccounts()
    const idx = type === 'phone'
      ? accounts.findIndex((a) => a.phone === phone)
      : accounts.findIndex((a) => a.email === email)
    if (idx === -1) {
      // 账户库里没有（可能是旧版残留的登录态），直接成功，不阻塞
      return { ok: true }
    }
    if (accounts[idx].passwordHash !== hashPassword(oldPassword)) {
      return { ok: false, error: 'Current password is incorrect.' }
    }
    accounts[idx].passwordHash = hashPassword(newPassword)
    saveAccounts(accounts)
    return { ok: true }
  },
  // 是否存在该账号（email 或 phone）
  exists(emailOrPhone, type = 'email') {
    const accounts = loadAccounts()
    return type === 'phone'
      ? accounts.some((a) => a.phone === emailOrPhone)
      : accounts.some((a) => a.email === emailOrPhone)
  },
  // 记住账号
  saveRemember(email) {
    try {
      localStorage.setItem(REMEMBER_KEY, email)
    } catch (e) {}
  },
  loadRemember() {
    try {
      return localStorage.getItem(REMEMBER_KEY) || ''
    } catch (e) {
      return ''
    }
  },
  clearRemember() {
    try {
      localStorage.removeItem(REMEMBER_KEY)
    } catch (e) {}
  }
}

// ====== 第三方账号绑定（本地模拟） ======
function loadBindings() {
  try {
    const raw = localStorage.getItem(BINDINGS_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (e) {
    return {}
  }
}

function saveBindings(bindings) {
  try {
    localStorage.setItem(BINDINGS_KEY, JSON.stringify(bindings))
  } catch (e) {
    console.warn('[store] saveBindings failed:', e)
  }
}

export const bindings = {
  // 获取某用户的所有绑定 { phone, google, apple }
  get(email) {
    const all = loadBindings()
    return all[email] || { phone: null, google: null, apple: null }
  },
  // 绑定一个渠道，value 为绑定的标识（如手机号、第三方账号名）
  bind(email, channel, value) {
    const all = loadBindings()
    if (!all[email]) all[email] = { phone: null, google: null, apple: null }
    all[email][channel] = value
    saveBindings(all)
    return { ok: true }
  },
  // 解绑
  unbind(email, channel) {
    const all = loadBindings()
    if (all[email]) {
      all[email][channel] = null
      saveBindings(all)
    }
    return { ok: true }
  },
  // 注销账号时清理
  clear(email) {
    const all = loadBindings()
    delete all[email]
    saveBindings(all)
  }
}

// ====== 验证码模块（10 分钟有效期，localStorage 持久化） ======
export const codes = {
  // 生成并保存验证码（10 分钟有效）
  send(target, type = 'email') {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    try {
      const all = JSON.parse(localStorage.getItem(CODE_KEY) || '{}')
      all[`${type}:${target}`] = { code, sentAt: Date.now() }
      localStorage.setItem(CODE_KEY, JSON.stringify(all))
    } catch (e) { /* noop */ }
    return code
  },
  // 校验验证码：返回 true/false
  verify(target, inputCode, type = 'email') {
    if (!inputCode) return false
    try {
      const all = JSON.parse(localStorage.getItem(CODE_KEY) || '{}')
      const entry = all[`${type}:${target}`]
      if (!entry) return false
      // 10 分钟有效期
      if (Date.now() - entry.sentAt > 10 * 60 * 1000) {
        delete all[`${type}:${target}`]
        localStorage.setItem(CODE_KEY, JSON.stringify(all))
        return false
      }
      return entry.code === inputCode
    } catch (e) {
      return false
    }
  },
  // 清除某目标验证码
  clear(target, type = 'email') {
    try {
      const all = JSON.parse(localStorage.getItem(CODE_KEY) || '{}')
      delete all[`${type}:${target}`]
      localStorage.setItem(CODE_KEY, JSON.stringify(all))
    } catch (e) { /* noop */ }
  }
}
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// PRD: 密码 8-20 位，需同时包含字母和数字
export function validatePassword(pwd) {
  if (typeof pwd !== 'string') return false
  if (pwd.length < 8 || pwd.length > 20) return false
  const hasLetter = /[a-zA-Z]/.test(pwd)
  const hasDigit = /\d/.test(pwd)
  return hasLetter && hasDigit
}

// 手机号格式校验（默认 +86，11 位数字）
export function validatePhone(phone) {
  if (typeof phone !== 'string') return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

// ====== 登录安全锁定（localStorage 持久化） ======
function loadLocks() {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (e) {
    return {}
  }
}

function saveLocks(locks) {
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(locks))
  } catch (e) { /* noop */ }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('[store] saveState failed:', e)
  }
}

// 默认预设
const DEFAULT_PRESETS = [
  {
    id: 'p1',
    name: 'Glass Rain',
    mainMusicId: 'm1',
    mainMusicTitle: 'Glass Rain',
    mainVolume: 0.7,
    bgNoise: { id: 'rain', name: 'Rain' },
    bgVolume: 0.5,
    ambient: [],
    binaural: { id: 'alpha', name: 'Alpha', range: '8–13 Hz' },
    binauralVolume: 0.3,
    createdAt: Date.now() - 86400000
  },
  {
    id: 'p2',
    name: 'Still Dance',
    mainMusicId: 'm2',
    mainMusicTitle: 'Still Dance',
    mainVolume: 0.6,
    bgNoise: null,
    bgVolume: 0.4,
    ambient: [{ id: 'pages', name: 'Page Turning', volume: 0.4 }],
    binaural: null,
    binauralVolume: 0,
    createdAt: Date.now() - 3 * 86400000
  }
]

export function AppProvider({ children }) {
  // 从 localStorage 初始化
  const persisted = loadState()

  // 语言：从 localStorage 独立读取，默认 en
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || DEFAULT_LANG
    } catch (e) {
      return DEFAULT_LANG
    }
  })

  const [user, setUser] = useState(persisted?.user ?? null)
  const [onboardingSeen, setOnboardingSeen] = useState(persisted?.onboardingSeen ?? false)
  const [favorites, setFavorites] = useState(persisted?.favorites ?? [])
  const [presets, setPresets] = useState(persisted?.presets ?? DEFAULT_PRESETS)
  const [artworks, setArtworks] = useState(persisted?.artworks ?? [])
  const [currentMix, setCurrentMix] = useState(persisted?.currentMix ?? null)
  const [settings, setSettings] = useState(persisted?.settings ?? {
    screenDown: true,
    dnd: false,
    completeNotice: true
  })
  // 最近使用的文学摘录索引（用于去重）
  const [recentQuotes, setRecentQuotes] = useState([])

  const markOnboardingSeen = useCallback(() => setOnboardingSeen(true), [])

  // 持久化语言
  const changeLang = useCallback((newLang) => {
    setLang(newLang)
    try {
      localStorage.setItem(LANG_KEY, newLang)
    } catch (e) { /* noop */ }
  }, [])

  // 翻译函数
  const t = useCallback((key, params) => translate(lang, key, params), [lang])

  // 持久化到 localStorage（排除 currentMix 和 recentQuotes 等运行时状态）
  useEffect(() => {
    saveState({ user, onboardingSeen, favorites, presets, artworks, settings })
  }, [user, onboardingSeen, favorites, presets, artworks, settings])

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const addArtwork = useCallback((art) => {
    const newArt = { ...art, id: 'a' + Date.now() }
    setArtworks((prev) => {
      // 残卷排首位，已完成按时间倒序
      const abandoned = newArt.status !== 'complete'
      if (abandoned) {
        return [newArt, ...prev]
      }
      // 完成的作品插入到第一个残卷之前（保持残卷在前）
      const firstAbandonedIdx = prev.findIndex((a) => a.status !== 'complete')
      if (firstAbandonedIdx === -1) {
        return [newArt, ...prev]
      }
      const copy = [...prev]
      copy.splice(firstAbandonedIdx, 0, newArt)
      return copy
    })
    return newArt
  }, [])

  const deleteArtwork = useCallback((id) => {
    setArtworks((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const savePreset = useCallback((preset) => {
    setPresets((prev) => {
      const existing = prev.findIndex((p) => p.name === preset.name)
      if (existing >= 0) {
        const copy = [...prev]
        copy[existing] = { ...preset, id: copy[existing].id, createdAt: Date.now() }
        return copy
      }
      return [{ ...preset, id: 'p' + Date.now(), createdAt: Date.now() }, ...prev]
    })
  }, [])

  // 检查预设名是否已存在（用于重名提示）
  const isPresetNameExist = useCallback((name) => {
    return presets.some((p) => p.name === name)
  }, [presets])

  const deletePreset = useCallback((id) => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // 记录最近使用的摘录（去重）
  const recordQuote = useCallback((quoteEn) => {
    setRecentQuotes((prev) => {
      const next = [quoteEn, ...prev.filter((q) => q !== quoteEn)]
      return next.slice(0, 3) // 保留最近 3 条
    })
  }, [])

  const value = useMemo(
    () => ({
      user, setUser,
      onboardingSeen, markOnboardingSeen,
      favorites, toggleFavorite,
      presets, savePreset, deletePreset, isPresetNameExist,
      artworks, addArtwork, deleteArtwork,
      currentMix, setCurrentMix,
      settings, setSettings,
      recentQuotes, recordQuote,
      lang, setLang: changeLang, t
    }),
    [user, onboardingSeen, markOnboardingSeen, favorites, presets, artworks, currentMix, settings, toggleFavorite, addArtwork, deleteArtwork, savePreset, deletePreset, isPresetNameExist, recentQuotes, recordQuote, lang, changeLang, t]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
