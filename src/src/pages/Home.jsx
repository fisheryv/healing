import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CirclePlay, Blend } from 'lucide-react'
import { useApp } from '../store.jsx'
import { recommendations, blogs, officialMusic } from '../data.js'

function localized(field, lang) {
  if (field && typeof field === 'object' && (field.zh || field.en)) {
    return field[lang] || field.en
  }
  return field
}

export default function Home() {
  const nav = useNavigate()
  const { user, favorites, t, lang } = useApp()
  const favList = officialMusic.filter((m) => favorites.includes(m.id)).slice(0, 5)

  return (
    <div>
      <div className="greeting">
        <div className="welcome">{t('home.welcome')}, {user?.nickname || t('common.friend')}</div>
        <div className="feel">
          {t('home.feelToday').split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="page-pad">
        <div className="card-hero focus-entry">
          <div className="text">
            <p>{t('home.focusTitle').split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </React.Fragment>
            ))}</p>
            <button className="btn focus-start-btn" onClick={() => nav('/focus/config')}>
              <CirclePlay size={14} strokeWidth={1} color="#111" />
              {t('home.startBtn')}
            </button>
          </div>
          <img className="focus-entry-img" src="assets/focus-02.png" alt="" />
        </div>

        <div className="section-title">
          <h3>{t('home.recommended')}</h3>
          <span className="more" onClick={() => nav('/library')} style={{ cursor: 'pointer' }}>{t('common.more')} ›</span>
        </div>

        <div className="h-scroll">
          {recommendations.map((r) => (
            <div className="tile" key={r.id} onClick={() => nav(`/player/${r.id.replace('r', 'm')}`)} style={{ cursor: 'pointer' }}>
              <div className="cover"><img src={r.cover} alt="" /></div>
              <div className="name">{localized(r.name, lang)}</div>
              <div className="tag">{localized(r.tag, lang)}</div>
            </div>
          ))}
        </div>

        {favList.length > 0 && (
          <>
            <div className="section-title">
              <h3>{t('home.favorites')}</h3>
              <span className="more" onClick={() => nav('/library', { state: { tab: 'fav' } })}>{t('common.more')} ›</span>
            </div>
            <div className="list">
              {favList.map((m) => (
                <div className="row" key={m.id} onClick={() => nav(`/player/${m.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="thumb"><img src={m.cover} alt="" /></div>
                  <div className="info">
                    <div className="name">{localized(m.name, lang)}</div>
                    <div className="meta">{localized(m.tag, lang)} · {m.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="card-hero mix-entry">
          <img className="mix-entry-img" src="assets/focus-01.png" alt="" />
          <div className="text mix-entry-text">
            <p>{t('home.mixTitle').split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </React.Fragment>
            ))}</p>
            <button className="btn focus-start-btn mix-start-btn" onClick={() => nav('/mixer')}>
              <Blend size={14} strokeWidth={1} color="#111" />
              {t('home.mixSpace')}
            </button>
          </div>
        </div>

        <div className="section-title">
          <h3>{t('home.blog')}</h3>
          <span className="more" onClick={() => nav('/blog')} style={{ cursor: 'pointer' }}>{t('common.more')} ›</span>
        </div>
        <div>
          {blogs.slice(0, 3).map((b) => (
            <div className="blog-row" key={b.id} onClick={() => nav(`/blog/${b.id}`)} style={{ cursor: 'pointer' }}>
              <div className="blog-body">
                <div className="title">{localized(b.title, lang)}</div>
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
