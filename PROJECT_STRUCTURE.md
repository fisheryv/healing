# MTX_healing 项目结构说明

> **项目代号**：希音 Healing
> **项目定位**：面向 ADHD 群体及高压力脑力工作者的"隐形"专注工具 H5 Demo
> **技术栈**：React 18 + Vite + React Router (Hash) + Three.js + Web Audio API
> **设计风格**：极简黑白、衬线字体（Cormorant Garamond / Noto Serif SC）

本文档梳理仓库内每个文件与文件夹的作用，便于上手与维护。

---

## 目录总览

```
MTX_healing/
├── README.md                              # 项目主说明（PRD 摘要 + 启动方式）
├── LICENSE                                # MIT 协议
├── .gitignore                             # 根级 git 忽略
├── .claude/
│   └── settings.local.json                # Claude Code 本地权限设置
├── .idea/                                 # JetBrains IDE 工程配置（不参与构建）
├── docs/
│   ├── 希音_Healing_App-产品需求文档.md    # 完整 PRD
│   ├── 希音_Healing_App-原始需求.md        # 早期原始需求
│   └── audio-files-guide.md               # 音频资源命名与补充指南
└── src/                                   # 可交互 H5 Demo（核心）
    ├── README.md                          # Demo 使用说明
    ├── index.html                         # 入口 HTML（含字体预加载）
    ├── package.json                       # 依赖与脚本
    ├── pnpm-workspace.yaml                # pnpm 允许构建 esbuild 的配置
    ├── vite.config.js                     # Vite 开发服务器配置
    ├── public/
    │   ├── assets/                        # 图片素材（封面、Logo、Onboarding）
    │   ├── sound/
    │   │   ├── music/                     # 10 首主音乐（m1.mp3 ~ m10.mp3）
    │   │   └── ambient/                   # 20 个氛围音 / 白噪音素材
    │   └── scripts/
    │       └── analyze_keys.py            # librosa + Krumhansl-Schmuckler 调性分析脚本
    └── src/                               # 应用源代码（注意嵌套两层 src）
        ├── main.jsx                       # 入口渲染 + HashRouter
        ├── App.jsx                        # 路由表与外壳布局
        ├── store.jsx                      # 全局状态 (React Context) + 模拟鉴权
        ├── data.js                        # 静态演示数据（音乐/博客/摘录/曲线/选项）
        ├── i18n.js                        # 中 / 英双语翻译表
        ├── audioEngine.js                 # Web Audio 多轨混音引擎
        ├── suminagashi.js                 # GPU 水墨流体模拟引擎（基于 Three.js）
        ├── useScreenDown.js               # 屏幕朝下 / 防分心 Hook
        ├── styles.css                     # 全局极简黑白样式
        ├── components/
        │   └── BottomNav.jsx              # 底部 5 项导航栏
        └── pages/                         # 页面级组件（17 个）
```

---

## 顶层文件 / 目录

| 路径 | 作用 |
| --- | --- |
| `README.md` | 项目门面，介绍产品理念、模块、专注画作生成逻辑、防分心机制、完成奖励、设计语言与技术栈，并附目录结构与启动命令。 |
| `LICENSE` | MIT 协议（Copyright Fisher, 2026）。 |
| `.gitignore` | 忽略 macOS `.DS_Store`、JetBrains `.idea/`、`.claude/` 等本地环境产物。 |
| `.claude/settings.local.json` | Claude Code 本地权限白名单（git 克隆、`gh` 命令等）。仅本机生效，不参与构建。 |
| `.idea/` | JetBrains IDE（WebStorm/IntelliJ）自动生成的工程元数据，不纳入版本控制。 |
| `docs/` | 产品文档与音频资源规范。 |
| `src/` | Demo 工程目录（真正的代码与资源都在这里）。 |

---

## docs/ — 产品文档

| 文件 | 作用 |
| --- | --- |
| `希音_Healing_App-产品需求文档.md` | **核心 PRD**，覆盖：产品定位（"大音希声"）、目标用户（ADHD）、核心功能矩阵、专注画作生成逻辑（5 类参数方程）、防分心机制、完成奖励与残卷规则、设计语言、技术栈。 |
| `希音_Healing_App-原始需求.md` | 项目立项初期的原始需求草稿，保留作为溯源参考。 |
| `audio-files-guide.md` | `public/sound/` 下所有音频的清单与命名约束。说明 10 首主音乐与 20 个氛围音的文件名映射，并指出白/粉/褐噪音与双耳节拍由 `audioEngine.js` 用 Web Audio API 实时合成，无需任何文件。 |

---

## src/ — Demo 工程根目录

> ⚠️ 仓库有两层 `src/`：外层 `src/` 是 Vite 工程目录，内层 `src/src/` 才是应用源代码。本节按"工程配置 / 资源 / 应用代码"三类组织。

### 工程配置

| 文件 | 作用 |
| --- | --- |
| `src/README.md` | Demo 专属使用说明：技术栈、启动方式、6 条演示要点、目录结构（与本仓库不完全一致，落后于现状）。 |
| `src/index.html` | HTML 入口：声明中文 `<html lang="zh-CN">`、禁用缩放、预加载 Google Fonts（Cormorant Garamond + Noto Serif SC），挂载 `<div id="root">` 并加载 `src/main.jsx`。 |
| `src/package.json` | 包元信息：`name: healing-demo`、`type: module`；脚本 `dev / build / preview`；依赖 `react 18`、`react-router-dom 6`、`lucide-react 1.16`、`three 0.169`、`playwright 1.62`；开发依赖 `@vitejs/plugin-react`、`vite`。 |
| `src/pnpm-workspace.yaml` | pnpm 工作区配置（`allowBuilds: esbuild: true`），授权 pnpm 构建 esbuild。 |
| `src/vite.config.js` | Vite 配置：注册 React 插件；开发服务器 `host: true`（局域网可访问）、`port: 5173`。 |
| `src/.gitignore` | 忽略 `node_modules / dist / .vite / *.log / package-lock.json / pnpm-lock.yaml`。 |

### 公共资源 (`src/public/`)

| 路径 | 作用 |
| --- | --- |
| `public/assets/` | 图片素材。包含：`logo.png / logo-white.png / logo2.png` 三套 Logo；`cover00~04` 推荐位封面；`album01~10` 曲库封面；`onboarding01~03` 引导页插图；`focus-01~03` 专注插图；`signin.png` 登录插图；`avatar.png` 默认头像；`empt.png` 空状态图；`blog01~03` 博客头图；`airpod.png` 耳机推荐图。 |
| `public/sound/music/m1~m10.mp3` | 10 首主音乐，对应 `data.js/officialMusic` 中的 `id/key/mode`。曲目元信息见 `docs/audio-files-guide.md`。 |
| `public/sound/ambient/*.mp3` | 20 个氛围 / 噪音素材：雨声、暴雨、海浪、风、林间风、溪流、瀑布、篝火、鸟鸣、翻书、键盘、写字、蝉鸣、蟋蟀、踏雪、踏石、踏叶、风铃、猫、咖啡研磨等。 |
| `public/scripts/analyze_keys.py` | 离线脚本：使用 `librosa` + Krumhansl-Schmuckler 算法分析音频调性，输出结果回填到 `data.js` 的 `key/mode` 字段。注释中提示 m7/m8 置信度较低，需人工复核。 |

### 应用代码 (`src/src/`)

#### 入口与全局

| 文件 | 作用 |
| --- | --- |
| `src/src/main.jsx` | React 根：`ReactDOM.createRoot` 挂载到 `#root`；外层包 `<HashRouter>`；同时把 `data.js` 暴露为 `window.__HEALING_DATA__`，供 `store.jsx` 迁移旧数据时反查双语字段。 |
| `src/src/App.jsx` | 路由与外壳。`<AppProvider>` 包裹 `<Shell>`；`<Shell>` 根据路径决定是否显示底部导航与全屏布局，并注册全部 17 条路由（见下方"路由表"）。`TABS` / `FULLSCREEN` / `PROTECTED` 三个常量分别定义"底部 Tab 路径 / 全屏路径 / 需要登录的路径"；后者由内部组件 `<RequireAuth>` 守卫——未登录访问受保护路径会自动跳 `/login` 并记下 `from` 来源。 |
| `src/src/store.jsx` | 全局状态容器（React Context）。**职责**：(1) 用 localStorage 持久化用户、引导标记、收藏、混音预设、画作、设置；(2) `auth` 模块模拟登录 / 注册 / 重置密码（哈希校验 + 5 次失败锁定 30 分钟 + 安全问题找回 + 手机号或邮箱登录）；(3) `codes` 模块管理 10 分钟过期的验证码；(4) `bindings` 模块模拟第三方账号绑定；(5) 暴露 `favorites / presets / artworks / settings / lang` 等 state 与对应的 setter；(6) 导出 `validateEmail` / `validatePhone` / `validatePassword`（8–20 位 + 字母数字）三个校验器与"按 id 反查双语"的数据迁移逻辑；(7) 输出 `useApp()` Hook 给所有页面调用 `t()`。 |
| `src/src/data.js` | 静态演示数据。包含：5 个推荐（`recommendations`）、10 首官方音乐（`officialMusic`，含 `key/mode`）、3 篇双语长文（`blogs`）、8 句中英文学摘录（`quotes`）、3 类噪音选项（`noiseOptions.pure/ambient`）、12 种点缀音（`atmosOptions`）、4 种双耳节拍（`binauralOptions`）、10 种曲线名（`curveTypes`），以及工具函数：`buildSrcMap()`、`findMusicById()`、`pickQuote()`、`pickCurve()`、`noteToFreq()`、`getCarrierFreqFromKey()`。 |
| `src/src/i18n.js` | 中英双语翻译表（点分路径 → `{zh, en}` 对象）。`translate(lang, key, params)` 支持 `{name}` 插值，缺失键会打印警告并回退到 key。语言键默认 `en`。**已覆盖模块**：`nav / common / onboarding / login / signup / forgot / home / library / gallery / focusConfig / profile / settings / about / blog / artwork / mixer / focusSession / player / nicknameSetup`。 |
| `src/src/styles.css` | 全局 CSS。`:root` 定义 CSS 变量（背景、文字、线条、强调色与画布黑底），实现极简黑白配色 + 衬线排版 + 移动端友好的响应式样式。 |
| `src/src/audioEngine.js` | **Web Audio 多轨混音引擎**。单例管理 `AudioContext / masterGain / analyser`；支持三类轨：(1) 文件轨（主音乐 / 氛围 mp3 循环）；(2) 实时合成白/粉/褐噪音（`createNoiseBuffer`）；(3) 实时合成双耳节拍（左右耳两个 OscillatorNode 频率差 = 目标节拍，载波中心可对齐主音调性）。每轨独立 `GainNode`。暴露：`loadMix(mix, srcMap)`、`setTrackVolume()`、`fadeOut()`、`playChime()` 完成提示音、`startAnalysis/stopAnalysis/getAnalysisData`（返回 `{amplitude, centroid, flux}` 用于驱动笔触）、`previewTrack/stopPreview` 用于调音台试听、`resumeContext` 唤醒 autoplay。 |
| `src/src/suminagashi.js` | **GPU 水墨流体模拟引擎**（基于 Three.js + 自定义 GLSL ShaderMaterial）。维护速度场 + 染料场 + 压力场（半浮点 RenderTarget 双缓冲），实现 advect / vorticity confinement / pressure projection / divergence 等步骤；显示阶段模拟和纸纤维噪声 + 暗角。暴露 `Suminagashi` 类与 4 种墨色常量（`sumi / ai / shu / matsuba`）。是 `FocusSession` 中"墨韵"画作的核心渲染器。 |
| `src/src/useScreenDown.js` | **屏幕朝下检测 Hook**。订阅 `devicemotion.accelerationIncludingGravity.z`（阈值 `> 8 m/s²`）+ `visibilitychange`；连续 2 帧去抖；同时导出 `requestMotionPermission()` 供 `FocusConfig` 在用户手势内提前申请 iOS 权限。无传感器或权限被拒时降级为"始终朝下"（不触发防分心）。 |

#### 通用组件

| 文件 | 作用 |
| --- | --- |
| `src/src/components/BottomNav.jsx` | 底部 5 项 Tab：Home / Library / Mixer / Gallery / Profile。使用 `lucide-react` 的 House / ListMusic / Music / Component / User 图标，通过 `NavLink` 高亮当前项，标签文本走 `t('nav.*')`。 |

#### 页面 (`src/src/pages/`)

| 文件 | 路由 | 作用 |
| --- | --- | --- |
| `Onboarding.jsx` | `/onboarding` | 3 页横滑引导（支持触摸手势），展示品牌叙事。完成后写入 `onboardingSeen=true` 并跳转 `/login`。 |
| `Login.jsx` | `/login` | 邮箱 / 手机号双 Tab + 密码登录，校验邮箱或手机号格式与密码强度，支持"记住我"与第三方登录入口（Google / Apple ID / 微信，Demo 中提示即将开放）。失败 5 次会锁定 30 分钟。 |
| `SignUp.jsx` | `/register` | 邮箱 / 手机号双 Tab + 6 位验证码（Demo 中写到本地存储，10 分钟过期）+ 昵称 + 密码 + 安全问题与答案注册；带 60s 倒计时按钮。注册成功后跳 `/nickname-setup`。 |
| `NicknameSetup.jsx` | `/nickname-setup` | 注册后首次登录引导：设置昵称（≤20 字）+ 可选头像（本地 `FileReader` 预览为 dataURL）。支持"跳过"，跳过时使用默认昵称"用户 + 账号后 4 位"。完成后写入 `user` 并跳 `/home`。 |
| `ForgotPassword.jsx` | `/forgot` | 邮箱 / 手机号 + 验证码 + 安全问题答案 + 新密码重置流程；成功后展示绿色成功页并自动登录。 |
| `Home.jsx` | `/home` | 首页：欢迎语 + 大尺寸"开始"入口（跳 `/focus/config`）+ 调音空间入口（跳 `/mixer`）+ 推荐位 + 我的收藏 + Blog 预览。 |
| `Library.jsx` | `/library` | 曲库：3 个 Tab（官方 / 我的混音 / 收藏），支持按名称 / 标签搜索；我的混音 Tab 可长按删除预设。 |
| `Mixer.jsx` | `/mixer` | 调音台：主音乐 + 背景噪音 + 2 个氛围音 + 双耳节拍共 5 轨独立滑块与试听；支持命名保存为预设、重名检测、覆盖 / 重命名选择；"开始专注"按钮直接跳 `/focus/session`。 |
| `Gallery.jsx` | `/gallery` | 画廊网格：展示所有生成的画作；按"全部 / 已完成 / 未完成"过滤；从 `/focus/session` 跳转来时支持高亮定位新作品 3s。支持长按删除。 |
| `Profile.jsx` | `/profile` | 我的：52×7 GitHub 风格热力图（按 `artworks` 历史聚合）+ 总专注时长 / 次数 / 连续天数 / 最长连续 4 个统计卡 + 专注 / 账号安全 / 关于 3 组设置入口 + 语言切换 + 退出登录。 |
| `FocusConfig.jsx` | `/focus/config` | 专注配置：时长选择器（10~60 分钟滑轮）+ 预设混音选择器；进入前调用 `resumeContext()` 与 `requestMotionPermission()` 预热。 |
| `FocusSession.jsx` | `/focus/session` | **核心页面**：3 秒倒计时 → 全屏 Suminagashi 画布 → 笔刷根据 `getAnalysisData()` 的振幅 / 频率 / 通量实时游走 → 屏幕朝下 / App 切后台时进入"分心"态（线条褪色 + 倒计时 15s 宽限）→ 完成展示文学摘录奖励页 → 保存为完整作品；中途放弃保存为半透明"残卷"。 |
| `Player.jsx` | `/player/:id` | 单曲播放器：进度条、上一首/下一首、音量、播放模式（顺序 / 单曲循环 / 随机）、队列浮层、收藏 / 加入混音。 |
| `ArtworkDetail.jsx` | `/artwork/:id` | 作品详情：大图查看 + 缩放 + 元信息（日期 / 时长 / 曲线类型 / 混音 / 状态）+ 分享（Web Share API）+ 保存到设备。 |
| `BlogList.jsx` | `/blog` | 博客列表，按日期倒序展示 `data.js/blogs`。 |
| `BlogDetail.jsx` | `/blog/:id` | 博客详情，渲染 `content` 数组（`p` / `h2` / `img` 三类块），支持图片与双语段落。 |
| `SettingsPage.jsx` | `/settings/:type` + `AboutPage` → `/about/:type`、`/about` | 复合页面：根据 `type` 切换"修改密码 / 绑定账号 / 注销账号"；`AboutPage` 切换"服务条款 / 隐私政策 / 反馈 / 关于"。 |

---

## 路由表（`App.jsx` 注册）

| 路径 | 渲染 | 底部 Tab | 全屏 |
| --- | --- | --- | --- |
| `/` | 重定向 → `/onboarding` 或 `/login` 或 `/home`（依状态） | — | — |
| `/onboarding` | `Onboarding` | ✗ | ✓ |
| `/login` | `Login` | ✗ | ✓ |
| `/register` | `SignUp` | ✗ | ✓ |
| `/forgot` | `ForgotPassword` | ✗ | ✓ |
| `/nickname-setup` | `NicknameSetup` | ✗ | ✓ |
| `/home` | `Home` | ✓ | ✗ |
| `/library` | `Library` | ✓ | ✗ |
| `/mixer` | `Mixer` | ✓ | ✗ |
| `/gallery` | `Gallery` | ✓ | ✗ |
| `/profile` | `Profile` | ✓ | ✗ |
| `/focus/config` | `FocusConfig` | ✗ | ✓ |
| `/focus/session` | `FocusSession` | ✗ | ✓ |
| `/player/:id` | `Player` | ✗ | ✓ |
| `/artwork/:id` | `ArtworkDetail` | ✗ | ✓ |
| `/blog` | `BlogList` | ✗ | ✓ |
| `/blog/:id` | `BlogDetail` | ✗ | ✓ |
| `/settings/:type` | `SettingsPage` | ✗ | ✓ |
| `/about/:type`, `/about` | `AboutPage` | ✗ | ✓ |
| `*` | 重定向 → `/home` | — | — |

> **登录守卫**：除 `/` `/onboarding` `/login` `/register` `/forgot` `/nickname-setup` 外，其余路径都包在 `<RequireAuth>` 内，未登录访问会被重定向到 `/login` 并通过 `location.state.from` 记住来源。

---

## 数据流与关键约定

- **全局状态入口**：所有页面通过 `useApp()` 获取 `t / lang / user / favorites / presets / artworks / settings / currentMix` 等；写入操作均封装为 setter / 回调（`toggleFavorite / savePreset / addArtwork / deleteArtwork / recordQuote / setLang` 等）。
- **持久化键**：`healing_app_state_v1`（主状态）、`healing_app_accounts_v1`（账户库，含 `recoveryQuestion/Answer`）、`healing_app_remember_v1`（记住账号）、`healing_app_bindings_v1`（第三方绑定）、`healing_app_lang_v1`（语言）、`healing_app_code_v1`（10 分钟过期的验证码）、`healing_app_lock_v1`（登录失败计数与 30 分钟锁定）。换设备或清空 localStorage 等同于重置 Demo。
- **双语字段**：所有静态数据字段（`name / title / desc / tag` 等）都是 `{en, zh}` 对象；通过 `localized(field, lang)` 工具或 `t()` 翻译函数取当前语言，缺省回退 `en`。
- **音频轨约定**：`bgNoise` 与 `atmos_0 / atmos_1` 是噪音 / 氛围轨，需要在 `audioEngine` 中施加 `NOISE_SCALE = 0.25` 缩放，使滑块值与感知响度匹配。
- **双耳节拍载波**：`audioEngine` 会读取主音乐的 `key/mode`，通过 `getCarrierFreqFromKey()` 把载波中心调到 100–300 Hz 频段，使节拍听起来与主音调性吻合。
- **作品生成**：当前 Demo 中 `FocusSession` 使用 **Suminagashi 水墨流体** 渲染（`suminagashi.js` + Three.js），而 PRD 中描述的"参数方程 + 音频微扰"逻辑作为概念蓝图保留；`data.js/curveTypes` 仍提供 10 种曲线名供 `pickCurve()` 与 `ArtworkDetail` 展示使用。

---

## 启动

```bash
cd src
npm install   # 或 pnpm install
npm run dev   # 启动 Vite，默认 http://localhost:5173/
```

建议在浏览器 DevTools 中切换到移动端视图（375×812）以获得最佳观感。

---

## 后续扩展建议

1. **真实音频分析驱动笔触**：当前 `FocusSession` 已读取 `getAnalysisData()`，但笔刷参数可进一步与 `amplitude / flux` 联动（已在 PRD 中规划）。
2. **将账户库替换为真实后端**：`store.jsx/auth` 是 localStorage 模拟，迁移到后端只需替换 `auth` 的 4 个方法。
3. **完善设置页与关于页**：`SettingsPage.jsx` 内联了多种 type，可拆为独立子组件，便于按权限增量开发。
4. **可访问性**：当前 `BottomNav` / 表单错误提示主要靠颜色与图标，可补 `aria-*` 与键盘焦点环。