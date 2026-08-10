import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useApp } from '../store.jsx'
import { blogs } from '../data.js'

function localized(field, lang) {
  if (field && typeof field === 'object' && (field.zh || field.en)) {
    return field[lang] || field.en
  }
  return field
}

export default function BlogDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t, lang } = useApp()
  const blog = blogs.find((b) => b.id === id)

  if (!blog) {
    return (
      <div className="blog-detail">
        <div className="page-header">
          <button className="back-btn" onClick={() => nav('/home')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
          <h1 className="page-title">{t('blog.title')}</h1>
          <span className="page-header-spacer" />
        </div>
        <div className="empty" style={{ marginTop: 100, textAlign: 'center' }}>
          <p>{t('blog.articleNotFound')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="blog-detail">
      <div className="page-header">
        <button className="back-btn" onClick={() => nav('/blog')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        <h1 className="page-title">{t('blog.article')}</h1>
        <span className="page-header-spacer" />
      </div>

      <article className="blog-article">
        <header className="blog-article-header">
          <h1 className="blog-article-title">{localized(blog.title, lang)}</h1>
          {blog.summary && <p className="blog-article-summary">{localized(blog.summary, lang)}</p>}
          <div className="blog-article-meta">
            {blog.author && <span>{localized(blog.author, lang)}</span>}
            <span className="dot">·</span>
            <span>{blog.date}</span>
            {blog.readMins && <span className="dot">·</span>}
            {blog.readMins && <span>{blog.readMins} {t('common.minRead')}</span>}
          </div>
        </header>

        {blog.image && (
          <img className="blog-article-cover" src={blog.image} alt="" />
        )}

        <div className="blog-article-content">
          {blog.content.map((block, i) => {
            if (block.type === 'h2') {
              return <h2 key={i} className="blog-h2">{localized(block.text, lang)}</h2>
            }
            if (block.type === 'img') {
              return (
                <figure key={i} className="blog-figure">
                  <img src={block.src} alt={block.caption ? localized(block.caption, lang) : ''} />
                  {block.caption && <figcaption>{localized(block.caption, lang)}</figcaption>}
                </figure>
              )
            }
            return <p key={i} className="blog-p">{localized(block.text, lang)}</p>
          })}
        </div>

        <footer className="blog-article-footer">
          <div className="blog-article-actions">
            <button className="btn ghost" onClick={() => nav('/blog')}>{t('blog.allArticles')}</button>
            <button className="btn ghost" onClick={() => nav('/home')}>{t('blog.backHome')}</button>
          </div>
        </footer>
      </article>
    </div>
  )
}