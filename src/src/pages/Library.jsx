import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { officialMusic } from '../data.js'

export default function Library() {
  const [tab, setTab] = useState('official')
  const [search, setSearch] = useState('')
  const { favorites, toggleFavorite, presets, deletePreset, setCurrentMix } = useApp()
  const nav = useNavigate()

  const filtered = officialMusic.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.tag.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-pad" style={{ paddingBottom: 0 }}>
        <h1 className="page-title cn">Library</h1>
      </div>

      <div className="tab-bar">
        <div className={'tab-item' + (tab === 'official' ? ' active' : '')} onClick={() => setTab('official')}>
          Official
        </div>
        <div className={'tab-item' + (tab === 'mine' ? ' active' : '')} onClick={() => setTab('mine')}>
          My Mixes
        </div>
        <div className={'tab-item' + (tab === 'fav' ? ' active' : '')} onClick={() => setTab('fav')}>
          Favorites
        </div>
      </div>

      {tab === 'official' && (
        <>
          <div className="search">
            <input
              type="text"
              placeholder="name/ tag / genre / style"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="list page-pad">
            {filtered.map((m) => (
              <div className="row" key={m.id} onClick={() => nav(`/player/${m.id}`)} style={{ cursor: 'pointer' }}>
                <div className="thumb"><img src={m.cover} alt="" /></div>
                <div className="info">
                  <div className="name">{m.name}</div>
                  <div className="meta">{m.tag} · {m.duration}</div>
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
              <p>No presets created</p>
              <button className="btn" onClick={() => nav('/mixer')}>Create a new preset</button>
            </div>
          ) : (
            presets.map((p) => (
              <div className="row" key={p.id} onClick={() => { setCurrentMix(p); nav('/focus/config') }} style={{ cursor: 'pointer' }}>
                <div className="thumb">≋</div>
                <div className="info">
                  <div className="name">{p.name}</div>
                  <div className="meta">
                    {p.mainMusicTitle}
                    {p.bgNoise ? ' · ' + p.bgNoise.name : ''}
                    {p.binaural ? ' · ' + p.binaural.name : ''}
                  </div>
                </div>
                <div className="heart" onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Are you sure you want to delete this preset? This action cannot be undone.')) deletePreset(p.id)
                }}>×</div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'fav' && (
        <div className="list page-pad">
          {favorites.length === 0 ? (
            <div className="empty">
              <div className="icon" />
              <p>No favorites yet</p>
              <button className="btn" onClick={() => setTab('official')}>Discover</button>
            </div>
          ) : (
            officialMusic.filter((m) => favorites.includes(m.id)).map((m) => (
              <div className="row" key={m.id} onClick={() => nav(`/player/${m.id}`)} style={{ cursor: 'pointer' }}>
                <div className="thumb"><img src={m.cover} alt="" /></div>
                <div className="info">
                  <div className="name">{m.name}</div>
                  <div className="meta">{m.tag} · {m.duration}</div>
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
