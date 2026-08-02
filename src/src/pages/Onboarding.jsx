import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const nav = useNavigate()
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(0)
  const touchDelta = useRef(0)
  const [dragging, setDragging] = useState(false)

  const goTo = useCallback((i) => {
    setCurrent(Math.max(0, Math.min(2, i)))
  }, [])

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    setDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!dragging) return
    touchDelta.current = e.touches[0].clientX - touchStartX.current
  }

  const handleTouchEnd = () => {
    setDragging(false)
    if (Math.abs(touchDelta.current) > 50) {
      if (touchDelta.current < 0) goTo(current + 1)
      else goTo(current - 1)
    }
    touchDelta.current = 0
  }

  const handleStart = () => {
    nav('/login', { replace: true })
  }

  return (
    <div
      className="onboarding"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="onboarding-track"
        style={{ transform: `translateX(-${current * 100}%)`, transition: dragging ? 'none' : 'transform 0.4s ease' }}
      >
        {/* Slide 1: image bottom-left, text top-right */}
        <div className="onboarding-slide slide-1">
          <div className="slide-1-image">
            <img src="assets/onboarding01.png" alt="" />
          </div>
          <div className={`slide-1-text ${current === 0 ? 'active' : ''}`}>
            <h1 className="onboarding-title">Music is the art of time.</h1>
            <p className="onboarding-subtitle">Here, time is not a count to race against, but an art that grows in stillness.</p>
          </div>
        </div>

        {/* Slide 2: image bottom-right, text top-left */}
        <div className="onboarding-slide slide-2">
          <div className="slide-2-image">
            <img src="assets/onboarding02.png" alt="" />
          </div>
          <div className={`slide-2-text ${current === 1 ? 'active' : ''}`}>
            <h1 className="onboarding-title">Mix your inner peace.</h1>
            <p className="onboarding-subtitle">Slide your fingertips — let music block out the noise around you.</p>
          </div>
        </div>

        {/* Slide 3: Healing + image center, text + button below */}
        <div className="onboarding-slide slide-3">
          <div className="slide-3-content">
            <div className={`slide-3-top ${current === 2 ? 'active' : ''}`}>
              <img className="onboarding-logo" src="assets/logo2.png" alt="" />
              <div className="onboarding-app-name">Healing</div>
            </div>
            <div className="slide-3-image">
              <img src="assets/onboarding03.png" alt="" />
            </div>
            <div className={`slide-3-bottom ${current === 2 ? 'active' : ''}`}>
              <p className="onboarding-subtitle" style={{ textAlign: 'center' }}>Start a mindful journey of art and spirit.</p>
              <button className="btn onboarding-start-btn" onClick={handleStart}>Start</button>
            </div>
          </div>
        </div>
      </div>

      <div className="onboarding-dots">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`onboarding-dot ${i === current ? 'active' : ''}`} onClick={() => goTo(i)} />
        ))}
      </div>
    </div>
  )
}
