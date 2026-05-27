import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { officialMusic } from '../data.js'

export default function Library() {
  const [tab, setTab] = useState('official')
  const [search, setSearch] = useState('')
  const { favorites, toggleFavorite, presets, deletePreset } = useApp()
  const nav = useNavigate()

  const filtered = officialMusic.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.tag.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-pad" style={{ paddingBottom: 0 }}>
        <h1 className="page-title cn">曲库</h1>
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
              placeholder="搜索歌曲 / 风格"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="list page-pad">
            {filtered.map((m) => (
              <div className="row" key={m.id}>
                <div className="thumb">♪</div>
                <div className="info">
                  <div className="name">{m.name}</div>
                  <div className="meta">{m.tag} · {m.duration}</div>
                </div>
                <div
                  className={'heart' + (favorites.includes(m.id) ? ' active' : '')}
                  onClick={() => toggleFavorite(m.id)}
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
              <p>还没有创建过混音方案</p>
              <button className="btn" onClick={() => nav('/mixer')}>去调音台创建</button>
            </div>
          ) : (
            presets.map((p) => (
              <div className="row" key={p.id}>
                <div className="thumb">≋</div>
                <div className="info">
                  <div className="name">{p.name}</div>
                  <div className="meta">
                    {p.mainMusicTitle}
                    {p.bgNoise ? ' · ' + p.bgNoise.name : ''}
                    {p.binaural ? ' · ' + p.binaural.name : ''}
                  </div>
                </div>
                <div className="heart" onClick={() => {
                  if (confirm('确认删除该方案？删除后无法恢复')) deletePreset(p.id)
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
              <p>还没有收藏的歌曲</p>
              <button className="btn" onClick={() => setTab('official')}>去发现</button>
            </div>
          ) : (
            officialMusic.filter((m) => favorites.includes(m.id)).map((m) => (
              <div className="row" key={m.id}>
                <div className="thumb">♪</div>
                <div className="info">
                  <div className="name">{m.name}</div>
                  <div className="meta">{m.tag} · {m.duration}</div>
                </div>
                <div className="heart active" onClick={() => toggleFavorite(m.id)}>♥</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
