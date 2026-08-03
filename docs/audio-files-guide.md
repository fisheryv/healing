# 音频文件放置指南

本文件记录 `public/sound/` 下所有音频文件的实际清单与命名约定，供开发与资源补充参考。

---

## 目录结构

```
public/sound/
├── music/       # 主音乐（10 首）
└── ambient/     # 氛围音 / 白噪音素材（20 个）
```

> 纯噪音（白/粉/褐）和双耳节拍（Delta/Theta/Alpha/Beta）由 `src/audioEngine.js` 用 Web Audio API 实时合成，**不需要任何音频文件**。

---

## 主音乐（`public/sound/music/`）

共 10 首，命名规则 `m1.mp3` ~ `m10.mp3`：

| 文件名 | 曲目 | 风格 |
|--------|------|------|
| `m1.mp3`  | Glass Rain      | Ambient |
| `m2.mp3`  | Still Dance     | Lo-fi   |
| `m3.mp3`  | Thread of Dawn  | Lo-fi   |
| `m4.mp3`  | Distant Shore   | Ambient |
| `m5.mp3`  | Cloud Altar     | Piano   |
| `m6.mp3`  | Sun Vessel      | Lo-fi   |
| `m7.mp3`  | Soft Ember      | Ambient |
| `m8.mp3`  | May Nocturne    | Piano   |
| `m9.mp3`  | Moss & Pine     | Ambient |
| `m10.mp3` | Moon Garden     | Ambient |

---

## 氛围音（`public/sound/ambient/`）

### 调音台"氛围音"轨道（`noiseOptions.ambient`）

| 文件名 | 标签 |
|--------|------|
| `light-rain.mp3`   | 雨声 |
| `heavy-rain.mp3`   | 暴雨 |
| `waves.mp3`        | 海浪 |
| `wind.mp3`         | 风声 |
| `howling-wind.mp3`| 呼啸风 |
| `wind-in-trees.mp3`| 林间风 |
| `jungle.mp3`       | 森林 |
| `river.mp3`        | 溪流 |
| `waterfall.mp3`   | 瀑布 |
| `campfire.mp3`     | 篝火 |
| `droplets.mp3`    | 水滴 |

### 调音台"点缀音"轨道（`atmosOptions`）

| 文件名 | 标签 |
|--------|------|
| `birds.mp3`           | 鸟鸣 |
| `pages.mp3`           | 翻书声 |
| `keys.mp3`            | 键盘声 |
| `write.mp3`           | 写字声 |
| `cicida.mp3`          | 蝉鸣 |
| `crickets.mp3`        | 蟋蟀 |
| `walk-in-snow.mp3`    | 踏雪 |
| `walk-on-gravel.mp3`  | 踏石 |
| `walk-on-leaves.mp3`  | 踏叶 |

> 注：`pages` 和 `paper` 语义重复，项目只保留 `pages`。

---

## 合成音轨（无需文件）

### 纯噪音（`noiseOptions.pure`）

| id | 名称 | 合成参数 |
|----|------|---------|
| `white` | 白噪音 | `{ synth: 'noise', type: 'white' }` |
| `pink`  | 粉噪音 | `{ synth: 'noise', type: 'pink' }` |
| `brown` | 褐噪音 | `{ synth: 'noise', type: 'brown' }` |

### 双耳节拍（`binauralOptions`）

| id | 名称 | 范围 | 合成参数 |
|----|------|------|---------|
| `delta` | Delta | 0.5–4 Hz | `{ synth: 'binaural', baseFreq: 150, beatHz: 2 }` |
| `theta` | Theta | 4–8 Hz  | `{ synth: 'binaural', baseFreq: 180, beatHz: 6 }` |
| `alpha` | Alpha | 8–13 Hz | `{ synth: 'binaural', baseFreq: 200, beatHz: 10 }` |
| `beta`  | Beta  | 13–30 Hz| `{ synth: 'binaural', baseFreq: 250, beatHz: 18 }` |

---

## 补充文件时的注意事项

1. 主音乐文件必须是 `m1.mp3` ~ `m10.mp3` 的命名，对应上表曲目
2. 氛围音文件名需和上表完全一致（包括拼写 `cicida.mp3`、复数 `crickets.mp3`）
3. 所有文件建议使用 128kbps 以上的 MP3 格式
4. 主音乐应为可循环的 ambient/lo-fi/piano 风格曲目
5. 氛围音应为可循环的自然环境音
