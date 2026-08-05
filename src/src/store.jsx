import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'

const AppContext = createContext(null)

const STORAGE_KEY = 'healing_app_state_v1'

// ====== localStorage 持久化 ======
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
      recentQuotes, recordQuote
    }),
    [user, onboardingSeen, markOnboardingSeen, favorites, presets, artworks, currentMix, settings, toggleFavorite, addArtwork, deleteArtwork, savePreset, deletePreset, isPresetNameExist, recentQuotes, recordQuote]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
