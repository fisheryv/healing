/// <reference path="../pb_data/types.d.ts" />

// 收藏
migrate((app) => {
  const collection = new Collection({
    name: "favorites",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  })

  collection.fields.add(new RelationField({
    name: "user",
    collectionId: app.findCollectionByNameOrId("users").id,
    required: true,
    maxSelect: 1,
    cascadeDelete: true,
  }))

  collection.fields.add(new TextField({
    name: "musicId",
    max: 20,
    required: true,
  }))

  collection.fields.add(new AutodateField({
    name: "created",
    onCreate: true,
    onUpdate: false,
  }))

  app.save(collection)

  // 唯一索引：同一用户同一曲目只能收藏一次
  try {
    const dao = app.dao()
    const table = "favorites"
    dao.db().newQuery(`CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_music ON ${table} (user, musicId)`).execute()
  } catch (e) {
    console.warn("idx_favorites_user_music failed:", e.message)
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("favorites")
  app.delete(collection)
})