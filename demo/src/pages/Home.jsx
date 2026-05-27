import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { recommendations, blogs, officialMusic } from '../data.js'

export default function Home() {
  const nav = useNavigate()
  const { user, favorites } = useApp()
  const favList = officialMusic.filter((m) => favorites.includes(m.id)).slice(0, 5)

  return (
    <div>
      <div className="greeting">
        <div className="welcome">Welcome Back, {user?.nickname || '希音'}</div>
        <div className="feel">
          How are you feeling
          <br />today?
        </div>
      </div>

      <div className="page-pad">
        <div className="card-hero">
          <div className="text">
            <p>开启今日的专注之旅</p>
            <button className="btn" onClick={() => nav('/focus/config')}>Begin</button>
          </div>
          <div className="hero-illust" />
        </div>

        <div className="section-title">
          <h3>Recommended</h3>
          <span className="more">More ›</span>
        </div>

        <div className="h-scroll">
          {recommendations.map((r) => (
            <div className="tile" key={r.id}>
              <div className="cover">♪</div>
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
                <div className="row" key={m.id}>
                  <div className="thumb">♪</div>
                  <div className="info">
                    <div className="name">{m.name}</div>
                    <div className="meta">{m.tag} · {m.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="section-title">
          <h3>Blog</h3>
          <span className="more">More ›</span>
        </div>

        <div>
          {blogs.map((b) => (
            <div className="blog-row" key={b.id}>
              <div className="title">{b.title}</div>
              <div className="excerpt">{b.excerpt}</div>
              <div className="date">{b.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
