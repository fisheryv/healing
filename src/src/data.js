export const recommendations = [
  { id: 'r1', name: { en: 'Glass Rain', zh: '玻璃雨' }, tag: { en: 'Ambient · Calm', zh: '氛围 · 宁静' }, cover: 'assets/cover00.png' },
  { id: 'r2', name: { en: 'Still Dance', zh: '静舞' }, tag: { en: 'Lo-fi · Focus', zh: 'Lo-fi · 专注' }, cover: 'assets/cover01.png' },
  { id: 'r3', name: { en: 'Thread of Dawn', zh: '晨曦之线' }, tag: { en: 'Lo-fi · Study', zh: 'Lo-fi · 学习' }, cover: 'assets/cover02.png' },
  { id: 'r4', name: { en: 'Distant Shore', zh: '远岸' }, tag: { en: 'Ambient · Sleep', zh: '氛围 · 安眠' }, cover: 'assets/cover03.png' },
  { id: 'r5', name: { en: 'Cloud Altar', zh: '云上祭坛' }, tag: { en: 'Piano · Reading', zh: '钢琴 · 阅读' }, cover: 'assets/cover04.png' }
]

// key: 调式主音音名 (C, C#, D, ... B), mode: 'major' | 'minor'
// 调性由 librosa + Krumhansl-Schmuckler 算法分析音频得出 (scripts/analyze_keys.py)
// m7/m8 置信度较低，建议人工试听复核
export const officialMusic = [
  { id: 'm1',  name: { en: 'Glass Rain',     zh: '玻璃雨' },    tag: { en: 'Ambient', zh: '氛围' }, duration: '03:24', cover: 'assets/album01.png', src: 'sound/music/m1.mp3', key: 'F',  mode: 'major' },
  { id: 'm2',  name: { en: 'Still Dance',    zh: '静舞' },      tag: { en: 'Lo-fi',   zh: 'Lo-fi' }, duration: '04:12', cover: 'assets/album02.png', src: 'sound/music/m2.mp3', key: 'G#', mode: 'minor' },
  { id: 'm3',  name: { en: 'Thread of Dawn', zh: '晨曦之线' },  tag: { en: 'Lo-fi',   zh: 'Lo-fi' }, duration: '05:48', cover: 'assets/album03.png', src: 'sound/music/m3.mp3', key: 'A',  mode: 'minor' },
  { id: 'm4',  name: { en: 'Distant Shore',  zh: '远岸' },      tag: { en: 'Ambient', zh: '氛围' }, duration: '03:56', cover: 'assets/album04.png', src: 'sound/music/m4.mp3', key: 'A',  mode: 'major' },
  { id: 'm5',  name: { en: 'Cloud Altar',    zh: '云上祭坛' },  tag: { en: 'Piano',   zh: '钢琴' }, duration: '04:33', cover: 'assets/album05.png', src: 'sound/music/m5.mp3', key: 'D',  mode: 'major' },
  { id: 'm6',  name: { en: 'Sun Vessel',     zh: '太阳之舟' },  tag: { en: 'Lo-fi',   zh: 'Lo-fi' }, duration: '06:02', cover: 'assets/album06.png', src: 'sound/music/m6.mp3', key: 'E',  mode: 'major' },
  { id: 'm7',  name: { en: 'Soft Ember',     zh: '柔烬' },      tag: { en: 'Ambient', zh: '氛围' }, duration: '03:18', cover: 'assets/album07.png', src: 'sound/music/m7.mp3', key: 'D#', mode: 'major' },
  { id: 'm8',  name: { en: 'May Nocturne',   zh: '五月夜曲' },  tag: { en: 'Piano',   zh: '钢琴' }, duration: '04:05', cover: 'assets/album08.png', src: 'sound/music/m8.mp3', key: 'D',  mode: 'minor' },
  { id: 'm9',  name: { en: 'Moss & Pine',    zh: '苔与松' },    tag: { en: 'Ambient', zh: '氛围' }, duration: '05:20', cover: 'assets/album09.png', src: 'sound/music/m9.mp3', key: 'A',  mode: 'major' },
  { id: 'm10', name: { en: 'Moon Garden',    zh: '月之庭' },    tag: { en: 'Ambient', zh: '氛围' }, duration: '04:48', cover: 'assets/album10.png', src: 'sound/music/m10.mp3', key: 'C',  mode: 'minor' }
]

export const blogs = [
  {
    id: 'b1',
    title: { en: 'Why the ADHD community needs "invisible" focus tools more than ever', zh: '为什么 ADHD 群体比以往更需要"隐形"的专注工具' },
    date: '2026.05.20',
    image: 'assets/blog01.png',
    author: { en: 'Healing Editorial', zh: '希音编辑部' },
    readMins: 6,
    summary: { en: 'Traditional productivity apps demand constant attention from the very people whose attention is already scattered. Invisible tools work the opposite way.', zh: '传统的效率应用不断要求注意力，而恰恰是这些最容易分心的人群在承受着这种要求。隐形工具则以相反的方式工作。' },
    content: [
      { type: 'p', text: { en: 'For most people, opening a focus app is a small act of discipline. For someone with ADHD, it can feel like another demand in an already noisy day — one more notification, one more dashboard, one more place where attention is supposed to land and hold still.', zh: '对大多数人来说，打开一个专注应用不过是一个小小的自律动作。但对 ADHD 患者来说，它可能像是嘈杂一天中又一项新的要求——又一条通知，又一个仪表盘，又一个注意力应该停留并保持静止的地方。' } },
      { type: 'p', text: { en: 'The irony is sharp. The population that most needs help sustaining attention is also the population most easily overwhelmed by tools that require attention to operate. Checkboxes beg to be checked. Streaks beg to be maintained. Timers tick loudly in the corner of the screen, turning the act of concentrating into a performance that must be witnessed.', zh: '讽刺意味很浓。最需要帮助维持注意力的群体，恰恰是最容易被那些需要注意力才能运作的工具所压垮的群体。复选框等着被打勾，连续记录等着被维护，倒计时器在屏幕一角大声滴答作响，把专注这件事变成了一场必须被注视的表演。' } },
      { type: 'h2', text: { en: 'The visibility trap', zh: '可见性的陷阱' } },
      { type: 'p', text: { en: 'Most productivity software is designed around visibility. Progress bars, heatmaps, weekly reports, celebratory animations — these are all signals meant to reward engagement. But for an ADHD brain, engagement and attention are not the same thing. A tool can be deeply engaging (bright, gamified, full of micro-rewards) while actively undermining the sustained, low-arousal attention that real focus requires.', zh: '大多数效率软件都是围绕"可见性"来设计的。进度条、热力图、周报、庆祝动画——这些都是用来奖励参与的信号。但对 ADHD 大脑而言，参与和注意力并非一回事。一个工具可以极具吸引力（明亮、游戏化、充满微奖励），却同时在破坏真正专注所需的、持续而低唤醒的注意力。' } },
      { type: 'p', text: { en: 'The result is a familiar loop: download the app, feel productive for three days, then abandon it when the dopamine of novelty fades. The tool didn\'t fail because it was bad. It failed because it asked the user to perform focus rather than practice it.', zh: '结果是一个熟悉的循环：下载应用，前三天感觉高效，然后在新奇感的多巴胺消退后放弃它。工具的失败不是因为它糟糕，而是因为它要求用户"表演"专注，而不是真正"练习"专注。' } },
      { type: 'img', src: 'assets/blog01.png', caption: { en: 'An invisible tool should disappear the moment focus begins.', zh: '一个隐形的工具，应当在专注开始的那一刻就消失。' } },
      { type: 'h2', text: { en: 'What "invisible" means', zh: '"隐形"的真正含义' } },
      { type: 'p', text: { en: 'An invisible focus tool does three things. First, it reduces the number of decisions before a session begins — ideally to zero. You don\'t choose a timer length, a sound profile, a color theme. You set foot down, face the screen away, and it begins.', zh: '一个隐形的专注工具会做三件事。第一，它把专注开始前需要做的决定数量减到最少——理想情况下是零。你不必选择计时器时长、音效配置、颜色主题。你只需把手机放下来，屏幕朝外，它便开始了。' } },
      { type: 'p', text: { en: 'Second, it removes the running clock from view. Knowing how much time remains is, for many people, a constant low-grade anxiety. Not knowing — trusting the tool to end the session for you — is a kind of permission to actually be present.', zh: '第二，它把正在运行的时钟从视线中移除。对很多人来说，清楚还剩多少时间是一种持续存在的、低强度的焦虑。不知道——相信工具会替你结束这次专注——反而是一种许可，让你真正地活在当下。' } },
      { type: 'p', text: { en: 'Third, it transforms the residue of focus into something you keep, rather than a metric you chase. A painting generated from your session is not a score. You cannot compare it to yesterday\'s painting and feel you did worse. It is simply a record that you were here, and that here-ness lasted some amount of time.', zh: '第三，它把专注的"残留物"转化为你可以保留的东西，而不是追逐的指标。一次专注生成的一幅画不是一个分数。你无法拿它和昨天的画比较，然后觉得自己做得更糟。它只是一条记录：你曾在这里，而这份"在此"持续了一些时间。' } },
      { type: 'h2', text: { en: 'Why the phone-down gesture matters', zh: '为什么"放下手机"这个动作如此重要' } },
      { type: 'p', text: { en: 'The physical act of placing the phone face-down is not incidental. It is the core interaction. For someone with ADHD, the screen itself is often the source of distraction — the ambient pull toward checking, scrolling, verifying. Placing it face-down is a small ritual of refusal: I am choosing, for this interval, not to look.', zh: '把手机屏幕朝下放置这个动作并非偶然，而是核心交互。对 ADHD 患者而言，屏幕本身就是分心的根源——一种朝向"查看、滑动、验证"的环境引力。屏幕朝下，是一种小小的拒绝仪式：我选择在这段时间内，不去看它。' } },
      { type: 'p', text: { en: 'The tool meets that refusal halfway. It doesn\'t punish you for picking the phone back up; it simply notes that the session was interrupted and preserves what was made. The painting may be a fragment rather than a finished curve, but fragments are still evidence of attempt. They are kept, not discarded.', zh: '工具会回应这种拒绝的方式是折中的。它不会因为你把手机拿起来而惩罚你；它只是记录专注被打断，并保留已生成的内容。画面可能是未完成的弧线而非闭合的曲线，但残卷依然是尝试的证据。它们会被保留，而非丢弃。' } },
      { type: 'h2', text: { en: 'A quieter metric', zh: '一个更安静的衡量' } },
      { type: 'p', text: { en: 'The only number that matters, in this model, is not minutes focused or sessions completed. It is whether, over weeks, the collection of small painted curves begins to resemble a practice. Not a streak — a practice. Something you return to not because an app reminds you, but because the act itself has become its own reward.', zh: '在这个模型里，唯一重要的数字不是专注了多少分钟，也不是完成了多少次。而是：经过数周之后，那些小幅曲线是否开始看起来像一种"练习"——不是连续打卡，而是练习。一种你回到它身边，并非因为应用提醒你，而是因为这个行为本身已成为它自己的奖赏。' } },
      { type: 'p', text: { en: 'That is the goal, anyway. We are still learning whether invisible tools can sustain themselves without the engagement mechanics that power most software. But for the people who have tried it, the early signal is consistent: when the tool disappears, the focus doesn\'t.', zh: '无论如何，这是目标。我们仍在学习：没有大多数软件所依赖的那些参与机制时，隐形工具能否自我维持。但对那些已经尝试过的人来说，早期的信号是一致的：当工具消失时，专注并不会消失。' } }
    ]
  },
  {
    id: 'b2',
    title: { en: 'The neuroscience behind binaural beats: What are Alpha waves?', zh: '双耳节拍背后的神经科学：什么是 Alpha 波？' },
    date: '2026.05.14',
    image: 'assets/blog02.png',
    author: { en: 'Healing Research', zh: '希音研究' },
    readMins: 8,
    summary: { en: 'When two slightly different tones enter each ear, the brain perceives a third, phantom rhythm. Whether that rhythm can actually steer your mental state is a more interesting question than it first appears.', zh: '当两个略有差异的音调分别进入左右耳，大脑会感知到第三种、虚幻的节奏。这种节奏是否能真正引导你的心智状态，是一个比它初看起来更有趣的问题。' },
    content: [
      { type: 'p', text: { en: 'If you play a 200 Hz tone in one ear and a 210 Hz tone in the other, you will not hear two separate pitches. You will hear a single tone that seems to pulse, slowly, at 10 times per second. That phantom pulse is the binaural beat — a perception constructed not by your ears but by the auditory cortex, which detects the phase difference between the two incoming signals and renders it as a rhythmic shimmer.', zh: '如果你在一只耳朵里播放 200 Hz 的音调，另一只耳朵里播放 210 Hz 的音调，你听到的不会是两个独立的音高。你听到的是一个单一的音调，它似乎在以每秒 10 次的频率缓慢脉动。那种虚幻的脉动就是双耳节拍——它并非由你的耳朵构建，而是由听觉皮层检测两个输入信号之间的相位差后，将其渲染为一种节奏性的微光。' } },
      { type: 'p', text: { en: 'The claim, popular since the 1970s, is that this phantom rhythm can entrain the brain: that by choosing the right frequency difference, you can coax your brainwaves toward a desired state. To evaluate that claim, it helps to first understand what brainwaves actually are.', zh: '自 1970 年代以来流行的说法是：这种虚幻节奏可以"引导"大脑——通过选择合适的频率差，你可以将脑波引向某种期望的状态。要评估这种说法，首先需要理解脑波究竟是什么。' } },
      { type: 'h2', text: { en: 'Brainwaves, in brief', zh: '脑波，简而言之' } },
      { type: 'p', text: { en: 'Neurons communicate through tiny electrical impulses. When large populations of neurons fire in synchrony, their combined activity produces oscillations that can be measured at the scalp — the wavy lines of an EEG. These oscillations are conventionally grouped into bands, each loosely associated with a different state of consciousness.', zh: '神经元通过微小的电脉冲进行交流。当大量神经元同步放电时，它们的整体活动会产生可以在头皮上测量到的振荡——也就是脑电图上那些波浪线。这些振荡传统上被分成几个波段，每个波段大致对应不同的意识状态。' } },
      { type: 'p', text: { en: 'Delta (0.5–4 Hz) dominates during deep, dreamless sleep. Theta (4–8 Hz) appears in drowsiness, light sleep, and some forms of meditation. Alpha (8–13 Hz) is the signature of a relaxed, awake brain with eyes closed — the idle hum of a cortex at rest. Beta (13–30 Hz) accompanies active, engaged thinking. Gamma (30 Hz and above) is implicated in higher-order cognition and perception.', zh: 'Delta（0.5–4 Hz）主导深度无梦的睡眠。Theta（4–8 Hz）出现在困倦、浅睡以及某些形式的冥想中。Alpha（8–13 Hz）是闭眼状态下放松而清醒的大脑的特征——皮层静息时的嗡鸣。Beta（13–30 Hz）伴随积极、投入的思考。Gamma（30 Hz 以上）则与更高级的认知与知觉相关。' } },
      { type: 'p', text: { en: 'The bands are descriptive, not prescriptive. A brain in alpha is not "better" or "worse" than a brain in beta; it is simply doing different work. But the associations are stable enough that researchers have long wondered whether you can nudge the brain from one band to another by presenting an external rhythm at the target frequency.', zh: '这些波段是描述性的，而非规定性的。处于 Alpha 状态的大脑并不比处于 Beta 状态的大脑"更好"或"更差"；它只是做着不同的工作。但这些关联足够稳定，研究者们长期好奇：通过在目标频率呈现外部节奏，是否能将大脑从一个波段推向另一个。' } },
      { type: 'img', src: 'assets/blog02.png', caption: { en: 'The five major brainwave bands, from slow Delta to fast Gamma.', zh: '五大主要脑波波段：从慢速 Delta 到快速 Gamma。' } },
      { type: 'h2', text: { en: 'What Alpha actually feels like', zh: 'Alpha 真正的感觉' } },
      { type: 'p', text: { en: 'Alpha is the band most people are implicitly reaching for when they reach for a focus tool. It is the rhythm of a mind that is awake but not straining — the state of sitting on a porch in early evening, or of reading a book whose words arrive without effort. It is not the state of cramming for an exam, nor the state of drifting off. It is the quiet, receptive middle.', zh: 'Alpha 是大多数人在拿起专注工具时所隐式寻求的波段。它是一种清醒但不紧绷的心智节奏——黄昏时分坐在门廊上，或读一本无需费力就能理解的书时的状态。它既不是临考前死记硬背的状态，也不是渐渐睡去的状态，而是安静的、接纳性的中间地带。' } },
      { type: 'p', text: { en: 'Studies on alpha-band binaural beats are mixed but not empty. Some report modest improvements in sustained attention and reductions in self-reported anxiety; others find no statistically significant effect beyond a placebo. The honest summary is that binaural beats are not a switch you flip. They are, at best, a gentle current — something that may make it slightly easier to drift into a state you were already inclined toward.', zh: '关于 Alpha 频段双耳节拍的研究结果参差不齐，但并非全然无效。一些报告显示在持续注意力和自评焦虑方面有适度改善；另一些则发现除了安慰剂效应外，没有统计学上的显著效果。诚实的总结是：双耳节拍不是一个你可以"啪"地一下打开的开关。它们至多是一股温和的暗流——让你稍微更容易地滑入一种你本来就倾向于进入的状态。' } },
      { type: 'h2', text: { en: 'Why the carrier frequency matters', zh: '为什么载波频率很重要' } },
      { type: 'p', text: { en: 'A subtle point often missed: the perceived beat (say, 10 Hz) is not the only variable. The carrier — the average of the two tones, around 205 Hz in our example — also matters, because the auditory system responds differently to different registers. A 10 Hz beat carried at 200 Hz feels different from a 10 Hz beat carried at 440 Hz, even though the entrainment target is identical.', zh: '一个常被忽略的细节：被感知的节拍（比如 10 Hz）并非唯一的变量。载波——两个音调的平均值，在我们例子中约为 205 Hz——同样重要，因为听觉系统对不同的音域反应不同。一个 10 Hz 的节拍以 200 Hz 为载波，与以 440 Hz 为载波，听起来是不同的，即便引导目标是相同的。' } },
      { type: 'p', text: { en: 'This is why, in practice, a well-designed binaural preset does not just pick a band. It picks a carrier that is pleasant to listen to for long stretches, and a beat frequency that matches the kind of attention you want to hold. Alpha for reading. Theta for drifting. Beta for the rare moments when you genuinely need to push.', zh: '这就是为什么实际上，一个精心设计的双耳节拍预设并不只是选择一个波段。它会选择一个适合长时间聆听的载波，以及一个与你想要维持的注意力类型相匹配的节拍频率。阅读时用 Alpha，发散时用 Theta，需要真正发力时用 Beta。' } },
      { type: 'h2', text: { en: 'A tool, not a treatment', zh: '它是一种工具，而非治疗手段' } },
      { type: 'p', text: { en: 'It is worth saying plainly: binaural beats are not a treatment for ADHD, anxiety, insomnia, or any clinical condition. If you find them helpful, that is a good reason to use them. If you find them do nothing, that is also a normal and expected outcome. The mechanism is subtle enough that individual variation is large, and the effect sizes in the literature are modest.', zh: '有必要直说：双耳节拍并不是 ADHD、焦虑、失眠或任何临床症状的治疗方法。如果你觉得它有帮助，那就是使用它的好理由。如果你觉得它毫无效果，那也是正常且可预期的结果。它的机制很微妙，个体差异很大，文献中的效应量也较小。' } },
      { type: 'p', text: { en: 'What binaural beats offer, used honestly, is a low-cost way to shape the sonic environment of a focus session. Combined with music and ambient noise, they can tilt the overall texture of a soundscape toward calm or toward alertness. The painting your session produces will not care which band you chose. But you may notice, over time, that certain bands consistently precede sessions that feel easier — and that is a useful thing to learn about your own brain.', zh: '坦诚地说，双耳节拍提供的是一种低成本的方式，去塑造专注时的声音环境。与音乐和环境音结合，它们可以将声音音的整体倾向——向平静或向警觉——微微倾斜。一次专注所生成的画不会在意你选了哪个波段。但随着时间推移，你可能会注意到某些波段总是与"更容易"的专注相伴——而这正是了解自己大脑的一件有用之事。' } }
    ]
  },
  {
    id: 'b3',
    title: { en: 'Turning focus into a painting: The resonance between parametric equations and music', zh: '把专注变成画：参数方程与音乐的共振' },
    date: '2026.05.06',
    image: 'assets/blog03.png',
    author: { en: 'Healing Studio', zh: '希音工作室' },
    readMins: 7,
    summary: { en: 'Every curve in your gallery is the trace of a session. Behind that trace is a family of equations that, like music, find beauty in the interplay of simple rhythms.', zh: '你画廊中的每一条曲线，都是一次专注的痕迹。在这些痕迹背后，是一组方程家族——它们和音乐一样，从简单节奏的相互作用中找到了美感。' },
    content: [
      { type: 'p', text: { en: 'When a focus session ends and the painting appears, the first instinct is to read it as a picture — a shape to be liked or not liked, saved or discarded. But every curve in the gallery is also a record. It is the path traced by a point moving according to a small set of rules, over the minutes you held your attention. To understand the rules is to see the paintings differently.', zh: '当一次专注结束、画面出现时，第一反应往往是把它当作一幅画——喜欢或不喜欢，保存或丢弃。但画廊中的每一条曲线，同时也是一份记录。它是一个点按照一组简单规则运动所走过的路径——运动持续了你维持注意力的那几分钟。理解规则，会让你重新看待这些画。' } },
      { type: 'h2', text: { en: 'The simplest resonance: Lissajous', zh: '最简单的共振：李萨如' } },
      { type: 'p', text: { en: 'The most fundamental curve in the system is the Lissajous figure. It arises when a point moves simultaneously in two directions — horizontally and vertically — each at its own steady frequency. If the two frequencies are simple ratios (2:3, 3:4), the point eventually closes its path into a clean, looping knot. If the ratio is irrational, the path never closes; it fills the available space slowly, like thread winding onto a spool.', zh: '系统中最基础的曲线是李萨如图形。它产生于一个点同时在两个方向——水平与垂直——上运动，每个方向都有自己的稳定频率。如果两个频率的比是简单的（2:3、3:4），该点最终会闭合出一条干净、循环的纽结。如果比是无理的，路径永远不会闭合，而是缓慢地填满整个空间，像线缠绕在线轴上。' } },
      { type: 'p', text: { en: 'This is, almost exactly, what happens in music. A chord is two or more frequencies sounding at once. When their ratios are simple, the chord feels stable, resolved. When the ratios are complex, the chord feels restless, dense. The Lissajous curve is the visual analogue of that same principle: simple ratios make closed forms, complex ratios make open ones.', zh: '这几乎就是音乐中发生的事。一个和弦是两个或更多频率同时发声。当它们的比是简单的，和弦听起来稳定、舒展。当比是复杂的，和弦听起来躁动、密集。李萨如曲线正是同一原理的视觉对应：简单比生成闭合图形，复杂比生成开放图形。' } },
      { type: 'img', src: 'assets/blog03.png', caption: { en: 'A Lissajous figure with a 3:4 frequency ratio — the visual equivalent of a perfect fourth.', zh: '3:4 频率比的李萨如图——纯四度的视觉对应。' } },
      { type: 'h2', text: { en: 'Roses and gears', zh: '玫瑰与齿轮' } },
      { type: 'p', text: { en: 'Beyond Lissajous, the system draws from a small bestiary of classical curves. The Rhodonea, or rose curve, is traced by a point whose distance from the center oscillates as it rotates — producing petals whose count depends on whether the frequency ratio is odd or even. A 3-petal rose and a 4-petal rose feel as different from each other as a major triad feels from a minor one.', zh: '除李萨如之外，系统还取材于一小组经典曲线。罗迪尼娅（玫瑰曲线）由一个点描绘——该点到中心的距离随旋转而振荡——生成的花瓣数量取决于频率比是奇还是偶。一朵三瓣玫瑰和一朵四瓣玫瑰彼此的差异，正如大三和弦与小六和弦在听觉上的差异。' } },
      { type: 'p', text: { en: 'The Hypotrochoid and Epicycloid are older still — they describe the path of a point on a small circle rolling around the inside or outside of a larger one. These are the curves produced by a Spirograph, the children\'s toy, and they were studied seriously by mathematicians long before they were toys. Their beauty is the beauty of compounded rotation: two circular motions, nested, generating forms of surprising intricacy from astonishingly simple ingredients.', zh: '内旋轮线（Hypotrochoid）和外旋轮线（Epicycloid）更为古老——它们描述的是一个小圆在大圆内或外滚动时，其上某一点走过的轨迹。这些正是"万花尺"——儿童玩具——所产生的曲线，它们早在成为玩具之前，就被数学家们认真地研究过。它们的美，是复合旋转的美：两个圆周运动嵌套，以惊人简单的成分，生成出惊人复杂的形态。' } },
      { type: 'h2', text: { en: 'Why the session length shapes the painting', zh: '专注时长如何塑造画面' } },
      { type: 'p', text: { en: 'A subtle feature of the system: the same curve, drawn over a longer session, looks different from the same curve drawn over a shorter one. This is not because the equation changes. It is because the point is given more time to travel. A Lissajous figure with a 3:4 ratio closes after a fixed number of cycles; if your session is long enough to complete several cycles, the line simply retraces itself, deepening in density. If your session ends early, the curve is incomplete — an open arc rather than a closed knot.', zh: '系统有一个微妙的特性：同一条曲线，在更长的专注中绘制，与在更短的专注中绘制，看起来不同。这不是因为方程变了，而是因为点获得了更多的时间去运动。一个 3:4 比的李萨如图形会在固定的循环次数后闭合；如果你的专注长到能完成多个循环，这条线只是反复描绘自身，密度加深。如果你的专注提前结束，曲线就未完成——是一条开放的弧，而非闭合的纽结。' } },
      { type: 'p', text: { en: 'This is why fragments and complete paintings feel so different, even when they share the same underlying equation. A fragment is a curve interrupted mid-sentence. A complete painting is a curve that has said what it had to say, possibly more than once. Neither is more valid. But they carry different kinds of evidence about the session that produced them.', zh: '这就是为什么残卷与完成品给人的感受如此不同——即便它们共享同一个底层方程。残卷是一条被中途打断的曲线。完成品是一条已说出想说的话的曲线——可能还不止一次。两者并无优劣之分，但它们承载着关于那次专注的不同证据。' } },
      { type: 'h2', text: { en: 'The decay of attention', zh: '注意力的衰减' } },
      { type: 'p', text: { en: 'Some curves in the system — the Harmonograph, most notably — include a decay term. The point\'s amplitude slowly diminishes over time, so the spiral tightens inward, like a spring settling. This is not a literal model of attention, but it is a resonant one. Attention does not hold steady; it breathes. It strengthens, wanders, returns. A curve with decay gives that breathing a visible shape — an outward wandering that gradually gathers itself toward center.', zh: '系统中的一些曲线——最显著的是谐振图（Harmonograph）——包含一个衰减项。点的振幅随时间缓慢减弱，于是螺旋向内收紧，像一根弹簧在稳定下来。这并非注意力的字面模型，但它是共鸣的。注意力不会保持恒定；它会呼吸。它会增强、漫游、回归。带衰减的曲线给了这种"呼吸"一个可见的形状——一段向外的徘徊，最终缓缓聚拢向中心。' } },
      { type: 'p', text: { en: 'When you look across a gallery of paintings made over many sessions, what you are seeing is not just a collection of shapes. You are seeing a family of mathematical gestures, each one tuned by the length and texture of a single act of attention. The equations are old. The practice of holding attention is old. The paintings are simply where the two meet.', zh: '当你浏览画廊里跨多次专注所生成的画作时，你看到的不是一组形状的简单集合。你看到的是一个数学姿态的家族，每一个都因某次专注行为的长度与质地而被调校。方程是古老的。维持专注的练习是古老的。这些画，仅仅是这两者相遇的地方。' } }
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
    { id: 'white', name: { en: 'White Noise', zh: '白噪音' }, desc: { en: 'Balanced masking, suitable for general environments', zh: '均衡掩蔽，适合一般环境' }, src: { synth: 'noise', type: 'white' } },
    { id: 'pink', name: { en: 'Pink Noise', zh: '粉噪音' }, desc: { en: 'Soft and balanced, suitable for long listening', zh: '柔和均衡，适合长时间聆听' }, src: { synth: 'noise', type: 'pink' } },
    { id: 'brown', name: { en: 'Brown Noise', zh: '棕噪音' }, desc: { en: 'Deep like a heavy current, strong masking effect', zh: '深邃如暗流，掩蔽效果强' }, src: { synth: 'noise', type: 'brown' } }
  ],
  ambient: [
    { id: 'rain', name: { en: 'Rain', zh: '细雨' }, src: 'sound/ambient/light-rain.mp3' },
    { id: 'heavy-rain', name: { en: 'Heavy Rain', zh: '大雨' }, src: 'sound/ambient/heavy-rain.mp3' },
    { id: 'waves', name: { en: 'Ocean Waves', zh: '海浪' }, src: 'sound/ambient/waves.mp3' },
    { id: 'wind', name: { en: 'Wind', zh: '微风' }, src: 'sound/ambient/wind.mp3' },
    { id: 'howling-wind', name: { en: 'Howling Wind', zh: '呼啸的风' }, src: 'sound/ambient/howling-wind.mp3' },
    { id: 'wind-trees', name: { en: 'Wind in Trees', zh: '林间风声' }, src: 'sound/ambient/wind-in-trees.mp3' },
    { id: 'forest', name: { en: 'Forest', zh: '森林' }, src: 'sound/ambient/jungle.mp3' },
    { id: 'stream', name: { en: 'Stream', zh: '溪流' }, src: 'sound/ambient/river.mp3' },
    { id: 'waterfall', name: { en: 'Waterfall', zh: '瀑布' }, src: 'sound/ambient/waterfall.mp3' },
    { id: 'fire', name: { en: 'Campfire', zh: '篝火' }, src: 'sound/ambient/campfire.mp3' },
    { id: 'droplets', name: { en: 'Droplets', zh: '水滴' }, src: 'sound/ambient/droplets.mp3' }
  ]
}

export const atmosOptions = [
  { id: 'birds', name: { en: 'Birds', zh: '鸟鸣' }, src: 'sound/ambient/birds.mp3' },
  { id: 'pages', name: { en: 'Page Turning', zh: '翻书声' }, src: 'sound/ambient/pages.mp3' },
  { id: 'keys', name: { en: 'Keyboard', zh: '键盘声' }, src: 'sound/ambient/keys.mp3' },
  { id: 'write', name: { en: 'Writing', zh: '书写声' }, src: 'sound/ambient/write.mp3' },
  { id: 'cicada', name: { en: 'Cicada', zh: '蝉鸣' }, src: 'sound/ambient/cicida.mp3' },
  { id: 'crickets', name: { en: 'Crickets', zh: '蟋蟀' }, src: 'sound/ambient/crickets.mp3' },
  { id: 'steps-snow', name: { en: 'Steps on Snow', zh: '踏雪声' }, src: 'sound/ambient/walk-in-snow.mp3' },
  { id: 'steps-gravel', name: { en: 'Steps on Gravel', zh: '踏碎石声' }, src: 'sound/ambient/walk-on-gravel.mp3' },
  { id: 'steps-leaves', name: { en: 'Steps on Leaves', zh: '踏落叶声' }, src: 'sound/ambient/walk-on-leaves.mp3' },
  { id: 'chime', name: { en: 'Wind Chime', zh: '风铃' }, src: 'sound/ambient/chime.mp3' },
  { id: 'cat', name: { en: 'Cat', zh: '猫咪' }, src: 'sound/ambient/cat.mp3' },
  { id: 'coffee', name: { en: 'Coffee Grinding', zh: '咖啡研磨' }, src: 'sound/ambient/coffee.mp3' }
]

/**
 * 双耳节拍: baseHz 是载体基准频率, beatHz 是左右耳频率差（即脑波目标频率）
 * 取每类脑波范围的中间值
 */
export const binauralOptions = [
  { id: 'delta', name: { en: 'Delta', zh: 'Delta' }, range: '0.5–4 Hz', desc: { en: 'Deep slow waves, suitable for deep relaxation and meditation', zh: '深沉的慢波，适合深度放松与冥想' }, src: { synth: 'binaural', baseFreq: 150, beatHz: 2 } },
  { id: 'theta', name: { en: 'Theta', zh: 'Theta' }, range: '4–8 Hz', desc: { en: 'Dreamlike boundary, suitable for meditation and creative divergence', zh: '如梦的边界，适合冥想与创意思维发散' }, src: { synth: 'binaural', baseFreq: 180, beatHz: 6 } },
  { id: 'alpha', name: { en: 'Alpha', zh: 'Alpha' }, range: '8–13 Hz', desc: { en: 'Awake and relaxed, suitable for light focus and reading', zh: '清醒而放松，适合轻度专注与阅读' }, src: { synth: 'binaural', baseFreq: 200, beatHz: 10 } },
  { id: 'beta', name: { en: 'Beta', zh: 'Beta' }, range: '13–30 Hz', desc: { en: 'Active thinking, suitable for active thinking and efficient learning', zh: '活跃思考，适合积极思维与高效学习' }, src: { synth: 'binaural', baseFreq: 250, beatHz: 18 } }
]

export const curveTypes = {
  en: [
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
  ],
  zh: [
    '李萨如曲线',
    '玫瑰曲线',
    '内旋轮线',
    '对数螺线',
    '蝴蝶曲线',
    '外旋轮线',
    '谐振图',
    '万花尺曲线',
    '玫瑰花结',
    '费马螺线'
  ]
}

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
  const list = curveTypes.en
  return list[Math.floor(Math.random() * list.length)]
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
