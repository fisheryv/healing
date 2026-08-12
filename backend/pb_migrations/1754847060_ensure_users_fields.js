/// <reference path="../pb_data/types.d.ts" />

// 修复：原 1754847000_extend_users.js 假设 users collection 已存在，
// 但 PocketBase 0.27 全新实例默认没有 users collection（需 Admin UI 手动建）。
// ECS 首次部署时该 migration 失败，导致 users 被手动重建后缺少 nickname 等自定义字段，
// 前端 updateProfile({ nickname }) 被静默丢弃，profile 页一直显示 "Friend"。
//
// 本 migration 幂等地确保 users 存在且包含所有自定义字段（已存在则跳过）。
migrate((app) => {
  let users = app.findCollectionByNameOrId("users")

  // users 不存在则创建（auth collection）
  if (!users) {
    users = new Collection({
      name: "users",
      type: "auth",
    })
  }

  // 幂等添加字段：仅在不存在时 add
  const ensure = (name, factory) => {
    if (!users.fields.getByName(name)) {
      users.fields.add(factory())
    }
  }

  ensure("nickname", () => new TextField({
    name: "nickname",
    max: 20,
    required: false,
  }))

  ensure("recoveryQuestion", () => new TextField({
    name: "recoveryQuestion",
    max: 200,
    required: false,
  }))

  ensure("recoveryAnswer", () => new TextField({
    name: "recoveryAnswer",
    max: 200,
    required: false,
  }))

  ensure("lang", () => new TextField({
    name: "lang",
    max: 5,
    required: false,
  }))

  ensure("settings", () => new JSONField({
    name: "settings",
    required: false,
  }))

  app.save(users)
}, (app) => {
  // 回滚：只移除自定义字段，不删整个 collection（避免丢用户数据）
  const users = app.findCollectionByNameOrId("users")
  if (!users) return
  for (const name of ["nickname", "recoveryQuestion", "recoveryAnswer", "lang", "settings"]) {
    const f = users.fields.getByName(name)
    if (f) users.fields.remove(f.id)
  }
  app.save(users)
})
