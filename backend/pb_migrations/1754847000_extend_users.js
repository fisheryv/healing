/// <reference path="../pb_data/types.d.ts" />

// 扩展内置 users collection：增加昵称、头像、安全问题、语言偏好、设置 JSON
migrate((app) => {
  const users = app.findCollectionByNameOrId("users")

  // 昵称（≤20 字，可选）
  users.fields.add(new TextField({
    name: "nickname",
    max: 20,
    required: false,
  }))

  // 头像（≤1MB，单张）
  users.fields.add(new FileField({
    name: "avatar",
    maxSelect: 1,
    maxSize: 1024 * 1024,
    mimeTypes: ["image/png", "image/jpeg", "image/webp"],
    thumbs: ["100x100"],
    required: false,
  }))

  // 安全问题与答案（答案存哈希）
  users.fields.add(new TextField({
    name: "recoveryQuestion",
    max: 200,
    required: false,
  }))
  users.fields.add(new TextField({
    name: "recoveryAnswer",
    max: 200,
    required: false,
  }))

  // 语言偏好（'zh' | 'en'）
  users.fields.add(new TextField({
    name: "lang",
    max: 5,
    required: false,
  }))

  // 个人设置 JSON
  users.fields.add(new JSONField({
    name: "settings",
    required: false,
  }))

  app.save(users)
}, (app) => {
  const users = app.findCollectionByNameOrId("users")
  app.delete(users)
})