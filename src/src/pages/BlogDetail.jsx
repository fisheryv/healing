import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { blogs } from '../data.js'

export default function BlogDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const blog = blogs.find((b) => b.id === id)

  if (!blog) {
    return (
      <div className="blog-detail">
        <div className="page-header">
          <button className="back-btn" onClick={() => nav('/home')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
          <h1 className="page-title">Blog</h1>
          <span className="page-header-spacer" />
        </div>
        <div className="empty" style={{ marginTop: 100, textAlign: 'center' }}>
          <p>Article not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="blog-detail">
      <div className="page-header">
        <button className="back-btn" onClick={() => nav('/blog')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        <h1 className="page-title">Article</h1>
        <span className="page-header-spacer" />
      </div>

      <article className="blog-article">
        <header className="blog-article-header">
          <h1 className="blog-article-title">{blog.title}</h1>
          {blog.summary && <p className="blog-article-summary">{blog.summary}</p>}
          <div className="blog-article-meta">
            {blog.author && <span>{blog.author}</span>}
            <span className="dot">·</span>
            <span>{blog.date}</span>
            {blog.readMins && <span className="dot">·</span>}
            {blog.readMins && <span>{blog.readMins} min read</span>}
          </div>
        </header>

        {blog.image && (
          <img className="blog-article-cover" src={blog.image} alt="" />
        )}

        <div className="blog-article-content">
          {blog.content.map((block, i) => {
            if (block.type === 'h2') {
              return <h2 key={i} className="blog-h2">{block.text}</h2>
            }
            if (block.type === 'img') {
              return (
                <figure key={i} className="blog-figure">
                  <img src={block.src} alt={block.caption || ''} />
                  {block.caption && <figcaption>{block.caption}</figcaption>}
                </figure>
              )
            }
            return <p key={i} className="blog-p">{block.text}</p>
          })}
        </div>

        <footer className="blog-article-footer">
          <div className="blog-article-actions">
            <button className="btn ghost" onClick={() => nav('/blog')}>All Articles</button>
            <button className="btn ghost" onClick={() => nav('/home')}>Back Home</button>
          </div>
        </footer>
      </article>
    </div>
  )
}
