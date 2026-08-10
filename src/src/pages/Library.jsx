import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { officialMusic } from '../data.js'

function localized(field, lang) {
  if (field && typeof field === 'object' && (field.zh || field.en)) {
    return field[lang] || field.en
  }
  return field
}

/**
 * 可滑动显示删除按钮的行
 * - 向左滑动一定距离显示红色删除按钮
 * - 点击删除按钮触发 onDelete
 * - 松手未超过阈值则回弹
 */
function SwipeRow({ children, onDelete, deleteLabel, t }) {
  const [offset, setOffset] = useState(0)
  const startX = useRef(0)
  const currentX = useRef(0)
  const dragging = useRef(false)
  const rowRef = useRef(null)

  const THRESHOLD = 80 // 显示删除按钮的阈值
  const MAX = 120 // 最大可拖动距离

  const onPointerDown = (clientX) => {
    startX.current = clientX
    currentX.current = clientX
    dragging.current = true
  }

  const onPointerMove = (clientX) => {
    if (!dragging.current) return
    currentX.current = clientX
    let dx = clientX - startX.current
    // 只允许向左滑
    dx = Math.min(0, dx)
    dx = Math.max(-MAX, dx)
    setOffset(dx)
  }

  const onPointerUp = () => {
    if (!dragging.current) return
    dragging.current = false
    if (offset < -THRESHOLD) {
      setOffset(-80)
    } else {
      setOffset(0)
    }
  }

  return (
    <div className="swipe-row" ref={rowRef}>
      {/* 删除按钮固定在右侧，不随内容滑动 */}
      <div
        className="swipe-delete"
        onClick={(e) => {
          e.stopPropagation()
          onDelete && onDelete()
          setOffset(0)
        }}
      >
        {deleteLabel || t('common.delete')}
      </div>
      {/* 滑动内容层 */}
      <div
        className="swipe-content"
        style={{ transform: `translateX(${offset}px)`, transition: dragging.current ? 'none' : 'transform 0.25s ease' }}
        onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => { onPointerMove(e.touches[0].clientX); if (e.cancelable && dragging.current) e.preventDefault() }}
        onTouchEnd={onPointerUp}
        onMouseDown={(e) => onPointerDown(e.clientX)}
        onMouseMove={(e) => onPointerMove(e.clientX)}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
      >
        {children}
      </div>
    </div>
  )
}

export default function Library() {
  const location = useLocation()
  // 从外部 state 读取初始 tab（用于首页"我的收藏"更多定位）
  const initialTab = location.state?.tab || 'official'
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { favorites, toggleFavorite, presets, deletePreset, t, lang } = useApp()
  const nav = useNavigate()

  const filtered = officialMusic.filter((m) => {
    const name = (m.name && (m.name[lang] || m.name.en) || '').toLowerCase()
    const tag = (m.tag && (m.tag[lang] || m.tag.en) || '').toLowerCase()
    const s = search.toLowerCase()
    return name.includes(s) || tag.includes(s)
  })

  return (
    <div>
      <div className="page-pad" style={{ paddingBottom: 0 }}>
        <h1 className="page-title cn">{t('library.title')}</h1>
      </div>

      <div className="tab-bar">
        <div className={'tab-item' + (tab === 'official' ? ' active' : '')} onClick={() => setTab('official')}>
          {t('library.tabOfficial')}
        </div>
        <div className={'tab-item' + (tab === 'mine' ? ' active' : '')} onClick={() => setTab('mine')}>
          {t('library.tabMine')}
        </div>
        <div className={'tab-item' + (tab === 'fav' ? ' active' : '')} onClick={() => setTab('fav')}>
          {t('library.tabFav')}
        </div>
      </div>

      {tab === 'official' && (
        <>
          <div className="search">
            <input
              type="text"
              placeholder={t('library.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="list page-pad">
            {filtered.map((m) => (
              <div className="row" key={m.id} onClick={() => nav(`/player/${m.id}`)} style={{ cursor: 'pointer' }}>
                <div className="thumb"><img src={m.cover} alt="" /></div>
                <div className="info">
                  <div className="name">{localized(m.name, lang)}</div>
                  <div className="meta">{localized(m.tag, lang)} · {m.duration}</div>
                </div>
                <div
                  className={'heart' + (favorites.includes(m.id) ? ' active' : '')}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(m.id)
                  }}
                >
                  {favorites.includes(m.id) ? '♥' : '♡'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'mine' && (
        <div className="list page-pad">
          {presets.length === 0 ? (
            <div className="empty">
              <div className="icon" />
              <p>{t('library.noPresets')}</p>
              <button className="btn" onClick={() => nav('/mixer')}>{t('library.createPreset')}</button>
            </div>
          ) : (
            presets.map((p) => (
              <SwipeRow
                key={p.id}
                onDelete={() => setDeleteTarget(p)}
                deleteLabel={t('common.delete')}
                t={t}
              >
                <div className="row" onClick={() => { nav('/focus/config', { state: { mix: p } }) }} style={{ cursor: 'pointer' }}>
                  <div className="thumb">≋</div>
                  <div className="info">
                    <div className="name">{p.name}</div>
                    <div className="meta">
                      {p.mainMusicTitle && localized(p.mainMusicTitle, lang)}
                      {p.bgNoise ? ' · ' + localized(p.bgNoise.name, lang) : ''}
                      {p.binaural ? ' · ' + localized(p.binaural.name, lang) : ''}
                    </div>
                  </div>
                </div>
              </SwipeRow>
            ))
          )}
        </div>
      )}

      {deleteTarget && (
        <div className="modal-mask" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>{t('library.deleteMix')}</h4>
            <p>{t('library.deleteMixConfirm')}</p>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</button>
              <button className="btn" style={{ background: '#9a4a4a', borderColor: '#9a4a4a' }} onClick={() => {
                deletePreset(deleteTarget.id)
                setDeleteTarget(null)
              }}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'fav' && (
        <div className="list page-pad">
          {favorites.length === 0 ? (
            <div className="empty">
              <div className="icon" />
              <p>{t('library.noFavorites')}</p>
              <button className="btn" onClick={() => setTab('official')}>{t('library.discover')}</button>
            </div>
          ) : (
            officialMusic.filter((m) => favorites.includes(m.id)).map((m) => (
              <SwipeRow
                key={m.id}
                onDelete={() => toggleFavorite(m.id)}
                deleteLabel={t('library.unfavorite')}
                t={t}
              >
                <div className="row" onClick={() => nav(`/player/${m.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="thumb"><img src={m.cover} alt="" /></div>
                  <div className="info">
                    <div className="name">{localized(m.name, lang)}</div>
                    <div className="meta">{localized(m.tag, lang)} · {m.duration}</div>
                  </div>
                  <div className="heart active">♥</div>
                </div>
              </SwipeRow>
            ))
          )}
        </div>
      )}
    </div>
  )
}
