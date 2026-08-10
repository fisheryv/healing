/// <reference path="../pb_data/types.d.ts" />

// 专注生成的画作
migrate((app) => {
  const collection = new Collection({
    name: "artworks",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  })

  // 创建者（关联 users）
  collection.fields.add(new RelationField({
    name: "user",
    collectionId: app.findCollectionByNameOrId("users").id,
    required: true,
    maxSelect: 1,
    cascadeDelete: true,
  }))

  // 画作截图
  collection.fields.add(new FileField({
    name: "image",
    maxSelect: 1,
    maxSize: 5 * 1024 * 1024,
    mimeTypes: ["image/png"],
    required: true,
  }))

  // 专注时长（秒）
  collection.fields.add(new NumberField({
    name: "duration",
    required: true,
    min: 0,
  }))

  // 曲线类型（来自 data.js/curveTypes）
  collection.fields.add(new TextField({
    name: "curveType",
    max: 50,
    required: false,
  }))

  // 混音方案快照（JSON）
  collection.fields.add(new JSONField({
    name: "mix",
    required: false,
  }))

  // 状态：complete / abandoned / distracted
  collection.fields.add(new TextField({
    name: "status",
    max: 20,
    required: true,
  }))

  // 文学摘录（仅 complete）
  collection.fields.add(new TextField({
    name: "quoteEn",
    max: 300,
    required: false,
  }))
  collection.fields.add(new TextField({
    name: "quoteCn",
    max: 300,
    required: false,
  }))

  // 实际专注秒数（残卷用）
  collection.fields.add(new NumberField({
    name: "elapsed",
    required: false,
    min: 0,
  }))

  // 创建时间（自动）
  collection.fields.add(new AutodateField({
    name: "created",
    onCreate: true,
    onUpdate: false,
  }))

  app.save(collection)

  // 建索引（按用户+时间倒序）
  try {
    const dao = app.dao()
    const table = "artworks"
    dao.db().newQuery(`CREATE INDEX IF NOT EXISTS idx_artworks_user_created ON ${table} (user, "created" DESC)`).execute()
  } catch (e) {
    console.warn("idx_artworks_user_created failed:", e.message)
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("artworks")
  app.delete(collection)
})