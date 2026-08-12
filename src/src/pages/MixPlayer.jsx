import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Play, Pause, SkipBack, SkipForward, ListMusic, Target, Blend, ChevronLeft, Repeat, Repeat1, Shuffle } from 'lucide-react'
import { useApp } from '../store.jsx'
import { officialMusic, buildSrcMap, findMusicById } from '../data.js'
import * as audioEngine from '../audioEngine.js'

function localized(field, lang) {
  if (field && typeof field === 'object' && (field.zh || field.en)) {
    return field[lang] || field.en
  }
  return field
}

export default function MixPlayer() {
  const { index } = useParams()
  const nav = useNavigate()
  const { presets, setCurrentMix, currentMix, lang, resolvedTheme, t } = useApp()

  // 播放列表就是 presets 列表
  const playList = presets
  const idx = Math.max(0, Math.min(playList.length - 1, parseInt(index || '0', 10)))
  const mix = playList[idx] || null

  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0) // 累计播放秒数
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  // 播放模式：'order' / 'repeat' / 'shuffle'
  const [playMode, setPlayMode] = useState('order')
  const [shuffleOrder, setShuffleOrder] = useState(null)
  const [showPlaylist, setShowPlaylist] = useState(false)

  const timerRef = useRef(null)

  // 当前 mix 对应的主音乐（用于封面、tag 展示）
  const mainMusic = useMemo(() => {
    if (!mix?.mainMusicId) return null
    return findMusicById(mix.mainMusicId) || null
  }, [mix?.mainMusicId])

  // 主音乐时长（秒）：解析 "mm:ss" 字符串
  const durationSec = useMemo(() => {
    const d = mainMusic?.duration
    if (!d) return 0
    const m = d.match(/^(\d+):(\d+)$/)
    if (!m) return 0
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
  }, [mainMusic?.duration])

  // 活动 playList（shuffle 模式下使用乱序列表）
  const activeList = useMemo(() => {
    if (playMode === 'shuffle' && shuffleOrder) {
      return shuffleOrder
        .map((sid) => playList.find((p) => p.id === sid))
        .filter(Boolean)
    }
    return playList
  }, [playMode, shuffleOrder, playList])

  const currentIndex = activeList.findIndex((p) => p && p.id === mix?.id)

  // 计时器：播放时每秒递增 elapsed，到主音乐结束时按播放模式处理
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1
        // 到主音乐时长：按播放模式决定行为
        if (durationSec > 0 && next >= durationSec) {
          if (playMode === 'repeat') {
            // 单曲循环：重置进度并继续播放（mix 本身循环，保持 isPlaying）
            return 0
          } else if (playMode === 'shuffle') {
            handleNext()
            return 0
          } else {
            // order：若有下一首则切，否则停止
            if (currentIndex < activeList.length - 1) {
              handleNext()
              return 0
            } else {
              audioEngine.stopAll()
              setIsPlaying(false)
              return durationSec
            }
          }
        }
        return next
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, durationSec, playMode, currentIndex, activeList.length])

  // 切歌或卸载时停止音频
  useEffect(() => {
    return () => {
      audioEngine.stopAll()
    }
  }, [])

  // index 变化时：重置状态并尝试自动播放
  useEffect(() => {
    if (!mix) return
    setElapsed(0)
    setAutoplayBlocked(false)
    setIsPlaying(false)

    audioEngine.resumeContext()
    const srcMap = buildSrcMap()
    audioEngine.loadMix(mix, srcMap).then(() => {
      // 尝试自动播放
      // 由于 loadMix 内部已经 ensureCtx + resume，audioEngine 此时已经在播放
      // 但 iOS 可能因 autoplay policy 阻止，通过 resumeContext 的返回状态判断
      if (audioEngine.isActive()) {
        setIsPlaying(true)
      } else {
        setAutoplayBlocked(true)
      }
    }).catch(() => {
      setAutoplayBlocked(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const togglePlay = () => {
    if (!mix) return
    if (isPlaying) {
      audioEngine.stopAll()
      setIsPlaying(false)
    } else {
      audioEngine.resumeContext()
      const srcMap = buildSrcMap()
      audioEngine.loadMix(mix, srcMap)
      setIsPlaying(true)
      setAutoplayBlocked(false)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevMix = activeList[currentIndex - 1]
      const realIdx = playList.findIndex((p) => p.id === prevMix.id)
      if (realIdx >= 0) nav(`/mix-player/${realIdx}`)
    }
  }

  const handleNext = () => {
    if (currentIndex < activeList.length - 1) {
      const nextMix = activeList[currentIndex + 1]
      const realIdx = playList.findIndex((p) => p.id === nextMix.id)
      if (realIdx >= 0) nav(`/mix-player/${realIdx}`)
    }
  }

  const buildShuffleOrder = (currentId) => {
    const others = playList.filter((p) => p.id !== currentId)
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[others[i], others[j]] = [others[j], others[i]]
    }
    return [currentId, ...others.map((p) => p.id)]
  }

  const cyclePlayMode = () => {
    setPlayMode((m) => {
      if (m === 'order') {
        return 'repeat'
      } else if (m === 'repeat') {
        if (mix) setShuffleOrder(buildShuffleOrder(mix.id))
        return 'shuffle'
      } else {
        setShuffleOrder(null)
        return 'order'
      }
    })
  }

  const handleSelectMix = (mixId) => {
    const realIdx = playList.findIndex((p) => p.id === mixId)
    if (realIdx >= 0) nav(`/mix-player/${realIdx}`)
    setShowPlaylist(false)
  }

  const formatTime = (sec) => {
    if (sec == null || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!mix) {
    return (
      <div className="player-page">
        <div className="player-header">
          <button className="back-btn" onClick={() => nav('/library')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' }}>
          {t('library.noPresets')}
        </div>
      </div>
    )
  }

  // 展示封面：优先用主音乐封面，否则用占位
  const cover = mainMusic?.cover || null

  // 构造副标题：包含主音乐、背景噪音、双耳节拍
  const subtitleParts = []
  if (mix.mainMusicTitle) subtitleParts.push(localized(mix.mainMusicTitle, lang))
  if (mix.bgNoise) subtitleParts.push(localized(mix.bgNoise.name, lang))
  if (mix.binaural) {
    subtitleParts.push(lang === 'zh' ? localized(mix.binaural.name, lang) + t('mixer.wave') : localized(mix.binaural.name, lang) + ' ' + t('mixer.wave'))
  }

  return (
    <div className="player-page">
      <div className="player-header">
        <button className="back-btn" onClick={() => { audioEngine.stopAll(); nav('/library') }}><ChevronLeft size={24} strokeWidth={1.5} /></button>
      </div>

      <div className="player-cover">
        <div className="player-cover-inner">
          {cover ? (
            <img src={cover} alt={mix.name} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'var(--ink-muted)', fontFamily: 'var(--serif-en)' }}>≋</div>
          )}
        </div>
        <div className="player-info">
          <h1 className="player-title">{mix.name}</h1>
          <p className="player-type">{subtitleParts.join(' · ')}</p>
        </div>
      </div>

      <div className="player-actions">
        <button className="action-btn-outline" onClick={() => {
          audioEngine.stopAll()
          // 跳转调音台并预置该 mix 为当前 currentMix
          setCurrentMix(mix)
          nav('/mixer')
        }}>
          <Blend size={16} strokeWidth={1.5} />
          {t('home.mixSpace')}
        </button>
        <button className="action-btn-fill" onClick={() => {
          audioEngine.stopAll()
          setCurrentMix(mix)
          nav('/focus/config', { state: { mix } })
        }}>
          <Target size={16} strokeWidth={1.5} />
          {t('focusConfig.beginFocus')}
        </button>
      </div>

      <div className="player-progress">
        <span className="time current">{formatTime(Math.min(elapsed, durationSec))}</span>
        <input
          type="range"
          min={0}
          max={durationSec || 0}
          value={Math.min(elapsed, durationSec)}
          step={1}
          readOnly
          className="progress-slider"
          style={{
            background: `linear-gradient(to right, var(--ink) 0%, var(--ink) ${durationSec ? (Math.min(elapsed, durationSec) / durationSec) * 100 : 0}%, var(--line-strong) ${durationSec ? (Math.min(elapsed, durationSec) / durationSec) * 100 : 0}%, var(--line-strong) 100%)`
          }}
        />
        <span className="time total">{formatTime(durationSec)}</span>
      </div>

      <div className="player-controls">
        <button
          className={'control-btn mode-' + playMode}
          onClick={cyclePlayMode}
          aria-label={`Play mode: ${playMode}`}
          title={playMode === 'order' ? t('player.order') : playMode === 'repeat' ? t('player.repeatOne') : t('player.shuffle')}
        >
          {playMode === 'order' && <Repeat size={22} strokeWidth={1.5} />}
          {playMode === 'repeat' && <Repeat1 size={22} strokeWidth={1.5} />}
          {playMode === 'shuffle' && <Shuffle size={22} strokeWidth={1.5} />}
        </button>
        <button className="control-btn" onClick={handlePrev} disabled={currentIndex <= 0}>
          <SkipBack size={26} strokeWidth={1.5} />
        </button>
        <button className="play-btn" onClick={togglePlay}>
          {isPlaying ? <Pause size={32} strokeWidth={1.5} /> : <Play size={32} strokeWidth={1.5} />}
        </button>
        <button className="control-btn" onClick={handleNext} disabled={currentIndex >= activeList.length - 1}>
          <SkipForward size={26} strokeWidth={1.5} />
        </button>
        <div className="volume-wrapper">
          <button className="control-btn" onClick={() => setShowPlaylist(true)}>
            <ListMusic size={22} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="player-hint">
        <img className="airpod airpod-left" src={resolvedTheme === 'dark' ? 'assets/airpod_white.png' : 'assets/airpod.png'} alt="" />
        <span>{t('focusConfig.bestWithHeadphones')}</span>
        <img className="airpod airpod-right" src={resolvedTheme === 'dark' ? 'assets/airpod_white.png' : 'assets/airpod.png'} alt="" />
      </div>

      {autoplayBlocked && !isPlaying && (
        <div className="tap-to-play-overlay" onClick={togglePlay}>
          <div className="play-icon-circle">
            <Play size={40} strokeWidth={1.5} />
          </div>
          <span>{t('player.tapToPlay')}</span>
        </div>
      )}

      {showPlaylist && (
        <div className="sheet-mask" onClick={() => setShowPlaylist(false)}>
          <div className="sheet playlist-sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{t('player.upNext')}</h4>
            {activeList.map((p) => (
              <div
                key={p.id}
                className={'opt' + (p.id === mix.id ? ' playing' : '')}
                onClick={() => handleSelectMix(p.id)}
              >
                <div className="left">
                  <div>{p.name}</div>
                  <div className="desc">
                    {p.mainMusicTitle && localized(p.mainMusicTitle, lang)}
                    {p.bgNoise ? ' · ' + localized(p.bgNoise.name, lang) : ''}
                    {p.binaural ? ' · ' + localized(p.binaural.name, lang) : ''}
                  </div>
                </div>
                {p.id === mix.id && <span className="now-playing-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
