import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { officialMusic, noiseOptions, atmosOptions, binauralOptions, findMusicById } from '../data.js'
import * as audioEngine from '../audioEngine.js'

// Helper: 取双语字段在当前语言下的字符串
function localized(field, lang) {
  if (field && typeof field === 'object' && (field.zh || field.en)) {
    return field[lang] || field.en
  }
  return field
}

export default function Mixer() {
  const nav = useNavigate()
  const { savePreset, setCurrentMix, isPresetNameExist, currentMix, lang, t } = useApp()

  const [main, setMain] = useState(null)
  const [mainVol, setMainVol] = useState(70)
  const [mainMuted, setMainMuted] = useState(false)
  const [bgNoise, setBgNoise] = useState(null)
  const [bgVol, setBgVol] = useState(50)
  const [bgMuted, setBgMuted] = useState(false)
  // 氛围音：每项带独立 volume
  const [atmos, setAtmos] = useState([])
  const [binaural, setBinaural] = useState(null)
  const [biVol, setBiVol] = useState(30)
  const [biMuted, setBiMuted] = useState(false)

  const [showMain, setShowMain] = useState(false)
  const [showNoise, setShowNoise] = useState(false)
  const [showBinaural, setShowBinaural] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [toast, setToast] = useState('')
  const [mainSearch, setMainSearch] = useState('')

  // AI 智能配置助手
  const [showAI, setShowAI] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // 重名覆盖确认
  const [showOverwrite, setShowOverwrite] = useState(false)
  // 未保存配置提示
  const [showUnsaved, setShowUnsaved] = useState(false)
  // 保存后自动开始（用于 "Save & Start" 流程）
  const [pendingStart, setPendingStart] = useState(false)

  // 标记配置是否有改动（用于判断"未保存"）
  const [dirty, setDirty] = useState(false)

  const flashToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1500)
  }

  // 跟踪最新状态，用于卸载时同步到 store（实现跨页面保留选择）
  const stateRef = useRef({ dirty: false })
  useEffect(() => {
    stateRef.current = {
      dirty,
      mix: buildMix(),
      hasAny: !!(main || bgNoise || atmos.length > 0 || binaural)
    }
  })

  // 进入页面：启动分析
  useEffect(() => {
    audioEngine.startAnalysis()
    return () => {
      audioEngine.stopPreview()
      audioEngine.stopAll()
      audioEngine.stopAnalysis()
      // 卸载时把当前选择同步到 store：只要用户有改动且选择了内容，
      // 就保留到 currentMix，使下次回到 Mixer 时能恢复（除非用户点击 Clear）。
      const s = stateRef.current
      if (s.dirty && s.hasAny) {
        setCurrentMix(s.mix)
      }
    }
  }, [])

  // 从 currentMix 载入配置（进入页面时若有保存的 currentMix 则恢复）
  useEffect(() => {
    if (currentMix && !dirty) {
      if (currentMix.mainMusicId) {
        const m = findMusicById(currentMix.mainMusicId)
        if (m) setMain(m)
      }
      if (currentMix.mainVolume != null) setMainVol(Math.round(currentMix.mainVolume * 100))
      if (currentMix.bgNoise) {
        const allNoise = [...noiseOptions.pure, ...noiseOptions.ambient]
        const found = allNoise.find((n) => n.id === currentMix.bgNoise.id)
        if (found) setBgNoise(found)
      }
      if (currentMix.bgVolume != null) setBgVol(Math.round(currentMix.bgVolume * 100))
      if (currentMix.ambient && currentMix.ambient.length > 0) {
        const loaded = currentMix.ambient
          .map((a) => {
            const found = atmosOptions.find((opt) => opt.id === a.id)
            return found ? { ...found, volume: a.volume ?? 0.5 } : null
          })
          .filter(Boolean)
        setAtmos(loaded)
      }
      if (currentMix.binaural) {
        const found = binauralOptions.find((b) => b.id === currentMix.binaural.id)
        if (found) setBinaural(found)
      }
      if (currentMix.binauralVolume != null) setBiVol(Math.round(currentMix.binauralVolume * 100))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenSheet = (sheetName) => {
    audioEngine.resumeContext()
    if (sheetName === 'main') setShowMain(true)
    else if (sheetName === 'noise') setShowNoise(true)
    else if (sheetName === 'binaural') setShowBinaural(true)
  }

  // 主音乐变更：预览
  useEffect(() => {
    if (main) {
      audioEngine.previewTrack('main', main.src, mainMuted ? 0 : mainVol / 100)
      setDirty(true)
    } else {
      audioEngine.stopPreview('main')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [main])

  useEffect(() => {
    if (main) {
      audioEngine.setTrackVolume('main', mainMuted ? 0 : mainVol / 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainVol, mainMuted])

  // 背景噪音变更：预览
  useEffect(() => {
    if (bgNoise) {
      audioEngine.previewTrack('bgNoise', bgNoise.src, bgMuted ? 0 : bgVol / 100)
      setDirty(true)
    } else {
      audioEngine.stopPreview('bgNoise')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgNoise])

  useEffect(() => {
    if (bgNoise) {
      audioEngine.setTrackVolume('bgNoise', bgMuted ? 0 : bgVol / 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgVol, bgMuted])

  // 氛围音变更：预览（每个氛围音独立 track）
  useEffect(() => {
    // 停止所有旧的 atmos 预览
    audioEngine.stopPreview('atmos_0')
    audioEngine.stopPreview('atmos_1')
    atmos.forEach((a, i) => {
      audioEngine.previewTrack('atmos_' + i, a.src, a.volume ?? 0.5)
    })
    setDirty(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atmos.map((a) => a.id).join(',')])

  // 氛围音量实时调整
  useEffect(() => {
    atmos.forEach((a, i) => {
      audioEngine.setTrackVolume('atmos_' + i, a.volume ?? 0.5)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atmos])

  // 双耳节拍变更：预览
  useEffect(() => {
    if (binaural) {
      // 预览时载波跟随当前选中主音乐的调性（若有），使预览听感与实际播放一致
      audioEngine.previewTrack('binaural', binaural.src, biMuted ? 0 : biVol / 100, {
        musicKey: main?.key,
        musicMode: main?.mode
      })
      setDirty(true)
    } else {
      audioEngine.stopPreview('binaural')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binaural, main?.key, main?.mode])

  useEffect(() => {
    if (binaural) {
      audioEngine.setTrackVolume('binaural', biMuted ? 0 : biVol / 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biVol, biMuted])

  const buildMix = () => ({
    name: presetName.trim() || t('mixer.untitled'),
    mainMusicId: main?.id,
    mainMusicTitle: main?.name,
    mainVolume: mainVol / 100,
    bgNoise: bgNoise ? { id: bgNoise.id, name: bgNoise.name } : null,
    bgVolume: bgVol / 100,
    ambient: atmos.map((a) => ({ id: a.id, name: a.name, volume: a.volume ?? 0.5 })),
    binaural: binaural ? { id: binaural.id, name: binaural.name, range: binaural.range } : null,
    binauralVolume: biVol / 100
  })

  const handleSave = () => {
    if (!presetName.trim()) return
    // 检查重名
    if (isPresetNameExist(presetName.trim())) {
      setShowSave(false)
      setShowOverwrite(true)
      return
    }
    doSave()
  }

  const doSave = () => {
    savePreset(buildMix())
    setShowSave(false)
    setShowOverwrite(false)
    setPresetName('')
    setDirty(false)
    flashToast(t('mixer.presetSaved'))
    if (pendingStart) {
      setPendingStart(false)
      doStart()
    }
  }

  const handleStart = () => {
    if (!main) {
      flashToast(t('mixer.selectMainFirst'))
      return
    }
    // 检查是否有未保存的更改
    if (dirty) {
      setShowUnsaved(true)
      return
    }
    doStart()
  }

  const doStart = () => {
    setCurrentMix(buildMix())
    audioEngine.stopPreview()
    nav('/focus/config')
  }

  // 氛围音操作
  const toggleAtmos = (a) => {
    const exist = atmos.find((x) => x.id === a.id)
    if (exist) {
      setAtmos(atmos.filter((x) => x.id !== a.id))
    } else {
      if (atmos.length >= 2) return
      setAtmos([...atmos, { ...a, volume: 0.5 }])
    }
  }

  const setAtmosVolume = (id, vol) => {
    setAtmos(atmos.map((a) => (a.id === id ? { ...a, volume: vol } : a)))
  }

  const removeAtmos = (id) => {
    setAtmos(atmos.filter((a) => a.id !== id))
  }

  const handleMuteMain = () => setMainMuted((v) => !v)
  const handleMuteBg = () => setBgMuted((v) => !v)
  const handleMuteBi = () => setBiMuted((v) => !v)

  // 一键清除所有配置（同时清掉 store 中的 currentMix，避免下次进入时残留）
  const handleClear = () => {
    audioEngine.stopPreview()
    audioEngine.stopAll()
    setCurrentMix(null)
    setMain(null)
    setMainVol(70)
    setMainMuted(false)
    setBgNoise(null)
    setBgVol(50)
    setBgMuted(false)
    setAtmos([])
    setBinaural(null)
    setBiVol(30)
    setBiMuted(false)
    setDirty(false)
    stateRef.current = { dirty: false, hasAny: false }
    flashToast(t('mixer.cleared'))
  }

  // 主音乐搜索过滤
  const filteredMusic = officialMusic.filter((m) => {
    const name = (m.name && (m.name[lang] || m.name.en) || '').toLowerCase()
    const tag = (m.tag && (m.tag[lang] || m.tag.en) || '').toLowerCase()
    const search = mainSearch.toLowerCase()
    return name.includes(search) || tag.includes(search)
  })

  // AI 智能配置：将用户自然语言需求发给 DeepSeek，解析返回的 JSON 并应用
  const handleAISubmit = async () => {
    const prompt = aiInput.trim()
    if (!prompt || aiLoading) return
    setAiLoading(true)
    setAiError('')
    try {
      // 构造可选项清单供模型选择（附带调性、类型等元数据以提升匹配质量）
      const musicList = officialMusic.map((m) => ({
        id: m.id,
        name: m.name[lang] || m.name.en,
        tag: m.tag[lang] || m.tag.en,
        key: m.key,
        mode: m.mode,
        duration: m.duration
      }))
      const noiseList = [
        ...noiseOptions.pure.map((n) => ({ ...n, id: n.id, name: n.name[lang] || n.name.en, kind: 'pure' })),
        ...noiseOptions.ambient.map((n) => ({ id: n.id, name: n.name[lang] || n.name.en, kind: 'ambient' }))
      ]
      const atmosList = atmosOptions.map((a) => ({
        id: a.id,
        name: a.name[lang] || a.name.en
      }))
      const binauralList = binauralOptions.map((b) => ({
        id: b.id,
        name: b.name[lang] || b.name.en,
        range: b.range,
        desc: b.desc[lang] || b.desc.en
      }))

      const systemPrompt = `你是「希音 Healing」声音疗愈应用的调音专家。你的职责是：根据用户用自然语言描述的情绪、场景或目标，从下方可选项中搭配出最贴合的声音组合，帮助用户进入想要的专注、放松或冥想状态。

## 关于「希音 Healing」

希音是一个将"注意力"转化为"艺术"的隐形专注工具。用户在调音台配置好声音组合后，会进入一段专注会话（手机屏幕朝下放置，不看屏幕）。会话结束时，系统根据专注时长和状态生成一幅参数方程曲线画作。因此，你配置的声音组合应当能持续支撑用户在长时间（15–90 分钟）内保持目标状态，而不应让用户在听感上感到疲劳或分心。

## 你要配置的四项

1. mainMusicId —— 主音乐：曲目的旋律与情绪基调，是整体听感的灵魂。
   - 必选，不可为 null。
   - 从"可选主音乐"清单中选择一个 id。
   - mainVolume：主音乐音量，0–100 整数。主音乐通常是主角，建议 50–75；需要背景化时（如搭配强双耳节拍）可降到 40–55。

2. bgNoiseId —— 背景噪音层：一层持续、低变化的环境声，帮助掩蔽外界干扰、营造空间感。
   - 可选。从"可选背景噪音"清单中选择一个 id，或设为 null。
   - 当用户明确想要纯粹音乐、或场景本身已很安静时，可设为 null。
   - bgVolume：背景噪音音量，0–100 整数。通常略低于主音乐，建议 25–50；纯掩蔽需求可到 50–65。

3. atmosIds —— 氛围音层：点缀性的细节声音，为场景增添"有人在场"的真实感（如鸟鸣、翻书声、键盘声）。
   - 可选。从"可选氛围音"清单中选择 0、1 或 2 个 id，组成数组。
   - 最多 2 个，超过 2 个会被前端截断。
   - 不需要时返回空数组 []。
   - 氛围音是"点状"声音，与背景噪音（"面状"持续声）互补——通常二者可同时存在，但若氛围音已足够营造场景，背景噪音可设为 null。
   - atmosVolume：氛围音音量，0–100 整数。氛围音应是"偶尔听到"的点缀而非持续存在，建议 20–40，不要盖过主音乐。

4. binauralId —— 双耳节拍：通过左右耳频率差引导脑波趋向目标状态。
   - 可选。从"可选双耳节拍"清单中选择一个 id，或设为 null。
   - 需佩戴耳机才有效。
   - binauralVolume：双耳节拍音量，0–100 整数。双耳节拍应是若有若无的"暗流"，建议 15–30，过高会刺耳并干扰主音乐。

## 何时设为 null / 空

- mainMusicId 永远必选，不得为 null。mainVolume 也必填。
- 其余三项（bgNoiseId / atmosIds / binauralId）均为可选：
  - 用户未明确表达对某层的需求时，优先设为 null / []，不要"为了填满而选"。
  - 用户明确说"不要太复杂""只要音乐""不要噪音"等，对应项设为 null / []。
  - 宁可少选，也不要选了之后让用户感到拥挤或分心。
  - 但若用户描述了一个具体场景（如"在咖啡馆阅读""下雨天的午后"），则应当根据场景线索积极匹配背景噪音和/或氛围音。
- 当某层被设为 null / [] 时，对应的音量字段省略即可（不需要返回）。

## 主音乐目录（每首曲目的意境与特点）

请根据曲目的名字、风格、调性、意境来匹配用户需求。每首曲子都有自己的"性格"：

- **m1 Glass Rain / 玻璃雨** — Ambient · F 大调 · 03:24
  透明、清亮、像雨滴落在玻璃上弹奏的微弱旋律。适合需要"被包裹但不被打扰"的时刻：晨间阅读、雨天写作、轻度冥想。听感轻盈，长时间聆听不会疲倦。是搭配双耳节拍的首选之一。

- **m2 Still Dance / 静舞** — Lo-fi · G# 小调 · 04:12
  带有轻微律动的 Lo-fi 节拍，小调带来一丝克制的忧郁。适合需要稳定节奏推动的任务：学习、编码、处理事务。情绪温度偏凉，不过分欢快也不过分低沉。

- **m3 Thread of Dawn / 晨曦之线** — Lo-fi · A 小调 · 05:48
  更长、更舒缓的 Lo-fi，像黎明缓慢展开的光线。适合需要沉浸的深度工作、清晨启动、长时段阅读。小调让它带一点内省的质感。

- **m4 Distant Shore / 远岸** — Ambient · A 大调 · 03:56
  开阔、悠远的氛围音乐，大调带来明亮但不张扬的底色。像望向远方的海岸线。适合冥想、放松、安眠前的过渡、午后放空。也是搭配 Theta/Delta 双耳节拍的良伴。

- **m5 Cloud Altar / 云上祭坛** — Piano · D 大调 · 04:33
  纯钢琴，大调，明亮而庄重。适合需要清晰旋律支撑的深度思考、阅读哲学/诗歌、情绪沉淀。旋律感较强，适合不那么容易被旋律带走的用户。

- **m6 Sun Vessel / 太阳之舟** — Lo-fi · E 大调 · 06:02
  时长最长的一首 Lo-fi，大调让它比 m2/m3 更温暖、更向上。适合需要长时间专注且希望保持积极心绪的任务：冲刺写作、整理、创造性工作。

- **m7 Soft Ember / 柔烬** — Ambient · D# 大调 · 03:18
  温暖、低沉、像炉火将熄未熄时的余温。适合夜晚放松、冥想、入睡前奏、情绪安抚。与篝火背景噪音和 Delta 双耳节拍搭配，可营造冬夜氛围。

- **m8 May Nocturne / 五月夜曲** — Piano · D 小调 · 04:05
  纯钢琴，小调，夜曲气质。比 m5 更内敛、更深沉。适合夜晚阅读、情绪沉淀、写作、需要安静陪伴的时刻。与蝉鸣/蟋蟀氛围音搭配可营造夏夜。

- **m9 Moss & Pine / 苔与松** — Ambient · A 大调 · 05:20
  潮湿、葱郁、像走进北方森林。大调但有泥土的气息。适合冥想、自然主题放松、写作自然/旅行题材、林间阅读。与 forest 背景噪音 + birds 氛围音是天作之合。

- **m10 Moon Garden / 月之庭** — Ambient · C 小调 · 04:48
  幽静、神秘、像月光下的庭院。小调带来深邃但不沉重的底色。适合夜间冥想、深度放松、创意写作、情绪内省。与风铃（chime）或蝉鸣氛围音搭配，可营造月夜氛围。

## 自由联想与氛围营造

你不是在做"需求→选项"的机械映射，而是在为用户"营造一个氛围"。请：

- **读出用户没说出来的部分**。用户说"想专注阅读"，你可以联想：是什么书？在什么时间？窗外在下雨还是阳光正好？据此选择有画面感的搭配。
- **敢于做诗意的选择**。比如用户说"想放松"，比起泛泛选一首 Ambient，可以选 m4 Distant Shore（远岸）+ waves（海浪）+ null 双耳节拍，让用户仿佛坐在海边。
- **构建完整场景**。三层声音（主音乐 + 背景噪音 + 氛围音）应当共同构成一个"地方"，而不是各自为政。比如 m9 Moss & Pine + forest + birds 构成"森林晨间"，m7 Soft Ember + fire + null 构成"冬夜炉边"。
- **信任曲名**。曲名本身就是意象：Glass Rain、Distant Shore、Moon Garden……当用户的描述与某首曲名的意象共振时，优先选它。
- **允许留白**。不是每层都要填满。有时候"只有 m8 May Nocturne + 一只蟋蟀"比满配更有意境。

## 背景噪音选择（从"可选背景噪音"清单）

- 纯噪音：white（均衡掩蔽）、pink（柔和耐听，长时间首选）、brown（深沉有力）。
  - 适合"太吵""隔绝干扰""需要白噪音"等需求。
- 环境噪音：rain（细雨）、heavy-rain（大雨）、waves（海浪）、wind（微风）、howling-wind（呼啸风）、wind-trees（林间风声）、forest（森林）、stream（溪流）、waterfall（瀑布）、fire（篝火）、droplets（水滴）。
  - 适合场景营造——用户提到"下雨""海边""森林""篝火"等，优先匹配。
- 用户未提及环境线索且无明确掩蔽需求时，可设为 null 或选 pink 作为安全默认。

## 氛围音选择（从"可选氛围音"清单，最多 2 个）

birds（鸟鸣）、pages（翻书声）、keys（键盘声）、write（书写声）、cicada（蝉鸣）、crickets（蟋蟀）、steps-snow（踏雪声）、steps-gravel（踏碎石声）、steps-leaves（踏落叶声）、chime（风铃）、cat（猫咪）、coffee（咖啡研磨）。

- 氛围音是"点状"细节声，与背景噪音互补。例如：
  - "在咖啡馆学习"→ 背景可选 coffee 或 null + 氛围音 keys + pages
  - "林间阅读"→ 背景选 forest + 氛围音 birds
  - "雪夜冥想"→ 背景选 wind + 氛围音 steps-snow
- 若用户场景已由背景噪音充分覆盖，氛围音可返回 []。
- 不要强行选 2 个——1 个甚至 0 个完全可以。

## 双耳节拍选择（从"可选双耳节拍"清单）

- Delta（0.5–4 Hz）：深度放松、冥想、助眠。
- Theta（4–8 Hz）：冥想、创意发散、入睡前奏。
- Alpha（8–13 Hz）：轻度专注、阅读、放松而清醒——最常用的专注波段。
- Beta（13–30 Hz）：高强度思考、冲刺学习、需要警觉时。
- 映射规则：睡眠/入睡 → Delta；冥想/放松 → Theta 或 Alpha；阅读/学习/专注 → Alpha；冲刺/紧急/高强度 → Beta。
- 用户明确说"不要脑波""不需要双耳节拍"或未表达对脑波状态的偏好时，设为 null。
- 双耳节拍与 Ambient 类型主音乐搭配效果最佳（载波会跟随音乐调性）。

## 可选项清单（结构化数据）

可选主音乐:
${JSON.stringify(musicList)}

可选背景噪音:
${JSON.stringify(noiseList)}

可选氛围音:
${JSON.stringify(atmosList)}

可选双耳节拍:
${JSON.stringify(binauralList)}

## 输出要求

只返回一个 JSON 对象，不要任何解释、注释或 markdown 代码块标记。字段名必须完全匹配：

{"mainMusicId":"<id>","mainVolume":<0-100>,"bgNoiseId":"<id 或 null>","bgVolume":<0-100>,"atmosIds":["<id>","<id>"],"atmosVolume":<0-100>,"binauralId":"<id 或 null>","binauralVolume":<0-100>}

规则：
- 所有 id 必须严格来自上述清单，不得自行编造。
- null 必须是 JSON 的 null，不是字符串 "null"。
- atmosIds 必须是数组，可为 []、["xxx"] 或 ["xxx","yyy"]，最多 2 个元素。
- atmosIds 中的元素不得重复。
- mainVolume 必填，0–100 整数。
- bgVolume / atmosVolume / binauralVolume：当对应层被选中时必填（0–100 整数）；当对应层为 null / [] 时可省略。
- 音量是数字，不是字符串。`

      const resp = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-210df5b3790f412d8870123bbd0501f2'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          response_format: { type: 'json_object' }
        })
      })
      if (!resp.ok) {
        throw new Error(`API ${resp.status}`)
      }
      const data = await resp.json()
      const content = data?.choices?.[0]?.message?.content || ''
      let config
      try {
        config = JSON.parse(content)
      } catch (e) {
        // 尝试从文本中提取 JSON
        const match = content.match(/\{[\s\S]*\}/)
        if (match) {
          config = JSON.parse(match[0])
        } else {
          throw new Error('无法解析 AI 返回')
        }
      }

      // 应用配置（含音量）
      if (config.mainMusicId) {
        const m = officialMusic.find((x) => x.id === config.mainMusicId)
        if (m) setMain(m)
      }
      if (typeof config.mainVolume === 'number' && config.mainVolume >= 0 && config.mainVolume <= 100) {
        setMainVol(Math.round(config.mainVolume))
      }
      if (config.bgNoiseId) {
        const allNoise = [...noiseOptions.pure, ...noiseOptions.ambient]
        const n = allNoise.find((x) => x.id === config.bgNoiseId)
        if (n) setBgNoise(n)
      } else {
        setBgNoise(null)
      }
      if (typeof config.bgVolume === 'number' && config.bgVolume >= 0 && config.bgVolume <= 100) {
        setBgVol(Math.round(config.bgVolume))
      }
      // 氛围音：AI 返回 atmosIds 数组，最多取 2 个，音量由 atmosVolume 统一设置
      if (Array.isArray(config.atmosIds) && config.atmosIds.length > 0) {
        const atmosVol = (typeof config.atmosVolume === 'number' && config.atmosVolume >= 0 && config.atmosVolume <= 100)
          ? config.atmosVolume / 100
          : 0.5
        const loaded = config.atmosIds
          .slice(0, 2)
          .map((id) => atmosOptions.find((a) => a.id === id))
          .filter(Boolean)
          .map((a) => ({ ...a, volume: atmosVol }))
        setAtmos(loaded)
      } else {
        setAtmos([])
      }
      if (config.binauralId) {
        const b = binauralOptions.find((x) => x.id === config.binauralId)
        if (b) setBinaural(b)
      } else {
        setBinaural(null)
      }
      if (typeof config.binauralVolume === 'number' && config.binauralVolume >= 0 && config.binauralVolume <= 100) {
        setBiVol(Math.round(config.binauralVolume))
      }

      setShowAI(false)
      setAiInput('')
      flashToast(t('mixer.aiApplied'))
    } catch (e) {
      setAiError(t('mixer.aiError') + ': ' + (e.message || String(e)))
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100% - 0px)' }}>
      <div className="page-pad" style={{ paddingBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="page-title cn">{t('mixer.title')}</h1>
        <span className="text-link" onClick={handleClear} style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{t('mixer.clear')}</span>
      </div>

      <div className="track">
        <div className="head">
          <span className="label">{t('mixer.mainMusic')}</span>
          <span className={'mute' + (mainMuted ? ' active' : '')} onClick={handleMuteMain}>{t('mixer.mute')}</span>
        </div>
        <div className="body" onClick={() => handleOpenSheet('main')}>
          {main ? localized(main.name, lang) : <span className="placeholder">{t('mixer.selectMain')}</span>}
        </div>
        {main && <div className="desc">{localized(main.tag, lang)} · {main.duration}</div>}
        {main && (
          <div className="slider">
            <span>VOL</span>
            <input type="range" min={0} max={100} value={mainVol} onChange={(e) => setMainVol(+e.target.value)} />
            <span className="val">{mainVol}</span>
          </div>
        )}
      </div>

      <div className="track">
        <div className="head">
          <span className="label">{t('mixer.noiseAmbience')}</span>
          <span className={'mute' + (bgMuted ? ' active' : '')} onClick={handleMuteBg}>{t('mixer.mute')}</span>
        </div>
        <div className="body" onClick={() => handleOpenSheet('noise')}>
          {bgNoise || atmos.length > 0 ? (
            <>
              {bgNoise ? localized(bgNoise.name, lang) : t('mixer.noBgNoise')}
              {atmos.length > 0 ? ' · ' + atmos.map((a) => localized(a.name, lang)).join(' · ') : ''}
            </>
          ) : (
            <span className="placeholder">{t('mixer.selectNoise')}</span>
          )}
        </div>
        {bgNoise && (
          <div className="slider">
            <span>BG</span>
            <input type="range" min={0} max={100} value={bgVol} onChange={(e) => setBgVol(+e.target.value)} />
            <span className="val">{bgVol}</span>
          </div>
        )}
        {/* 氛围音独立音量滑块和 × 取消 */}
        {atmos.map((a) => (
          <div key={a.id} className="atmos-row">
            <span className="atmos-name">{localized(a.name, lang)}</span>
            <div className="slider" style={{ flex: 1, margin: 0 }}>
              <input type="range" min={0} max={100} value={Math.round((a.volume ?? 0.5) * 100)} onChange={(e) => setAtmosVolume(a.id, +e.target.value / 100)} />
              <span className="val">{Math.round((a.volume ?? 0.5) * 100)}</span>
            </div>
            <span className="atmos-remove" onClick={() => removeAtmos(a.id)}>×</span>
          </div>
        ))}
      </div>

      <div className="track">
        <div className="head">
          <span className="label">{t('mixer.binauralBeats')}</span>
          <span className={'mute' + (biMuted ? ' active' : '')} onClick={handleMuteBi}>{t('mixer.mute')}</span>
        </div>
        <div className="body" onClick={() => handleOpenSheet('binaural')}>
          {binaural ? (lang === 'zh' ? `${localized(binaural.name, lang)}${t('mixer.wave')}` : `${localized(binaural.name, lang)} Wave`) : <span className="placeholder">{t('mixer.selectBinaural')}</span>}
        </div>
        {binaural && <div className="desc">{binaural.range} — {t('mixer.headphonesRec')}</div>}
        <div className="desc" style={{ marginTop: 4 }}>{t('mixer.binauralHint')}</div>
        {binaural && (
          <div className="slider">
            <span>VOL</span>
            <input type="range" min={0} max={100} value={biVol} onChange={(e) => setBiVol(+e.target.value)} />
            <span className="val">{biVol}</span>
          </div>
        )}
      </div>

      {/* AI 智能配置助手 */}
      <div className="ai-assist-row">
        <button className="btn ghost block" onClick={() => setShowAI(true)}>
          {t('mixer.aiAssist')}
        </button>
      </div>

      <div className="mixer-actions">
        <button className="btn ghost" onClick={() => setShowSave(true)}>{t('mixer.save')}</button>
        <button className="btn" onClick={handleStart}>{t('mixer.beginFocus')}</button>
      </div>

      {showMain && (
        <div className="sheet-mask" onClick={() => setShowMain(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.selectMainMusic')}</h4>
            <div className="search" style={{ margin: '0 0 14px' }}>
              <input
                type="text"
                placeholder={t('mixer.searchMusic')}
                value={mainSearch}
                onChange={(e) => setMainSearch(e.target.value)}
              />
            </div>
            {filteredMusic.map((m) => (
              <div key={m.id} className={'opt' + (main?.id === m.id ? ' checked' : '')} onClick={() => { setMain(m); setShowMain(false); setMainSearch('') }}>
                <div className="left">
                  <div>{localized(m.name, lang)}</div>
                  <div className="desc">{localized(m.tag, lang)} · {m.duration}</div>
                </div>
              </div>
            ))}
            {filteredMusic.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '20px 0', fontSize: 13 }}>
                {t('mixer.noMusicFound')}
              </div>
            )}
          </div>
        </div>
      )}

      {showNoise && (
        <div className="sheet-mask" onClick={() => setShowNoise(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.backgroundNoise')}</h4>
            <div className="grid-opt">
              {[...noiseOptions.pure, ...noiseOptions.ambient].map((n) => (
                <div
                  key={n.id}
                  className={'pill' + (bgNoise?.id === n.id ? ' checked' : '')}
                  onClick={() => setBgNoise(bgNoise?.id === n.id ? null : n)}
                >
                  {localized(n.name, lang)}
                </div>
              ))}
            </div>
            <h4 style={{ marginTop: 22 }}>{t('mixer.atmosphere')} ({atmos.length} / 2 {t('mixer.selected')})</h4>
            <div className="grid-opt">
              {atmosOptions.map((a) => {
                const isChecked = atmos.find((x) => x.id === a.id)
                const isDisabled = !isChecked && atmos.length >= 2
                return (
                  <div
                    key={a.id}
                    className={'pill' + (isChecked ? ' checked' : '') + (isDisabled ? ' disabled' : '')}
                    onClick={() => {
                      if (isDisabled) return
                      toggleAtmos(a)
                    }}
                  >
                    {localized(a.name, lang)}
                  </div>
                )
              })}
            </div>
            <button className="btn block" style={{ marginTop: 22 }} onClick={() => setShowNoise(false)}>{t('mixer.done')}</button>
          </div>
        </div>
      )}

      {showBinaural && (
        <div className="sheet-mask" onClick={() => setShowBinaural(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.binauralBeats')}</h4>
            {binauralOptions.map((b) => (
              <div key={b.id} className={'opt' + (binaural?.id === b.id ? ' checked' : '')} onClick={() => { setBinaural(b); setShowBinaural(false) }}>
                <div className="left">
                  <div>{lang === 'zh' ? `${localized(b.name, lang)}${t('mixer.wave')}` : `${localized(b.name, lang)} Wave`} · {b.range}</div>
                  <div className="desc">{localized(b.desc, lang)}</div>
                </div>
              </div>
            ))}
            <div className="opt" onClick={() => { setBinaural(null); setShowBinaural(false) }}>
              <div className="left"><div>{t('mixer.none')}</div></div>
            </div>
          </div>
        </div>
      )}

      {showSave && (
        <div className="modal-mask" onClick={() => { setShowSave(false); setPendingStart(false) }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.saveMixPreset')}</h4>
            <p>{t('mixer.presetNamePrompt')}</p>
            <input
              className="field"
              style={{ width: '100%', height: 42, border: 'none', borderBottom: '1px solid var(--line-strong)', fontSize: 16, marginBottom: 18 }}
              maxLength={20}
              placeholder={t('mixer.presetNamePlaceholder')}
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => { setShowSave(false); setPendingStart(false) }}>{t('mixer.cancel')}</button>
              <button className="btn" onClick={handleSave}>{t('mixer.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 重名覆盖确认 */}
      {showOverwrite && (
        <div className="modal-mask" onClick={() => setShowOverwrite(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.nameExists')}</h4>
            <p>{t('mixer.nameExistsDesc', { name: presetName.trim() })}</p>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: 8 }}>
              <button className="btn block" onClick={doSave}>{t('mixer.overwrite')}</button>
              <button className="btn ghost block" onClick={() => { setShowOverwrite(false); setShowSave(true) }}>{t('mixer.rename')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 未保存配置提示 */}
      {showUnsaved && (
        <div className="modal-mask" onClick={() => setShowUnsaved(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.unsavedChanges')}</h4>
            <p>{t('mixer.unsavedDesc')}</p>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: 8 }}>
              <button className="btn block" onClick={() => { setShowUnsaved(false); setShowSave(true); setPendingStart(true) }}>{t('mixer.saveAndStart')}</button>
              <button className="btn ghost block" onClick={() => { setShowUnsaved(false); doStart() }}>{t('mixer.justStart')}</button>
              <button className="btn ghost block" onClick={() => setShowUnsaved(false)}>{t('mixer.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* AI 智能配置助手对话框 */}
      {showAI && (
        <div className="modal-mask" onClick={() => { setShowAI(false); setAiError('') }}>
          <div className="modal ai-modal" onClick={(e) => e.stopPropagation()}>
            <h4>{t('mixer.aiAssistTitle')}</h4>
            <p>{t('mixer.aiAssistDesc')}</p>
            <textarea
              className="ai-textarea"
              placeholder={t('mixer.aiPlaceholder')}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              rows={4}
              autoFocus
              disabled={aiLoading}
            />
            {aiError && <div className="ai-error">{aiError}</div>}
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => { setShowAI(false); setAiError('') }} disabled={aiLoading}>
                {t('mixer.cancel')}
              </button>
              <button className="btn" onClick={handleAISubmit} disabled={aiLoading || !aiInput.trim()}>
                {aiLoading ? t('mixer.aiThinking') : t('common.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
