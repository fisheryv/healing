/// <reference path="../pb_data/types.d.ts" />

// 收紧所有 collection 的 API Rules：用户只能访问自己的数据
// users：注册开放 (createRule=""), 读写均限定自己；头像 / 昵称 / 安全问题可改
// artworks / presets / favorites：仅本人 CRUD
migrate((app) => {
  // users —— 已有 listRule/viewRule/updateRule/deleteRule='id=@request.auth.id', createRule=''
  // 不需要改动

  // artworks
  const artworks = app.findCollectionByNameOrId("artworks")
  artworks.listRule = "user = @request.auth.id"
  artworks.viewRule = "user = @request.auth.id"
  artworks.createRule = "user = @request.auth.id"
  artworks.updateRule = "user = @request.auth.id"
  artworks.deleteRule = "user = @request.auth.id"
  app.save(artworks)

  // presets
  const presets = app.findCollectionByNameOrId("presets")
  presets.listRule = "user = @request.auth.id"
  presets.viewRule = "user = @request.auth.id"
  presets.createRule = "user = @request.auth.id"
  presets.updateRule = "user = @request.auth.id"
  presets.deleteRule = "user = @request.auth.id"
  app.save(presets)

  // favorites
  const favorites = app.findCollectionByNameOrId("favorites")
  favorites.listRule = "user = @request.auth.id"
  favorites.viewRule = "user = @request.auth.id"
  favorites.createRule = "user = @request.auth.id"
  favorites.updateRule = "user = @request.auth.id"
  favorites.deleteRule = "user = @request.auth.id"
  app.save(favorites)
}, (app) => {
  // down: 重置为全空
  for (const name of ["artworks", "presets", "favorites"]) {
    const c = app.findCollectionByNameOrId(name)
    c.listRule = ""
    c.viewRule = ""
    c.createRule = ""
    c.updateRule = ""
    c.deleteRule = ""
    app.save(c)
  }
})