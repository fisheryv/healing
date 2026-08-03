export const recommendations = [
  { id: 'r1', name: 'Glass Rain', tag: 'Ambient · Calm', cover: 'assets/cover00.png' },
  { id: 'r2', name: 'Still Dance', tag: 'Lo-fi · Focus', cover: 'assets/cover01.png' },
  { id: 'r3', name: 'Thread of Dawn', tag: 'Lo-fi · Study', cover: 'assets/cover02.png' },
  { id: 'r4', name: 'Distant Shore', tag: 'Ambient · Sleep', cover: 'assets/cover03.png' },
  { id: 'r5', name: 'Cloud Altar', tag: 'Piano · Reading', cover: 'assets/cover04.png' }
]

export const officialMusic = [
  { id: 'm1',  name: 'Glass Rain',     tag: 'Ambient', duration: '03:24', cover: 'assets/album01.png', src: 'sound/music/m1.mp3' },
  { id: 'm2',  name: 'Still Dance',    tag: 'Lo-fi',   duration: '04:12', cover: 'assets/album02.png', src: 'sound/music/m2.mp3' },
  { id: 'm3',  name: 'Thread of Dawn', tag: 'Lo-fi',   duration: '05:48', cover: 'assets/album03.png', src: 'sound/music/m3.mp3' },
  { id: 'm4',  name: 'Distant Shore',  tag: 'Ambient', duration: '03:56', cover: 'assets/album04.png', src: 'sound/music/m4.mp3' },
  { id: 'm5',  name: 'Cloud Altar',    tag: 'Piano',   duration: '04:33', cover: 'assets/album05.png', src: 'sound/music/m5.mp3' },
  { id: 'm6',  name: 'Sun Vessel',     tag: 'Lo-fi',   duration: '06:02', cover: 'assets/album06.png', src: 'sound/music/m6.mp3' },
  { id: 'm7',  name: 'Soft Ember',     tag: 'Ambient', duration: '03:18', cover: 'assets/album07.png', src: 'sound/music/m7.mp3' },
  { id: 'm8',  name: 'May Nocturne',   tag: 'Piano',   duration: '04:05', cover: 'assets/album08.png', src: 'sound/music/m8.mp3' },
  { id: 'm9',  name: 'Moss & Pine',    tag: 'Ambient', duration: '05:20', cover: 'assets/album09.png', src: 'sound/music/m9.mp3' },
  { id: 'm10', name: 'Moon Garden',    tag: 'Ambient', duration: '04:48', cover: 'assets/album10.png', src: 'sound/music/m10.mp3' }
]

export const blogs = [
  {
    id: 'b1',
    title: 'Why the ADHD community needs "invisible" focus tools more than ever',
    date: '2026.05.20',
    image: 'assets/blog01.png'
  },
  {
    id: 'b2',
    title: 'The neuroscience behind binaural beats: What are Alpha waves?',
    date: '2026.05.14',
    image: 'assets/blog02.png'
  },
  {
    id: 'b3',
    title: 'Turning focus into a painting: The resonance between parametric equations and music',
    date: '2026.05.06',
    image: 'assets/blog03.png'
  }
]

export const quotes = [
  {
    en: 'In the deep silence of the morning, I heard the world begin to breathe.',
    cn: '清晨的深寂中，我听见世界缓缓呼吸——专注是与时间共处的方式。'
  },
  {
    en: 'Stillness is not the absence of motion, but the presence of attention.',
    cn: '静止并非没有运动，而是注意力的在场。'
  },
  {
    en: 'A line drawn slowly is a thought made visible.',
    cn: '缓缓画出的一条线，是一个念头的显形。'
  },
  {
    en: 'The river does not hurry, yet it arrives at the sea.',
    cn: '河流从不急迫，却终将抵达海洋。'
  },
  {
    en: 'Attention is the rarest and purest form of generosity.',
    cn: '注意力是最稀有、最纯粹的慷慨。'
  },
  {
    en: 'Where attention goes, energy flows.',
    cn: '注意力所至，能量随之。'
  },
  {
    en: 'The quieter you become, the more you can hear.',
    cn: '你越安静，能听见的就越多。'
  },
  {
    en: 'To do two things at once is to do neither.',
    cn: '同时做两件事，等于两件都没做。'
  }
]

/**
 * src 字段说明:
 *  - 字符串路径  → 加载音频文件（相对 public/）
 *  - { synth: 'noise', type } → Web Audio 实时合成噪音
 *  - { synth: 'binaural', baseFreq, beatHz } → Web Audio 实时合成双耳节拍
 *
 * 文件命名约定:
 *  - 主音乐: public/sound/music/m1.mp3 ~ m10.mp3
 *  - 氛围音: public/sound/ambient/<filename>.mp3
 */
export const noiseOptions = {
  pure: [
    { id: 'white', name: '白噪音', desc: '均衡掩蔽，适合普通环境', src: { synth: 'noise', type: 'white' } },
    { id: 'pink', name: '粉噪音', desc: '柔和均衡，适合长时间聆听', src: { synth: 'noise', type: 'pink' } },
    { id: 'brown', name: '褐噪音', desc: '低沉如深流，掩蔽效果强', src: { synth: 'noise', type: 'brown' } }
  ],
  ambient: [
    { id: 'rain', name: '雨声', src: 'sound/ambient/light-rain.mp3' },
    { id: 'heavy-rain', name: '暴雨', src: 'sound/ambient/heavy-rain.mp3' },
    { id: 'waves', name: '海浪', src: 'sound/ambient/waves.mp3' },
    { id: 'wind', name: '风声', src: 'sound/ambient/wind.mp3' },
    { id: 'howling-wind', name: '呼啸风', src: 'sound/ambient/howling-wind.mp3' },
    { id: 'wind-trees', name: '林间风', src: 'sound/ambient/wind-in-trees.mp3' },
    { id: 'forest', name: '森林', src: 'sound/ambient/jungle.mp3' },
    { id: 'stream', name: '溪流', src: 'sound/ambient/river.mp3' },
    { id: 'waterfall', name: '瀑布', src: 'sound/ambient/waterfall.mp3' },
    { id: 'fire', name: '篝火', src: 'sound/ambient/campfire.mp3' },
    { id: 'droplets', name: '水滴', src: 'sound/ambient/droplets.mp3' }
  ]
}

export const atmosOptions = [
  { id: 'birds', name: '鸟鸣', src: 'sound/ambient/birds.mp3' },
  { id: 'pages', name: '翻书声', src: 'sound/ambient/pages.mp3' },
  { id: 'keys', name: '键盘声', src: 'sound/ambient/keys.mp3' },
  { id: 'write', name: '写字声', src: 'sound/ambient/write.mp3' },
  { id: 'cicada', name: '蝉鸣', src: 'sound/ambient/cicida.mp3' },
  { id: 'crickets', name: '蟋蟀', src: 'sound/ambient/crickets.mp3' },
  { id: 'steps-snow', name: '踏雪', src: 'sound/ambient/walk-in-snow.mp3' },
  { id: 'steps-gravel', name: '踏石', src: 'sound/ambient/walk-on-gravel.mp3' },
  { id: 'steps-leaves', name: '踏叶', src: 'sound/ambient/walk-on-leaves.mp3' },
  { id: 'chime', name: '风铃', src: 'sound/ambient/chime.mp3' },
  { id: 'cat', name: '猫咪', src: 'sound/ambient/cat.mp3' },
  { id: 'coffee', name: '咖啡研磨', src: 'sound/ambient/coffee.mp3' }
]

/**
 * 双耳节拍: baseHz 是载体基准频率, beatHz 是左右耳频率差（即脑波目标频率）
 * 取每类脑波范围的中间值
 */
export const binauralOptions = [
  { id: 'delta', name: 'Delta', range: '0.5–4 Hz', desc: '深度慢波，适合深度放松与冥想入定', src: { synth: 'binaural', baseFreq: 150, beatHz: 2 } },
  { id: 'theta', name: 'Theta', range: '4–8 Hz', desc: '梦境边界，适合冥想与创意发散', src: { synth: 'binaural', baseFreq: 180, beatHz: 6 } },
  { id: 'alpha', name: 'Alpha', range: '8–13 Hz', desc: '清醒放松，适合轻松专注与阅读学习', src: { synth: 'binaural', baseFreq: 200, beatHz: 10 } },
  { id: 'beta', name: 'Beta', range: '13–30 Hz', desc: '活跃思维，适合主动思考与高效学习', src: { synth: 'binaural', baseFreq: 250, beatHz: 18 } }
]

export const curveTypes = [
  'Lissajous',
  'Rhodonea',
  'Hypotrochoid',
  'Logarithmic Spiral',
  'Butterfly',
  'Epicycloid',
  'Harmonograph',
  'Spirograph',
  'Rose Flow',
  'Fermat Spiral'
]

/**
 * 构建 id → src 的映射表，供 audioEngine.loadMix 使用
 * 合并 officialMusic / noiseOptions.pure / noiseOptions.ambient / atmosOptions / binauralOptions
 */
export function buildSrcMap() {
  const map = {}
  officialMusic.forEach((m) => { if (m.src) map[m.id] = m.src })
  noiseOptions.pure.forEach((n) => { if (n.src) map[n.id] = n.src })
  noiseOptions.ambient.forEach((n) => { if (n.src) map[n.id] = n.src })
  atmosOptions.forEach((a) => { if (a.src) map[a.id] = a.src })
  binauralOptions.forEach((b) => { if (b.src) map[b.id] = b.src })
  return map
}

/**
 * 根据 id 查找音乐项（用于 preset 回显）
 */
export function findMusicById(id) {
  return officialMusic.find((m) => m.id === id)
}

/**
 * 从文学摘录中随机选取一条，避免短期重复
 * @param {string[]} recentEn - 最近使用过的摘录 en 字段数组
 * @returns {object} quote
 */
export function pickQuote(recentEn = []) {
  const available = quotes.filter((q) => !recentEn.includes(q.en))
  const pool = available.length > 0 ? available : quotes
  return pool[Math.floor(Math.random() * pool.length)]
}

export function pickCurve() {
  return curveTypes[Math.floor(Math.random() * curveTypes.length)]
}
