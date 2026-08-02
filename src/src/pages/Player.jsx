import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Play, Pause, SkipBack, SkipForward, ListMusic, VolumeX, Heart, Blend, Target, Repeat, ChevronLeft } from 'lucide-react'
import { officialMusic } from '../data.js'

export default function Player() {
  const { id } = useParams()
  const nav = useNavigate()
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [showVolume, setShowVolume] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  const currentIndex = officialMusic.findIndex(m => m.id === id)
  const song = officialMusic[currentIndex >= 0 ? currentIndex : 0]

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
    setIsPlaying(!isPlaying)
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      nav(`/player/${officialMusic[currentIndex - 1].id}`)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }

  const handleNext = () => {
    if (currentIndex < officialMusic.length - 1) {
      nav(`/player/${officialMusic[currentIndex + 1].id}`)
      setIsPlaying(false)
      setCurrentTime(0)
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

  return (
    <div className="player-page">
      <div className="player-header">
        <button className="back-btn" onClick={() => nav(-1)}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        <button 
          className={`fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={() => setIsFavorite(!isFavorite)}
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
        <button className="action-btn-outline" onClick={() => nav('/mixer')}>
          <Blend size={16} strokeWidth={1.5} />
          Mix Space
        </button>
        <button className="action-btn-fill" onClick={() => nav('/focus/config')}>
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
        <button className="control-btn">
          <Repeat size={22} strokeWidth={1.5} />
        </button>
        <button className="control-btn" onClick={handlePrev} disabled={currentIndex <= 0}>
          <SkipBack size={26} strokeWidth={1.5} />
        </button>
        <button className="play-btn" onClick={togglePlay}>
          {isPlaying ? <Pause size={32} strokeWidth={1.5} /> : <Play size={32} strokeWidth={1.5} />}
        </button>
        <button className="control-btn" onClick={handleNext} disabled={currentIndex >= officialMusic.length - 1}>
          <SkipForward size={26} strokeWidth={1.5} />
        </button>
        <div className="volume-wrapper">
          <button className="control-btn" onClick={toggleVolume}>
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

      <audio
        ref={audioRef}
        src={`assets/audio/${song.id}.mp3`}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration)
        }}
        onEnded={handleNext}
        onError={() => {
          setDuration(1800)
        }}
      />
    </div>
  )
}
