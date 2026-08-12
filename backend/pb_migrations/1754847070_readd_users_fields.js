/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users")
  if (!users) return

  const fields = [
    new TextField({ name: "nickname", max: 20, required: false }),
    new TextField({ name: "recoveryQuestion", max: 200, required: false }),
    new TextField({ name: "recoveryAnswer", max: 200, required: false }),
    new TextField({ name: "lang", max: 5, required: false }),
    new JSONField({ name: "settings", required: false }),
  ]
  for (const f of fields) {
    if (!users.fields.getByName(f.name)) {
      users.fields.add(f)
    }
  }
  app.save(users)
}, (app) => {})
