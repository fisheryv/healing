/// <reference path="../pb_data/types.d.ts" />

// 混音预设
migrate((app) => {
  const collection = new Collection({
    name: "presets",
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
    name: "name",
    max: 50,
    required: true,
  }))

  collection.fields.add(new TextField({
    name: "mainMusicId",
    max: 20,
    required: false,
  }))
  collection.fields.add(new TextField({
    name: "mainMusicTitle",
    max: 100,
    required: false,
  }))
  collection.fields.add(new NumberField({
    name: "mainVolume",
    min: 0,
    max: 1,
    required: false,
  }))

  collection.fields.add(new TextField({
    name: "bgNoiseId",
    max: 30,
    required: false,
  }))
  collection.fields.add(new NumberField({
    name: "bgVolume",
    min: 0,
    max: 1,
    required: false,
  }))

  // 氛围音数组 [{ id, name, volume }]
  collection.fields.add(new JSONField({
    name: "ambient",
    required: false,
  }))

  collection.fields.add(new TextField({
    name: "binauralId",
    max: 20,
    required: false,
  }))
  collection.fields.add(new NumberField({
    name: "binauralVolume",
    min: 0,
    max: 1,
    required: false,
  }))

  collection.fields.add(new AutodateField({
    name: "created",
    onCreate: true,
    onUpdate: false,
  }))

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("presets")
  app.delete(collection)
})