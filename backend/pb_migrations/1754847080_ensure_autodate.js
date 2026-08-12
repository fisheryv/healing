/// <reference path="../pb_data/types.d.ts" />

// 修复：ECS 上 artworks/presets/favorites 是通过 admin API 手动建的，
// 缺少 created/updated autodate 字段，导致前端 sort=-created 查询 400。
// 本 migration 幂等地补上这两个字段。
migrate((app) => {
  const ensure = (colName) => {
    const c = app.findCollectionByNameOrId(colName)
    if (!c) return
    if (!c.fields.getByName("created")) {
      c.fields.add(new AutodateField({ name: "created", onCreate: true, onUpdate: false }))
    }
    if (!c.fields.getByName("updated")) {
      c.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }))
    }
    app.save(c)
  }
  for (const name of ["artworks", "presets", "favorites"]) ensure(name)
}, (app) => {})
