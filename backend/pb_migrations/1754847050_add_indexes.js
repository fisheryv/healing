/// <reference path="../pb_data/types.d.ts" />

// Day 3: 补建 favorites UNIQUE 索引和 artworks 排序索引
// 之前的 migration 用 app.dao() 建索引，但 PB 0.39 已移除 dao()，导致索引没建成（被 try/catch 静默吞掉）
// 这里用 PB 0.22+ 的 collection.indexes 属性重新补建
migrate((app) => {
  // favorites: UNIQUE(user, musicId) — 保证同一用户不会重复收藏同一首曲
  const favorites = app.findCollectionByNameOrId("favorites")
  favorites.indexes = [
    "CREATE UNIQUE INDEX IF NOT EXISTS `idx_favorites_user_music` ON `favorites` (`user`, `musicId`)"
  ]
  app.save(favorites)

  // artworks: (user, created DESC) — 按用户列出画作时按时间倒序
  const artworks = app.findCollectionByNameOrId("artworks")
  artworks.indexes = [
    "CREATE INDEX IF NOT EXISTS `idx_artworks_user_created` ON `artworks` (`user`, `created` DESC)"
  ]
  app.save(artworks)
}, (app) => {
  // down: 移除索引
  const favorites = app.findCollectionByNameOrId("favorites")
  favorites.indexes = []
  app.save(favorites)

  const artworks = app.findCollectionByNameOrId("artworks")
  artworks.indexes = []
  app.save(artworks)
})
