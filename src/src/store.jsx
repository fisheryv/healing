/**
 * store.jsx — 全局状态（Day 3 改造：业务数据迁移到 PocketBase）
 *
 * 职责：
 *   - 用 React Context 暴露 useApp() 给所有页面
 *   - user 状态从 PocketBase authStore 派生（订阅 onChange）
 *   - favorites / presets / artworks 走 PB collections：登录时拉取、变更时乐观更新 + 异步写回
 *   - onboardingSeen / settings 仍走 localStorage（设备本地偏好）
 *   - 重新导出 auth / bindings / validate* 从 ./api.js（保持向后兼容）
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { flushSync } from 'react-dom'
import {
  auth, bindings, validateEmail, validatePhone, validatePassword,
  onAuthChange, initAuth,
  favorites as favoritesApi, presets as presetsApi, artworks as artworksApi,
} from './api.js'
import { translate } from './i18n.js'

const AppContext = createContext(null)

const STORAGE_KEY = 'healing_app_state_v1'
const LANG_KEY = 'healing_app_lang_v1'
const THEME_KEY = 'healing_app_theme_v1'

// 解析最终主题：system 模式查 matchMedia，否则直接返回
function resolveTheme(mode) {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  return mode
}

// 把主题应用到 <html data-theme>
function applyTheme(mode) {
  const resolved = resolveTheme(mode)
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = resolved
  }
}

// ====== localStorage 持久化（仅本地偏好：onboardingSeen / settings） ======
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
  const [favorites, setFavorites] = useState([])
  const [presets, setPresets] = useState([])
  const [artworks, setArtworks] = useState([])
  const [currentMix, setCurrentMix] = useState(persisted?.currentMix ?? null)
  const [settings, setSettings] = useState(persisted?.settings ?? {
    screenDown: true,
    dnd: false,
    completeNotice: true
  })
  const [recentQuotes, setRecentQuotes] = useState([])

  // 鉴权初始化是否完成（避免 RequireAuth 在 initAuth 完成前误判）
  const [authReady, setAuthReady] = useState(false)
  // 业务数据是否已从 PB 加载完成（避免 ArtworkDetail/Gallery 闪现 not-found / empty）
  const [dataReady, setDataReady] = useState(false)

  const markOnboardingSeen = useCallback(() => setOnboardingSeen(true), [])

  const changeLang = useCallback((newLang) => {
    setLang(newLang)
    try { localStorage.setItem(LANG_KEY, newLang) } catch (e) {}
  }, [])

  // 主题：light / dark / system，独立持久化
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'system'
    } catch (e) {
      return 'system'
    }
  })
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(theme))

  // system 模式下监听系统主题变化
  useEffect(() => {
    applyTheme(theme)
    setResolvedTheme(resolveTheme(theme))
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const r = resolveTheme('system')
      setResolvedTheme(r)
      document.documentElement.dataset.theme = r
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const changeTheme = useCallback((newTheme) => {
    setThemeState(newTheme)
    try { localStorage.setItem(THEME_KEY, newTheme) } catch (e) {}
  }, [])

  // 本地偏好持久化（业务数据由 PB 负责，不再写 localStorage）
  useEffect(() => {
    saveState({ onboardingSeen, settings })
  }, [onboardingSeen, settings])

  // 业务数据同步：登录时从 PB 拉取，登出时清空
  useEffect(() => {
    if (!authReady) return
    if (!user) {
      setFavorites([])
      setPresets([])
      setArtworks([])
      setDataReady(false)
      return
    }
    let cancelled = false
    Promise.all([favoritesApi.list(), presetsApi.list(), artworksApi.list()])
      .then(([f, p, a]) => {
        if (cancelled) return
        setFavorites(f.ok ? f.items : [])
        setPresets(p.ok ? p.items : [])
        setArtworks(a.ok ? a.items : [])
        setDataReady(true)
      })
      .catch(() => { if (!cancelled) setDataReady(true) })
    return () => { cancelled = true }
  }, [authReady, user?.id])

  const toggleFavorite = useCallback((id) => {
    // 乐观更新本地状态
    setFavorites((prev) => {
      const willAdd = !prev.includes(id)
      // 后台异步写 PB（失败只 warn，下次 fetch 会自动修正）
      if (willAdd) favoritesApi.add(id).catch((e) => console.warn('[favorites.add]', e))
      else favoritesApi.remove(id).catch((e) => console.warn('[favorites.remove]', e))
      return willAdd ? [...prev, id] : prev.filter((x) => x !== id)
    })
  }, [])

  const addArtwork = useCallback(async (art) => {
    if (!art.previewUrl) {
      console.error('[addArtwork] previewUrl 为 null，无法上传')
      return null
    }
    const res = await artworksApi.create(art, art.previewUrl)
    if (!res.ok) {
      console.warn('[addArtwork] 保存失败:', res.error)
      return null
    }
    const newArt = res.artwork
    // flushSync 确保 state 同步更新，避免 navigate('/gallery') 时 Gallery 读到旧 state
    flushSync(() => {
      setArtworks((prev) => {
        const abandoned = newArt.status !== 'complete'
        if (abandoned) return [newArt, ...prev]
        const firstAbandonedIdx = prev.findIndex((a) => a.status !== 'complete')
        if (firstAbandonedIdx === -1) return [newArt, ...prev]
        const copy = [...prev]
        copy.splice(firstAbandonedIdx, 0, newArt)
        return copy
      })
    })
    return newArt
  }, [])

  const deleteArtwork = useCallback((id) => {
    setArtworks((prev) => prev.filter((a) => a.id !== id))
    artworksApi.remove(id).catch((e) => console.warn('[artworks.remove]', e))
  }, [])

  const savePreset = useCallback((preset) => {
    setPresets((prev) => {
      const existingIdx = prev.findIndex((p) => p.name === preset.name)
      if (existingIdx >= 0) {
        // 覆盖已有预设
        const existing = prev[existingIdx]
        const updated = { ...preset, id: existing.id, createdAt: Date.now() }
        const copy = [...prev]
        copy[existingIdx] = updated
        // 后台更新 PB
        presetsApi.update(existing.id, preset).then((res) => {
          if (res.ok) {
            setPresets((cur) => cur.map((p) => (p.id === existing.id ? { ...res.preset, id: existing.id } : p)))
          } else console.warn('[presets.update]', res.error)
        })
        return copy
      }
      // 新建预设：先乐观插入临时记录，PB 成功后替换为真实记录
      const tempId = 'tmp_' + Date.now()
      const optimistic = { ...preset, id: tempId, createdAt: Date.now() }
      presetsApi.create(preset).then((res) => {
        if (res.ok) {
          setPresets((cur) => cur.map((p) => (p.id === tempId ? res.preset : p)))
        } else console.warn('[presets.create]', res.error)
      })
      return [optimistic, ...prev]
    })
  }, [])

  const isPresetNameExist = useCallback((name) => {
    return presets.some((p) => p.name === name)
  }, [presets])

  const deletePreset = useCallback((id) => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
    presetsApi.remove(id).catch((e) => console.warn('[presets.remove]', e))
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
      theme, setTheme: changeTheme, resolvedTheme,
      authReady,
      dataReady,
      t: (key, params) => translate(lang, key, params)
    }),
    [user, onboardingSeen, markOnboardingSeen, favorites, presets, artworks, currentMix, settings,
     toggleFavorite, addArtwork, deleteArtwork, savePreset, deletePreset, isPresetNameExist,
     recentQuotes, recordQuote, lang, changeLang, theme, changeTheme, resolvedTheme, authReady, dataReady]
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
export { favorites as favoritesApi, presets as presetsApi, artworks as artworksApi } from './api.js'
export { pb } from './api.js'