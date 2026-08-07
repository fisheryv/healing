export const recommendations = [
  { id: 'r1', name: 'Glass Rain', tag: 'Ambient · Calm', cover: 'assets/cover00.png' },
  { id: 'r2', name: 'Still Dance', tag: 'Lo-fi · Focus', cover: 'assets/cover01.png' },
  { id: 'r3', name: 'Thread of Dawn', tag: 'Lo-fi · Study', cover: 'assets/cover02.png' },
  { id: 'r4', name: 'Distant Shore', tag: 'Ambient · Sleep', cover: 'assets/cover03.png' },
  { id: 'r5', name: 'Cloud Altar', tag: 'Piano · Reading', cover: 'assets/cover04.png' }
]

// key: 调式主音音名 (C, C#, D, ... B), mode: 'major' | 'minor'
// 调性由 librosa + Krumhansl-Schmuckler 算法分析音频得出 (scripts/analyze_keys.py)
// m7/m8 置信度较低，建议人工试听复核
export const officialMusic = [
  { id: 'm1',  name: 'Glass Rain',     tag: 'Ambient', duration: '03:24', cover: 'assets/album01.png', src: 'sound/music/m1.mp3', key: 'F',  mode: 'major' },
  { id: 'm2',  name: 'Still Dance',    tag: 'Lo-fi',   duration: '04:12', cover: 'assets/album02.png', src: 'sound/music/m2.mp3', key: 'G#', mode: 'minor' },
  { id: 'm3',  name: 'Thread of Dawn', tag: 'Lo-fi',   duration: '05:48', cover: 'assets/album03.png', src: 'sound/music/m3.mp3', key: 'A',  mode: 'minor' },
  { id: 'm4',  name: 'Distant Shore',  tag: 'Ambient', duration: '03:56', cover: 'assets/album04.png', src: 'sound/music/m4.mp3', key: 'A',  mode: 'major' },
  { id: 'm5',  name: 'Cloud Altar',    tag: 'Piano',   duration: '04:33', cover: 'assets/album05.png', src: 'sound/music/m5.mp3', key: 'D',  mode: 'major' },
  { id: 'm6',  name: 'Sun Vessel',     tag: 'Lo-fi',   duration: '06:02', cover: 'assets/album06.png', src: 'sound/music/m6.mp3', key: 'E',  mode: 'major' },
  { id: 'm7',  name: 'Soft Ember',     tag: 'Ambient', duration: '03:18', cover: 'assets/album07.png', src: 'sound/music/m7.mp3', key: 'D#', mode: 'major' }, // low confidence, alt=D#/minor
  { id: 'm8',  name: 'May Nocturne',   tag: 'Piano',   duration: '04:05', cover: 'assets/album08.png', src: 'sound/music/m8.mp3', key: 'D',  mode: 'minor' }, // low confidence, alt=D/major
  { id: 'm9',  name: 'Moss & Pine',    tag: 'Ambient', duration: '05:20', cover: 'assets/album09.png', src: 'sound/music/m9.mp3', key: 'A',  mode: 'major' },
  { id: 'm10', name: 'Moon Garden',    tag: 'Ambient', duration: '04:48', cover: 'assets/album10.png', src: 'sound/music/m10.mp3', key: 'C',  mode: 'minor' }
]

export const blogs = [
  {
    id: 'b1',
    title: 'Why the ADHD community needs "invisible" focus tools more than ever',
    date: '2026.05.20',
    image: 'assets/blog01.png',
    author: 'Healing Editorial',
    readMins: 6,
    summary: 'Traditional productivity apps demand constant attention from the very people whose attention is already scattered. Invisible tools work the opposite way.',
    content: [
      { type: 'p', text: 'For most people, opening a focus app is a small act of discipline. For someone with ADHD, it can feel like another demand in an already noisy day — one more notification, one more dashboard, one more place where attention is supposed to land and hold still.' },
      { type: 'p', text: 'The irony is sharp. The population that most needs help sustaining attention is also the population most easily overwhelmed by tools that require attention to operate. Checkboxes beg to be checked. Streaks beg to be maintained. Timers tick loudly in the corner of the screen, turning the act of concentrating into a performance that must be witnessed.' },
      { type: 'h2', text: 'The visibility trap' },
      { type: 'p', text: 'Most productivity software is designed around visibility. Progress bars, heatmaps, weekly reports, celebratory animations — these are all signals meant to reward engagement. But for an ADHD brain, engagement and attention are not the same thing. A tool can be deeply engaging (bright, gamified, full of micro-rewards) while actively undermining the sustained, low-arousal attention that real focus requires.' },
      { type: 'p', text: 'The result is a familiar loop: download the app, feel productive for three days, then abandon it when the dopamine of novelty fades. The tool didn\'t fail because it was bad. It failed because it asked the user to perform focus rather than practice it.' },
      { type: 'img', src: 'assets/blog01.png', caption: 'An invisible tool should disappear the moment focus begins.' },
      { type: 'h2', text: 'What "invisible" means' },
      { type: 'p', text: 'An invisible focus tool does three things. First, it reduces the number of decisions before a session begins — ideally to zero. You don\'t choose a timer length, a sound profile, a color theme. You set foot down, face the screen away, and it begins.' },
      { type: 'p', text: 'Second, it removes the running clock from view. Knowing how much time remains is, for many people, a constant low-grade anxiety. Not knowing — trusting the tool to end the session for you — is a kind of permission to actually be present.' },
      { type: 'p', text: 'Third, it transforms the residue of focus into something you keep, rather than a metric you chase. A painting generated from your session is not a score. You cannot compare it to yesterday\'s painting and feel you did worse. It is simply a record that you were here, and that here-ness lasted some amount of time.' },
      { type: 'h2', text: 'Why the phone-down gesture matters' },
      { type: 'p', text: 'The physical act of placing the phone face-down is not incidental. It is the core interaction. For someone with ADHD, the screen itself is often the source of distraction — the ambient pull toward checking, scrolling, verifying. Placing it face-down is a small ritual of refusal: I am choosing, for this interval, not to look.' },
      { type: 'p', text: 'The tool meets that refusal halfway. It doesn\'t punish you for picking the phone back up; it simply notes that the session was interrupted and preserves what was made. The painting may be a fragment rather than a finished curve, but fragments are still evidence of attempt. They are kept, not discarded.' },
      { type: 'h2', text: 'A quieter metric' },
      { type: 'p', text: 'The only number that matters, in this model, is not minutes focused or sessions completed. It is whether, over weeks, the collection of small painted curves begins to resemble a practice. Not a streak — a practice. Something you return to not because an app reminds you, but because the act itself has become its own reward.' },
      { type: 'p', text: 'That is the goal, anyway. We are still learning whether invisible tools can sustain themselves without the engagement mechanics that power most software. But for the people who have tried it, the early signal is consistent: when the tool disappears, the focus doesn\'t.' }
    ]
  },
  {
    id: 'b2',
    title: 'The neuroscience behind binaural beats: What are Alpha waves?',
    date: '2026.05.14',
    image: 'assets/blog02.png',
    author: 'Healing Research',
    readMins: 8,
    summary: 'When two slightly different tones enter each ear, the brain perceives a third, phantom rhythm. Whether that rhythm can actually steer your mental state is a more interesting question than it first appears.',
    content: [
      { type: 'p', text: 'If you play a 200 Hz tone in one ear and a 210 Hz tone in the other, you will not hear two separate pitches. You will hear a single tone that seems to pulse, slowly, at 10 times per second. That phantom pulse is the binaural beat — a perception constructed not by your ears but by the auditory cortex, which detects the phase difference between the two incoming signals and renders it as a rhythmic shimmer.' },
      { type: 'p', text: 'The claim, popular since the 1970s, is that this phantom rhythm can entrain the brain: that by choosing the right frequency difference, you can coax your brainwaves toward a desired state. To evaluate that claim, it helps to first understand what brainwaves actually are.' },
      { type: 'h2', text: 'Brainwaves, in brief' },
      { type: 'p', text: 'Neurons communicate through tiny electrical impulses. When large populations of neurons fire in synchrony, their combined activity produces oscillations that can be measured at the scalp — the wavy lines of an EEG. These oscillations are conventionally grouped into bands, each loosely associated with a different state of consciousness.' },
      { type: 'p', text: 'Delta (0.5–4 Hz) dominates during deep, dreamless sleep. Theta (4–8 Hz) appears in drowsiness, light sleep, and some forms of meditation. Alpha (8–13 Hz) is the signature of a relaxed, awake brain with eyes closed — the idle hum of a cortex at rest. Beta (13–30 Hz) accompanies active, engaged thinking. Gamma (30 Hz and above) is implicated in higher-order cognition and perception.' },
      { type: 'p', text: 'The bands are descriptive, not prescriptive. A brain in alpha is not "better" or "worse" than a brain in beta; it is simply doing different work. But the associations are stable enough that researchers have long wondered whether you can nudge the brain from one band to another by presenting an external rhythm at the target frequency.' },
      { type: 'img', src: 'assets/blog02.png', caption: 'The five major brainwave bands, from slow Delta to fast Gamma.' },
      { type: 'h2', text: 'What Alpha actually feels like' },
      { type: 'p', text: 'Alpha is the band most people are implicitly reaching for when they reach for a focus tool. It is the rhythm of a mind that is awake but not straining — the state of sitting on a porch in early evening, or of reading a book whose words arrive without effort. It is not the state of cramming for an exam, nor the state of drifting off. It is the quiet, receptive middle.' },
      { type: 'p', text: 'Studies on alpha-band binaural beats are mixed but not empty. Some report modest improvements in sustained attention and reductions in self-reported anxiety; others find no statistically significant effect beyond a placebo. The honest summary is that binaural beats are not a switch you flip. They are, at best, a gentle current — something that may make it slightly easier to drift into a state you were already inclined toward.' },
      { type: 'h2', text: 'Why the carrier frequency matters' },
      { type: 'p', text: 'A subtle point often missed: the perceived beat (say, 10 Hz) is not the only variable. The carrier — the average of the two tones, around 205 Hz in our example — also matters, because the auditory system responds differently to different registers. A 10 Hz beat carried at 200 Hz feels different from a 10 Hz beat carried at 440 Hz, even though the entrainment target is identical.' },
      { type: 'p', text: 'This is why, in practice, a well-designed binaural preset does not just pick a band. It picks a carrier that is pleasant to listen to for long stretches, and a beat frequency that matches the kind of attention you want to hold. Alpha for reading. Theta for drifting. Beta for the rare moments when you genuinely need to push.' },
      { type: 'h2', text: 'A tool, not a treatment' },
      { type: 'p', text: 'It is worth saying plainly: binaural beats are not a treatment for ADHD, anxiety, insomnia, or any clinical condition. If you find them helpful, that is a good reason to use them. If you find them do nothing, that is also a normal and expected outcome. The mechanism is subtle enough that individual variation is large, and the effect sizes in the literature are modest.' },
      { type: 'p', text: 'What binaural beats offer, used honestly, is a low-cost way to shape the sonic environment of a focus session. Combined with music and ambient noise, they can tilt the overall texture of a soundscape toward calm or toward alertness. The painting your session produces will not care which band you chose. But you may notice, over time, that certain bands consistently precede sessions that feel easier — and that is a useful thing to learn about your own brain.' }
    ]
  },
  {
    id: 'b3',
    title: 'Turning focus into a painting: The resonance between parametric equations and music',
    date: '2026.05.06',
    image: 'assets/blog03.png',
    author: 'Healing Studio',
    readMins: 7,
    summary: 'Every curve in your gallery is the trace of a session. Behind that trace is a family of equations that, like music, find beauty in the interplay of simple rhythms.',
    content: [
      { type: 'p', text: 'When a focus session ends and the painting appears, the first instinct is to read it as a picture — a shape to be liked or not liked, saved or discarded. But every curve in the gallery is also a record. It is the path traced by a point moving according to a small set of rules, over the minutes you held your attention. To understand the rules is to see the paintings differently.' },
      { type: 'h2', text: 'The simplest resonance: Lissajous' },
      { type: 'p', text: 'The most fundamental curve in the system is the Lissajous figure. It arises when a point moves simultaneously in two directions — horizontally and vertically — each at its own steady frequency. If the two frequencies are simple ratios (2:3, 3:4), the point eventually closes its path into a clean, looping knot. If the ratio is irrational, the path never closes; it fills the available space slowly, like thread winding onto a spool.' },
      { type: 'p', text: 'This is, almost exactly, what happens in music. A chord is two or more frequencies sounding at once. When their ratios are simple, the chord feels stable, resolved. When the ratios are complex, the chord feels restless, dense. The Lissajous curve is the visual analogue of that same principle: simple ratios make closed forms, complex ratios make open ones.' },
      { type: 'img', src: 'assets/blog03.png', caption: 'A Lissajous figure with a 3:4 frequency ratio — the visual equivalent of a perfect fourth.' },
      { type: 'h2', text: 'Roses and gears' },
      { type: 'p', text: 'Beyond Lissajous, the system draws from a small bestiary of classical curves. The Rhodonea, or rose curve, is traced by a point whose distance from the center oscillates as it rotates — producing petals whose count depends on whether the frequency ratio is odd or even. A 3-petal rose and a 4-petal rose feel as different from each other as a major triad feels from a minor one.' },
      { type: 'p', text: 'The Hypotrochoid and Epicycloid are older still — they describe the path of a point on a small circle rolling around the inside or outside of a larger one. These are the curves produced by a Spirograph, the children\'s toy, and they were studied seriously by mathematicians long before they were toys. Their beauty is the beauty of compounded rotation: two circular motions, nested, generating forms of surprising intricacy from astonishingly simple ingredients.' },
      { type: 'h2', text: 'Why the session length shapes the painting' },
      { type: 'p', text: 'A subtle feature of the system: the same curve, drawn over a longer session, looks different from the same curve drawn over a shorter one. This is not because the equation changes. It is because the point is given more time to travel. A Lissajous figure with a 3:4 ratio closes after a fixed number of cycles; if your session is long enough to complete several cycles, the line simply retraces itself, deepening in density. If your session ends early, the curve is incomplete — an open arc rather than a closed knot.' },
      { type: 'p', text: 'This is why fragments and complete paintings feel so different, even when they share the same underlying equation. A fragment is a curve interrupted mid-sentence. A complete painting is a curve that has said what it had to say, possibly more than once. Neither is more valid. But they carry different kinds of evidence about the session that produced them.' },
      { type: 'h2', text: 'The decay of attention' },
      { type: 'p', text: 'Some curves in the system — the Harmonograph, most notably — include a decay term. The point\'s amplitude slowly diminishes over time, so the spiral tightens inward, like a spring settling. This is not a literal model of attention, but it is a resonant one. Attention does not hold steady; it breathes. It strengthens, wanders, returns. A curve with decay gives that breathing a visible shape — an outward wandering that gradually gathers itself toward center.' },
      { type: 'p', text: 'When you look across a gallery of paintings made over many sessions, what you are seeing is not just a collection of shapes. You are seeing a family of mathematical gestures, each one tuned by the length and texture of a single act of attention. The equations are old. The practice of holding attention is old. The paintings are simply where the two meet.' }
    ]
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
    { id: 'white', name: 'White Noise', desc: 'Balanced masking, suitable for general environments', src: { synth: 'noise', type: 'white' } },
    { id: 'pink', name: 'Pink Noise', desc: 'Soft and balanced, suitable for long listening', src: { synth: 'noise', type: 'pink' } },
    { id: 'brown', name: 'Brown Noise', desc: 'Deep like a heavy current, strong masking effect', src: { synth: 'noise', type: 'brown' } }
  ],
  ambient: [
    { id: 'rain', name: 'Rain', src: 'sound/ambient/light-rain.mp3' },
    { id: 'heavy-rain', name: 'Heavy Rain', src: 'sound/ambient/heavy-rain.mp3' },
    { id: 'waves', name: 'Ocean Waves', src: 'sound/ambient/waves.mp3' },
    { id: 'wind', name: 'Wind', src: 'sound/ambient/wind.mp3' },
    { id: 'howling-wind', name: 'Howling Wind', src: 'sound/ambient/howling-wind.mp3' },
    { id: 'wind-trees', name: 'Wind in Trees', src: 'sound/ambient/wind-in-trees.mp3' },
    { id: 'forest', name: 'Forest', src: 'sound/ambient/jungle.mp3' },
    { id: 'stream', name: 'Stream', src: 'sound/ambient/river.mp3' },
    { id: 'waterfall', name: 'Waterfall', src: 'sound/ambient/waterfall.mp3' },
    { id: 'fire', name: 'Campfire', src: 'sound/ambient/campfire.mp3' },
    { id: 'droplets', name: 'Droplets', src: 'sound/ambient/droplets.mp3' }
  ]
}

export const atmosOptions = [
  { id: 'birds', name: 'Birds', src: 'sound/ambient/birds.mp3' },
  { id: 'pages', name: 'Page Turning', src: 'sound/ambient/pages.mp3' },
  { id: 'keys', name: 'Keyboard', src: 'sound/ambient/keys.mp3' },
  { id: 'write', name: 'Writing', src: 'sound/ambient/write.mp3' },
  { id: 'cicada', name: 'Cicada', src: 'sound/ambient/cicida.mp3' },
  { id: 'crickets', name: 'Crickets', src: 'sound/ambient/crickets.mp3' },
  { id: 'steps-snow', name: 'Steps on Snow', src: 'sound/ambient/walk-in-snow.mp3' },
  { id: 'steps-gravel', name: 'Steps on Gravel', src: 'sound/ambient/walk-on-gravel.mp3' },
  { id: 'steps-leaves', name: 'Steps on Leaves', src: 'sound/ambient/walk-on-leaves.mp3' },
  { id: 'chime', name: 'Wind Chime', src: 'sound/ambient/chime.mp3' },
  { id: 'cat', name: 'Cat', src: 'sound/ambient/cat.mp3' },
  { id: 'coffee', name: 'Coffee Grinding', src: 'sound/ambient/coffee.mp3' }
]

/**
 * 双耳节拍: baseHz 是载体基准频率, beatHz 是左右耳频率差（即脑波目标频率）
 * 取每类脑波范围的中间值
 */
export const binauralOptions = [
  { id: 'delta', name: 'Delta', range: '0.5–4 Hz', desc: 'Deep slow waves, suitable for deep relaxation and meditation', src: { synth: 'binaural', baseFreq: 150, beatHz: 2 } },
  { id: 'theta', name: 'Theta', range: '4–8 Hz', desc: 'Dreamlike boundary, suitable for meditation and creative divergence', src: { synth: 'binaural', baseFreq: 180, beatHz: 6 } },
  { id: 'alpha', name: 'Alpha', range: '8–13 Hz', desc: 'Awake and relaxed, suitable for light focus and reading', src: { synth: 'binaural', baseFreq: 200, beatHz: 10 } },
  { id: 'beta', name: 'Beta', range: '13–30 Hz', desc: 'Active thinking, suitable for active thinking and efficient learning', src: { synth: 'binaural', baseFreq: 250, beatHz: 18 } }
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

/**
 * 音名 → 频率（基于 A4 = 440 Hz 等律十二平均律）
 * @param {string} note - 音名，支持升降号，如 'C', 'C#', 'Db', 'A', 'A#', 'Bb'
 * @param {number} [octave=4] - 八度数，如 4 表示 C4(A4 所在八度)
 * @returns {number} 频率 (Hz)
 */
export function noteToFreq(note, octave = 4) {
  const noteMap = {
    'C': 0, 'C#': 1, 'DB': 1,
    'D': 2, 'D#': 3, 'EB': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'GB': 6,
    'G': 7, 'G#': 8, 'AB': 8,
    'A': 9, 'A#': 10, 'BB': 10,
    'B': 11
  }
  const key = note.toUpperCase().replace(/SHARP/g, '#').replace(/FLAT/g, 'B')
  const semitone = noteMap[key]
  if (semitone === undefined) {
    throw new Error(`Unknown note: ${note}`)
  }
  // A4 的 MIDI 编号 = 69, 该音名的 MIDI 编号 = (octave + 1) * 12 + semitone
  const midi = (octave + 1) * 12 + semitone
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/**
 * 根据调性（主音 + 大小调）计算双耳节拍载波中心频率。
 * 主音频率会自动调整到 100–300 Hz 中低频薄弱频段（取低/高八度），适合作为双耳节拍载波。
 * @param {string} key - 主音音名，如 'C', 'A', 'F#'
 * @param {string} [mode='major'] - 调式 'major' | 'minor'（仅语义标注，载波始终取主音频率）
 * @returns {number} 载波中心频率 (Hz)
 */
export function getCarrierFreqFromKey(key, mode = 'major') {
  void mode // mode 仅作语义标注：载波始终取主音频率（大小调共享同一主音）
  if (!key) return null
  // 先取主音在八度 4 的频率
  let freq = noteToFreq(key, 4)
  // 调整到 100–300 Hz 频段
  while (freq > 300) freq /= 2
  while (freq < 100) freq *= 2
  return Math.round(freq * 10) / 10
}
