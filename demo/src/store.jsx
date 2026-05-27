import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [presets, setPresets] = useState([
    {
      id: 'p1',
      name: 'Lo-fi Rain',
      mainMusicId: 'm1',
      mainMusicTitle: 'Drifting Pages',
      mainVolume: 0.7,
      bgNoise: { id: 'rain', name: '雨声' },
      bgVolume: 0.5,
      ambient: [],
      binaural: { id: 'alpha', name: 'Alpha', range: '8–13 Hz' },
      binauralVolume: 0.3,
      createdAt: Date.now() - 86400000
    },
    {
      id: 'p2',
      name: 'Quiet Atelier',
      mainMusicId: 'm2',
      mainMusicTitle: 'Quiet Atelier',
      mainVolume: 0.6,
      bgNoise: null,
      bgVolume: 0.4,
      ambient: [{ id: 'pages', name: '翻书声', volume: 0.4 }],
      binaural: null,
      binauralVolume: 0,
      createdAt: Date.now() - 3 * 86400000
    }
  ])
  const [artworks, setArtworks] = useState([])
  const [currentMix, setCurrentMix] = useState(null)
  const [settings, setSettings] = useState({
    screenDown: true,
    dnd: false,
    completeNotice: true
  })

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const addArtwork = useCallback((art) => {
    setArtworks((prev) => [{ ...art, id: 'a' + Date.now() }, ...prev])
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

  const deletePreset = useCallback((id) => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      user, setUser,
      favorites, toggleFavorite,
      presets, savePreset, deletePreset,
      artworks, addArtwork,
      currentMix, setCurrentMix,
      settings, setSettings
    }),
    [user, favorites, presets, artworks, currentMix, settings, toggleFavorite, addArtwork, savePreset, deletePreset]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
