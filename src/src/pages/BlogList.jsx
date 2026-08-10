import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useApp } from '../store.jsx'
import { blogs } from '../data.js'

function localized(field, lang) {
  if (field && typeof field === 'object' && (field.zh || field.en)) {
    return field[lang] || field.en
  }
  return field
}

export default function BlogList() {
  const nav = useNavigate()
  const { t, lang } = useApp()
  const sorted = [...blogs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return (
    <div className="blog-list">
      <div className="page-header">
        <button className="back-btn" onClick={() => nav('/home')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        <h1 className="page-title">{t('blog.title')}</h1>
        <span className="page-header-spacer" />
      </div>

      <div className="page-pad">
        <div className="blog-list-count">{sorted.length} {t('common.articles')}</div>
        <div className="blog-list-items">
          {sorted.map((b) => (
            <div
              className="blog-list-row"
              key={b.id}
              onClick={() => nav(`/blog/${b.id}`)}
            >
              <img className="blog-list-thumb" src={b.image} alt="" />
              <div className="blog-list-body">
                <div className="title">{localized(b.title, lang)}</div>
                {b.summary && <div className="summary">{localized(b.summary, lang)}</div>}
                <div className="meta">
                  <span>{b.date}</span>
                  {b.readMins && <span className="dot">·</span>}
                  {b.readMins && <span>{b.readMins} {t('common.minRead')}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}