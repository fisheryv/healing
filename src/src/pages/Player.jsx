import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Play, Pause, SkipBack, SkipForward, ListMusic, VolumeX, Heart, Blend, Target, Repeat, Repeat1, Shuffle, ChevronLeft } from 'lucide-react'
import { officialMusic } from '../data.js'
import { useApp } from '../store.jsx'

export default function Player() {
  const { id } = useParams()
  const nav = useNavigate()
  const audioRef = useRef(null)
  const { favorites, toggleFavorite, setCurrentMix, currentMix } = useApp()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [showVolume, setShowVolume] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  // 播放模式：'order' 顺序播放 / 'repeat' 单曲循环 / 'shuffle' 随机播放
  const [playMode, setPlayMode] = useState('order')
  // 随机模式下的乱序列表（id 数组）；order 模式下为 null
  const [shuffleOrder, setShuffleOrder] = useState(null)

  // 活动播放列表：order 模式为原始有序列表，shuffle 模式为乱序列表
  const playList = useMemo(() => {
    if (playMode === 'shuffle' && shuffleOrder) {
      return shuffleOrder
        .map((sid) => officialMusic.find((m) => m.id === sid))
        .filter(Boolean)
    }
    return officialMusic
  }, [playMode, shuffleOrder])

  const currentIndex = playList.findIndex((m) => m.id === id)
  const song = playList[currentIndex >= 0 ? currentIndex : 0] || officialMusic[0]
  const isFavorite = favorites.includes(song.id)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  // 组件卸载时暂停音频，避免离开页面后原生 <audio> 继续播放
  // 注意：不要在这里清空 src 或调用 load()——React 18 StrictMode 在开发环境
  // 会先 mount→unmount→mount 一次，cleanup 中的 src='' 会破坏第二次挂载时的加载。
  useEffect(() => {
    return () => {
      const el = audioRef.current
      if (el) {
        try { el.pause() } catch (e) { /* noop */ }
      }
    }
  }, [])

  // 切歌时重置进度状态。不调用 el.load()——
  // 通过给 <audio> 加 key={song.id}，切歌时 React 会自动重建元素，
  // 浏览器自然加载新 src，不会出现 useEffect 与浏览器加载互相中断的问题。
  // 切歌时重置进度状态。不调用 el.load()——
  // 通过给 <audio> 加 key={song.id}，切歌时 React 会自动重建元素，
  // 浏览器自然加载新 src，不会出现 useEffect 与浏览器加载互相中断的问题。
  // 自动播放：尝试在 useEffect 中调用 play()。移动端（尤其 iOS Safari）
  // 可能因自动播放策略拒绝，此时显示"点击播放"遮罩，让用户手动触发。
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)

  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
    setAutoplayBlocked(false)
    const el = audioRef.current
    if (el) {
      // 等元数据加载后再尝试播放
      const tryPlay = () => {
        const p = el.play()
        if (p && typeof p.then === 'function') {
          p.then(() => {
            setIsPlaying(true)
            setAutoplayBlocked(false)
          }).catch(() => {
            // 自动播放被拒绝（移动端 autoplay policy）
            setIsPlaying(false)
            setAutoplayBlocked(true)
          })
        } else {
          setIsPlaying(true)
        }
      }
      // onLoadedMetadata 触发时尝试播放；若已加载则直接播放
      if (el.readyState >= 1) {
        tryPlay()
      } else {
        el.addEventListener('loadedmetadata', tryPlay, { once: true })
        return () => el.removeEventListener('loadedmetadata', tryPlay)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // 跳转到调音台/专注前先暂停原生 audio，避免与 audioEngine 重叠播放
  const pauseNativeAudio = () => {
    const el = audioRef.current
    if (el) {
      try { el.pause() } catch (e) { /* noop */ }
      setIsPlaying(false)
    }
  }

  const togglePlay = () => {
    const el = audioRef.current
    if (!el) return
    if (isPlaying) {
      el.pause()
      setIsPlaying(false)
    } else {
      // 兜底：若元数据尚未就绪（duration 为 0 或 NaN），强制重新加载
      // 这能应对 StrictMode 双挂载、cleanup 清 src 等导致 audio 未正常加载的情况
      if (!el.duration || isNaN(el.duration)) {
        try { el.load() } catch (e) { /* noop */ }
      }
      const p = el.play()
      if (p && typeof p.then === 'function') {
        p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
      } else {
        setIsPlaying(true)
      }
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      pauseNativeAudio()
      nav(`/player/${playList[currentIndex - 1].id}`)
      setCurrentTime(0)
    }
  }

  const handleNext = () => {
    if (currentIndex < playList.length - 1) {
      pauseNativeAudio()
      nav(`/player/${playList[currentIndex + 1].id}`)
      setCurrentTime(0)
    }
  }

  // 生成乱序列表：当前歌曲放第一位，其余随机打乱
  const buildShuffleOrder = (currentSongId) => {
    const others = officialMusic.filter((m) => m.id !== currentSongId)
    // Fisher-Yates 洗牌
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[others[i], others[j]] = [others[j], others[i]]
    }
    return [currentSongId, ...others.map((m) => m.id)]
  }

  // 切换播放模式：order -> repeat -> shuffle -> order ...
  const cyclePlayMode = () => {
    setPlayMode((m) => {
      if (m === 'order') {
        return 'repeat'
      } else if (m === 'repeat') {
        // 进入 shuffle：以当前歌曲为起点生成乱序列表
        setShuffleOrder(buildShuffleOrder(song.id))
        return 'shuffle'
      } else {
        // 回到 order：清掉乱序列表，恢复有序
        setShuffleOrder(null)
        return 'order'
      }
    })
  }

  // 播放结束处理：根据播放模式决定行为
  const handleEnded = () => {
    if (playMode === 'repeat') {
      // 单曲循环：重置进度并重新播放
      const el = audioRef.current
      if (el) {
        el.currentTime = 0
        const p = el.play()
        if (p && typeof p.then === 'function') {
          p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
        } else {
          setIsPlaying(true)
        }
      }
    } else if (playMode === 'shuffle') {
      // 随机模式：沿乱序列表前进；到末尾则停留（与顺序播放末尾行为一致）
      handleNext()
    } else {
      handleNext()
    }
  }

  const handleProgressChange = (e) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleVolumeChange = (e) => {
    setVolume(parseInt(e.target.value))
  }

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const toggleVolume = () => {
    setShowVolume(!showVolume)
  }

  const handleSelectSong = (songId) => {
    pauseNativeAudio()
    nav(`/player/${songId}`)
    setShowPlaylist(false)
    setCurrentTime(0)
  }

  return (
    <div className="player-page">
      <div className="player-header">
        <button className="back-btn" onClick={() => { pauseNativeAudio(); nav('/library') }}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        <button 
          className={`fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={() => toggleFavorite(song.id)}
        >
          <Heart size={20} strokeWidth={1.5} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="player-cover">
        <div className="player-cover-inner">
          <img src={song.cover} alt={song.name} />
        </div>
        <div className="player-info">
          <h1 className="player-title">{song.name}</h1>
          <p className="player-type">{song.tag} Music</p>
        </div>
      </div>

      <div className="player-actions">
        <button className="action-btn-outline" onClick={() => {
          pauseNativeAudio()
          // 预置该歌曲为主音乐，跳转调音台。
          // 只替换 main music，保留 currentMix 中已有的 noise/ambient/binaural（若有）。
          const prev = currentMix || {}
          setCurrentMix({
            name: prev.name || song.name,
            mainMusicId: song.id,
            mainMusicTitle: song.name,
            mainVolume: prev.mainVolume != null ? prev.mainVolume : 0.7,
            bgNoise: prev.bgNoise ?? null,
            bgVolume: prev.bgVolume != null ? prev.bgVolume : 0.5,
            ambient: prev.ambient ?? [],
            binaural: prev.binaural ?? null,
            binauralVolume: prev.binauralVolume != null ? prev.binauralVolume : 0
          })
          nav('/mixer')
        }}>
          <Blend size={16} strokeWidth={1.5} />
          Mix Space
        </button>
        <button className="action-btn-fill" onClick={() => {
          pauseNativeAudio()
          nav('/focus/config', { state: { mix: {
            name: song.name,
            mainMusicId: song.id,
            mainMusicTitle: song.name,
            mainVolume: 0.7,
            bgNoise: null,
            bgVolume: 0.5,
            ambient: [],
            binaural: null,
            binauralVolume: 0
          } } })
        }}>
          <Target size={16} strokeWidth={1.5} />
          Begin Focus
        </button>
      </div>

      <div className="player-progress">
        <span className="time current">{formatTime(currentTime)}</span>
        <input 
          type="range" 
          min={0} 
          max={duration || 0} 
          value={currentTime} 
          step={0.1}
          onChange={handleProgressChange}
          className="progress-slider"
          style={{
            background: `linear-gradient(to right, var(--ink) 0%, var(--ink) ${duration ? (currentTime / duration) * 100 : 0}%, var(--line-strong) ${duration ? (currentTime / duration) * 100 : 0}%, var(--line-strong) 100%)`
          }}
        />
        <span className="time total">{formatTime(duration)}</span>
      </div>

      <div className="player-controls">
        <button
          className={'control-btn mode-' + playMode}
          onClick={cyclePlayMode}
          aria-label={`Play mode: ${playMode}`}
          title={playMode === 'order' ? 'Order' : playMode === 'repeat' ? 'Repeat One' : 'Shuffle'}
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
        <button className="control-btn" onClick={handleNext} disabled={currentIndex >= playList.length - 1}>
          <SkipForward size={26} strokeWidth={1.5} />
        </button>
        <div className="volume-wrapper">
          <button className="control-btn" onClick={() => setShowPlaylist(true)}>
            <ListMusic size={22} strokeWidth={1.5} />
          </button>
          {showVolume && (
            <div className="volume-slider-container">
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                orient="vertical"
              />
            </div>
          )}
        </div>
      </div>

      <div className="player-hint">
        <img className="airpod airpod-left" src="assets/airpod.png" alt="" />
        <span>Best with Headphones</span>
        <img className="airpod airpod-right" src="assets/airpod.png" alt="" />
      </div>

      {autoplayBlocked && !isPlaying && (
        <div className="tap-to-play-overlay" onClick={togglePlay}>
          <div className="play-icon-circle">
            <Play size={40} strokeWidth={1.5} />
          </div>
          <span>Tap to Play</span>
        </div>
      )}

      <audio
        key={song.id}
        ref={audioRef}
        src={`sound/music/${song.id}.mp3`}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration)
          }
        }}
        onEnded={handleEnded}
        onError={() => {
          // 音频加载/解码失败时不要假装一个假的 duration，否则用户点了播放也没反应
          // 保留 duration=0，让用户看到真实的"无法加载"状态
          setIsPlaying(false)
        }}
      />

      {showPlaylist && (
        <div className="sheet-mask" onClick={() => setShowPlaylist(false)}>
          <div className="sheet playlist-sheet" onClick={(e) => e.stopPropagation()}>
            <h4>Up Next</h4>
            {playList.map((m, i) => (
              <div
                key={m.id}
                className={'opt' + (m.id === song.id ? ' playing' : '')}
                onClick={() => handleSelectSong(m.id)}
              >
                <div className="left">
                  <div>{m.name}</div>
                  <div className="desc">{m.tag} Music · {m.duration}</div>
                </div>
                {m.id === song.id && <span className="now-playing-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
