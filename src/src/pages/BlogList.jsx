import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { blogs } from '../data.js'

export default function BlogList() {
  const nav = useNavigate()
  // 按发布时间倒序排列
  const sorted = [...blogs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return (
    <div className="blog-list">
      <div className="page-header">
        <button className="back-btn" onClick={() => nav('/home')}><ChevronLeft size={24} strokeWidth={1.5} /></button>
        <h1 className="page-title">Blog</h1>
        <span className="page-header-spacer" />
      </div>

      <div className="page-pad">
        <div className="blog-list-count">{sorted.length} Articles</div>
        <div className="blog-list-items">
          {sorted.map((b) => (
            <div
              className="blog-list-row"
              key={b.id}
              onClick={() => nav(`/blog/${b.id}`)}
            >
              <img className="blog-list-thumb" src={b.image} alt="" />
              <div className="blog-list-body">
                <div className="title">{b.title}</div>
                {b.summary && <div className="summary">{b.summary}</div>}
                <div className="meta">
                  <span>{b.date}</span>
                  {b.readMins && <span className="dot">·</span>}
                  {b.readMins && <span>{b.readMins} min read</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
