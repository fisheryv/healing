export const recommendations = [
  { id: 'r1', name: 'Drifting Pages', tag: 'Lo-fi · Focus', cover: 'assets/cover00.png' },
  { id: 'r2', name: 'Quiet Atelier', tag: 'Classical · Reading', cover: 'assets/cover01.png' },
  { id: 'r3', name: 'Forest Window', tag: 'Ambient · Calm', cover: 'assets/cover02.png' },
  { id: 'r4', name: 'Evening Tide', tag: 'Piano · Sleep', cover: 'assets/cover03.png' },
  { id: 'r5', name: 'Paper Lantern', tag: 'Lo-fi · Study', cover: 'assets/cover04.png' }
]

export const officialMusic = [
  { id: 'm1', name: 'Drifting Pages', tag: 'Lo-fi', duration: '03:24', cover: 'assets/album01.png' },
  { id: 'm2', name: 'Quiet Atelier', tag: 'Classical', duration: '04:12', cover: 'assets/album02.png' },
  { id: 'm3', name: 'Forest Window', tag: 'Ambient', duration: '05:48', cover: 'assets/album03.png' },
  { id: 'm4', name: 'Evening Tide', tag: 'Piano', duration: '03:56', cover: 'assets/album04.png' },
  { id: 'm5', name: 'Paper Lantern', tag: 'Lo-fi', duration: '04:33', cover: 'assets/album05.png' },
  { id: 'm6', name: 'Linen Sky', tag: 'Ambient', duration: '06:02', cover: 'assets/album06.png' },
  { id: 'm7', name: 'Ink & Rain', tag: 'Lo-fi', duration: '03:18', cover: 'assets/album07.png' }
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
  }
]

export const noiseOptions = {
  pure: [
    { id: 'white', name: '白噪音', desc: '均衡掩蔽，适合普通环境' },
    { id: 'pink', name: '粉噪音', desc: '柔和均衡，适合长时间聆听' },
    { id: 'brown', name: '褐噪音', desc: '低沉如深流，掩蔽效果强' }
  ],
  ambient: [
    { id: 'rain', name: '雨声' },
    { id: 'waves', name: '海浪' },
    { id: 'wind', name: '风声' },
    { id: 'forest', name: '森林' },
    { id: 'stream', name: '溪流' },
    { id: 'cafe', name: '咖啡厅' },
    { id: 'fire', name: '篝火' },
    { id: 'thunder', name: '雷声' }
  ]
}

export const atmosOptions = [
  { id: 'birds', name: '鸟鸣' },
  { id: 'pages', name: '翻书声' },
  { id: 'keys', name: '键盘声' },
  { id: 'steps', name: '脚步声' },
  { id: 'grind', name: '咖啡研磨' },
  { id: 'paper', name: '纸张翻动' },
  { id: 'chime', name: '风铃' },
  { id: 'cat', name: '猫咪' },
  { id: 'write', name: '写字声' },
  { id: 'flame', name: '火焰爆裂' },
  { id: 'cicada', name: '蝉鸣' },
  { id: 'cricket', name: '蟋蟀' }
]

export const binauralOptions = [
  { id: 'delta', name: 'Delta', range: '0.5–4 Hz', desc: '深度慢波，适合深度放松与冥想入定' },
  { id: 'theta', name: 'Theta', range: '4–8 Hz', desc: '梦境边界，适合冥想与创意发散' },
  { id: 'alpha', name: 'Alpha', range: '8–13 Hz', desc: '清醒放松，适合轻松专注与阅读学习' },
  { id: 'beta', name: 'Beta', range: '13–30 Hz', desc: '活跃思维，适合主动思考与高效学习' }
]

export const curveTypes = ['Lissajous', 'Rhodonea', 'Hypotrochoid', 'Logarithmic Spiral', 'Butterfly']

export function pickQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)]
}

export function pickCurve() {
  return curveTypes[Math.floor(Math.random() * curveTypes.length)]
}
