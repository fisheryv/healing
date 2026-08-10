/**
 * store.jsx — 全局状态（Day 2 改造：auth 改用 PocketBase）
 *
 * 职责：
 *   - 用 React Context 暴露 useApp() 给所有页面
 *   - user 状态从 PocketBase authStore 派生（订阅 onChange）
 *   - favorites / presets / artworks 仍走 localStorage（Day 3 再迁 PB）
 *   - 重新导出 auth / bindings / validate* 从 ./api.js（保持向后兼容）
 *
 * Day 3 会扩展：
 *   - favorites / presets / artworks 改为同步到 PB collections
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { auth, bindings, validateEmail, validatePhone, validatePassword, onAuthChange, initAuth } from './api.js'
import { translate, DEFAULT_LANG } from './i18n.js'

const AppContext = createContext(null)

const STORAGE_KEY = 'healing_app_state_v1'
const LANG_KEY = 'healing_app_lang_v1'

// ====== localStorage 持久化（仅业务数据） ======
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.warn('[store] loadState failed:', e)
    return null
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('[store] saveState failed:', e)
  }
}

// 默认混音预设
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
  const persisted = loadState()

  // 语言：独立持久化
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || 'en'
    } catch (e) {
      return 'en'
    }
  })

  // 用户：从 PB authStore 派生
  const [user, setUser] = useState(() => auth.currentUser())

  // 订阅 PB authStore 变化（登录/退出/token 刷新）
  useEffect(() => {
    let cancelled = false
    const unsub = onAuthChange((nextUser) => {
      setUser(nextUser)
    })
    // 初始化时若有 token 则校验并填充 model
    initAuth().finally(() => {
      if (!cancelled) setAuthReady(true)
    })
    return () => { cancelled = true; unsub() }
  }, [])

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
  const [recentQuotes, setRecentQuotes] = useState([])

  // 鉴权初始化是否完成（避免 RequireAuth 在 initAuth 完成前误判）
  const [authReady, setAuthReady] = useState(false)

  const markOnboardingSeen = useCallback(() => setOnboardingSeen(true), [])

  const changeLang = useCallback((newLang) => {
    setLang(newLang)
    try { localStorage.setItem(LANG_KEY, newLang) } catch (e) {}
  }, [])

  // 业务数据持久化（user 不再持久化，由 PB 负责）
  useEffect(() => {
    saveState({ onboardingSeen, favorites, presets, artworks, settings })
  }, [onboardingSeen, favorites, presets, artworks, settings])

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const addArtwork = useCallback((art) => {
    const newArt = { ...art, id: 'a' + Date.now() }
    setArtworks((prev) => {
      const abandoned = newArt.status !== 'complete'
      if (abandoned) return [newArt, ...prev]
      const firstAbandonedIdx = prev.findIndex((a) => a.status !== 'complete')
      if (firstAbandonedIdx === -1) return [newArt, ...prev]
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

  const isPresetNameExist = useCallback((name) => {
    return presets.some((p) => p.name === name)
  }, [presets])

  const deletePreset = useCallback((id) => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const recordQuote = useCallback((quoteEn) => {
    setRecentQuotes((prev) => {
      const next = [quoteEn, ...prev.filter((q) => q !== quoteEn)]
      return next.slice(0, 3)
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
      lang, setLang: changeLang,
      authReady,
      t: (key, params) => translate(lang, key, params)
    }),
    [user, onboardingSeen, markOnboardingSeen, favorites, presets, artworks, currentMix, settings,
     toggleFavorite, addArtwork, deleteArtwork, savePreset, deletePreset, isPresetNameExist,
     recentQuotes, recordQuote, lang, changeLang, authReady]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

// 重新导出 PB 封装模块（保持页面代码不变）
export { auth, bindings, validateEmail, validatePhone, validatePassword }
export { pb } from './api.js'