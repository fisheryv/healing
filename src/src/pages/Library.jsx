import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { officialMusic } from '../data.js'

function localized(field, lang) {
  if (field && typeof field === 'object' && (field.zh || field.en)) {
    return field[lang] || field.en
  }
  return field
}

export default function Library() {
  const [tab, setTab] = useState('official')
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
              <div className="row" key={p.id} onClick={() => { nav('/focus/config', { state: { mix: p } }) }} style={{ cursor: 'pointer' }}>
                <div className="thumb">≋</div>
                <div className="info">
                  <div className="name">{p.name}</div>
                  <div className="meta">
                    {p.mainMusicTitle && localized(p.mainMusicTitle, lang)}
                    {p.bgNoise ? ' · ' + localized(p.bgNoise.name, lang) : ''}
                    {p.binaural ? ' · ' + localized(p.binaural.name, lang) : ''}
                  </div>
                </div>
                <div className="heart" onClick={(e) => {
                  e.stopPropagation()
                  setDeleteTarget(p)
                }}>×</div>
              </div>
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
              <div className="row" key={m.id} onClick={() => nav(`/player/${m.id}`)} style={{ cursor: 'pointer' }}>
                <div className="thumb"><img src={m.cover} alt="" /></div>
                <div className="info">
                  <div className="name">{localized(m.name, lang)}</div>
                  <div className="meta">{localized(m.tag, lang)} · {m.duration}</div>
                </div>
                <div className="heart active" onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(m.id)
                }}>♥</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
