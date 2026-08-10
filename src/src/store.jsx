import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { translate, DEFAULT_LANG } from './i18n.js'

const AppContext = createContext(null)

const STORAGE_KEY = 'healing_app_state_v1'
const ACCOUNTS_KEY = 'healing_app_accounts_v1'
const REMEMBER_KEY = 'healing_app_remember_v1'
const BINDINGS_KEY = 'healing_app_bindings_v1'
const LANG_KEY = 'healing_app_lang_v1'

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
  register({ email, nickname, password }) {
    const accounts = loadAccounts()
    if (accounts.some((a) => a.email === email)) {
      return { ok: false, error: 'This email is already registered.' }
    }
    const account = {
      email,
      nickname: nickname || email.split('@')[0],
      passwordHash: hashPassword(password),
      createdAt: Date.now()
    }
    accounts.push(account)
    saveAccounts(accounts)
    return { ok: true, user: { email: account.email, nickname: account.nickname } }
  },
  // 登录
  login({ email, password }) {
    const accounts = loadAccounts()
    const acc = accounts.find((a) => a.email === email)
    if (!acc) {
      return { ok: false, error: 'Account not found. Please sign up first.' }
    }
    if (acc.passwordHash !== hashPassword(password)) {
      return { ok: false, error: 'Incorrect password. Please try again.' }
    }
    return { ok: true, user: { email: acc.email, nickname: acc.nickname } }
  },
  // 重置密码
  resetPassword({ email, password }) {
    const accounts = loadAccounts()
    const idx = accounts.findIndex((a) => a.email === email)
    if (idx === -1) {
      return { ok: false, error: 'Account not found. Please sign up first.' }
    }
    accounts[idx].passwordHash = hashPassword(password)
    saveAccounts(accounts)
    return { ok: true }
  },
  // 修改密码（按需求：不校验旧密码，直接设置新密码）
  changePassword({ email, newPassword }) {
    const accounts = loadAccounts()
    const idx = accounts.findIndex((a) => a.email === email)
    if (idx === -1) {
      // 账户库里没有（可能是旧版残留的登录态），直接成功，不阻塞
      return { ok: true }
    }
    accounts[idx].passwordHash = hashPassword(newPassword)
    saveAccounts(accounts)
    return { ok: true }
  },
  // 是否存在该邮箱（用于注册/找回时判断）
  exists(email) {
    return loadAccounts().some((a) => a.email === email)
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

// 简易字段校验
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
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
