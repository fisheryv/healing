import { useNavigate } from 'react-router-dom'
import { CirclePlay, Blend } from 'lucide-react'
import { useApp } from '../store.jsx'
import { recommendations, blogs, officialMusic } from '../data.js'

export default function Home() {
  const nav = useNavigate()
  const { user, favorites } = useApp()
  const favList = officialMusic.filter((m) => favorites.includes(m.id)).slice(0, 5)

  return (
    <div>
      <div className="greeting">
        <div className="welcome">Welcome Back, {user?.nickname || 'Friend'}</div>
        <div className="feel">
          How are you feeling
          <br />today?
        </div>
      </div>

      <div className="page-pad">
        <div className="card-hero focus-entry">
          <div className="text">
            <p>Begin your focus journey<br/>Right Now</p>
            <button className="btn focus-start-btn" onClick={() => nav('/focus/config')}>
              <CirclePlay size={14} strokeWidth={1} color="#111" />
              Start
            </button>
          </div>
          <img className="focus-entry-img" src="assets/focus-02.png" alt="" />
        </div>

        <div className="section-title">
          <h3>Recommended</h3>
          <span className="more" onClick={() => nav('/library')} style={{ cursor: 'pointer' }}>More ›</span>
        </div>

        <div className="h-scroll">
          {recommendations.map((r) => (
            <div className="tile" key={r.id} onClick={() => nav(`/player/${r.id.replace('r', 'm')}`)} style={{ cursor: 'pointer' }}>
              <div className="cover"><img src={r.cover} alt="" /></div>
              <div className="name">{r.name}</div>
              <div className="tag">{r.tag}</div>
            </div>
          ))}
        </div>

        {favList.length > 0 && (
          <>
            <div className="section-title">
              <h3>Favorites</h3>
              <span className="more" onClick={() => nav('/library')}>More ›</span>
            </div>
            <div className="list">
              {favList.map((m) => (
                <div className="row" key={m.id} onClick={() => nav(`/player/${m.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="thumb"><img src={m.cover} alt="" /></div>
                  <div className="info">
                    <div className="name">{m.name}</div>
                    <div className="meta">{m.tag} · {m.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="card-hero mix-entry">
          <img className="mix-entry-img" src="assets/focus-01.png" alt="" />
          <div className="text mix-entry-text">
            <p>Mix your own unique<br/>sound</p>
            <button className="btn focus-start-btn mix-start-btn" onClick={() => nav('/mixer')}>
              <Blend size={14} strokeWidth={1} color="#111" />
              Mix Space
            </button>
          </div>
        </div>

        <div className="section-title">
          <h3>Blog</h3>
          <span className="more" onClick={() => nav('/blog')} style={{ cursor: 'pointer' }}>More ›</span>
        </div>
        <div>
          {blogs.slice(0, 3).map((b) => (
            <div className="blog-row" key={b.id} onClick={() => nav(`/blog/${b.id}`)} style={{ cursor: 'pointer' }}>
              <div className="blog-body">
                <div className="title">{b.title}</div>
                <div className="date">{b.date}</div>
              </div>
              <img className="blog-thumb" src={b.image} alt="" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
