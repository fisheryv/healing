# 希音 Healing — 架构说明（大白话版）

## 一句话概括

这是一个手机网页应用，用户登录后可以设置专注音乐、放下手机专注，结束后看到一幅水墨画。数据存在云端（其实是你的电脑），换手机登录也能看到之前的记录。

---

## 三个部分

整个应用分三层，就像一家餐厅：

### 1. 前端 = 餐厅大堂（用户看到的）

- **是什么**：一堆网页文件（HTML + JS + CSS），跑在浏览器里
- **技术**：React（写界面的框架）+ Vite（打包工具）+ Three.js（画水墨画的引擎）+ Web Audio API（播放音乐）
- **用户感知**：打开网址看到的引导页、登录页、首页、调音台、专注画布、画廊，全是前端
- **代码在哪**：`src/src/` 目录下，17 个页面组件

### 2. 后端 = 餐厅厨房（处理数据）

- **是什么**：一个叫 PocketBase 的程序，跑在你的电脑上，负责存数据、管账号
- **技术**：PocketBase（Go 语言写的单文件程序，自带数据库 + API + 管理后台）
- **用户感知**：登录验证、保存预设、收藏音乐、上传画作——这些操作背后都是后端在处理
- **代码在哪**：`backend/` 目录下，PocketBase 二进制 + 数据库迁移脚本

### 3. 数据库 = 仓库（存东西的）

- **是什么**：一个 SQLite 文件（`pb_data/data.db`），跟 Excel 表差不多
- **技术**：SQLite（单文件数据库，不用单独安装服务）
- **里面有什么**：四张表
  - `users`：用户账号（邮箱、密码哈希、昵称、头像、安全问题）
  - `artworks`：专注画作（截图 PNG、时长、状态、文学摘录）
  - `presets`：调音台保存的混音方案（音乐 + 噪音 + 双耳节拍的组合）
  - `favorites`：收藏的音乐（用户 + 音乐 ID）

---

## 数据怎么流转

以"完成一次专注并保存画作"为例：

```
用户点"保存"
    ↓
前端（浏览器）把画作截图 + 数据打包
    ↓
通过 HTTP 请求发给后端
    ↓
后端（PocketBase）收到请求
    ↓
检查：这个用户登录了吗？（看 token）
    ↓
把数据存进数据库（SQLite 文件）
    ↓
截图文件存到 storage/ 文件夹
    ↓
返回"保存成功"给前端
    ↓
前端把新画作加到画廊列表里
```

**跨设备同步的原理**：数据存在后端（你的电脑），不存浏览器里。手机登录同一账号 → 后端验证身份 → 返回这个账号的所有数据。所以换设备登录能看到同样的内容。

---

## 部署架构（现在怎么跑的）

### 电脑上演示（最简单）

```
浏览器（localhost:5173）
    ↓ 本地通信
Vite 前端服务器（localhost:5173）
    ↓ 转发 API 请求
PocketBase 后端（localhost:8090）
    ↓ 读写
SQLite 数据库（pb_data/data.db）
```

浏览器只跟 Vite 说话，Vite 帮忙把 API 请求转给 PocketBase。三个程序都跑在你电脑上。

### 手机公网访问（答辩用）

手机不在你电脑上，怎么访问？用 Cloudflare Tunnel——一个"穿墙"工具，把你电脑的服务暴露到公网：

```
手机（4G/5G）
    ↓ 访问公网网址
Cloudflare Tunnel（穿墙）
    ↓ 转发到你电脑
Vite Preview（localhost:4173，生产构建版）
    ↓ 调 API
另一个 Cloudflare Tunnel
    ↓ 转发到你电脑
PocketBase（localhost:8090）
    ↓
SQLite 数据库
```

需要开两个 tunnel：
- **tunnel A**：暴露前端页面（给手机访问的网址）
- **tunnel B**：暴露后端 API（前端调用的接口）

前端打包时把 tunnel B 的网址写死在代码里，这样前端知道去哪调 API。

**限制**：
- 电脑必须开着（关了就全断了）
- tunnel 网址是随机的，每次重启 cloudflared 会变
- 答辩前启动一次别关就行

---

## 为什么选这些技术

| 选择 | 为什么 |
| --- | --- |
| React | 组件化，适合多页面应用；生态成熟 |
| Vite | 开发时热更新快，打包简单 |
| PocketBase | 5 分钟启动，自带账号系统 + 数据库 + API + 管理后台，不用自己写后端 |
| SQLite | 单文件，不用装数据库服务，备份就是复制文件 |
| Three.js + GLSL | 水墨流体模拟需要 GPU 计算，Three.js 封装了 WebGL |
| Web Audio API | 实时合成噪音和双耳节拍，不用音频文件 |
| Cloudflare Tunnel | 免费、不用绑信用卡、自带 HTTPS，适合答辩 demo |

---

## 几个关键设计

### 1. 账号安全

- 密码用 bcrypt 哈希后存数据库（PocketBase 内置，不存明文）
- 安全问题答案用 SHA-256 哈希后存（前端哈希，后端只存哈希值）
- 登录后发一个 JWT token（7 天有效期），前端存浏览器 localStorage，每次请求带上

### 2. 数据隔离

- 每个用户只能看到自己的数据
- PocketBase 的 API Rules 规定：`user = @request.auth.id`（只能读写自己的记录）
- 用户 A 用自己的 token 去查用户 B 的画作 → 返回空（不是 403，是 404，PocketBase 的行为）

### 3. 画作生成

- 专注开始时初始化水墨引擎（模拟墨滴在水面扩散）
- 音乐的音量/频率/节拍实时驱动画笔行为
- 专注结束时用 WebGL canvas 的 `toDataURL` 截图，转成 PNG 上传到后端
- 放弃专注也保存（半透明"残卷"）

### 4. 防分心

- 手机方向传感器检测屏幕朝下
- 拿起手机 → 线条停止 + 褪色 + 15 秒倒计时
- 15 秒内放回 → 恢复
- 超过 15 秒 → 永久褪色，画作受损

---

## 目录结构（代码在哪）

```
MTX_healing/
├── backend/                 后端（PocketBase）
│   ├── pb_migrations/       数据库建表脚本（进 git）
│   ├── pb_data/             数据库文件 + 上传的图片（不进 git）
│   └── README.md            后端启动说明
├── src/                     前端工程
│   ├── src/                 应用源代码
│   │   ├── api.js           后端 API 封装（auth/artworks/presets/favorites）
│   │   ├── store.jsx        全局状态管理（React Context）
│   │   ├── audioEngine.js   音乐混音引擎
│   │   ├── suminagashi.js   水墨渲染引擎（Three.js + GLSL）
│   │   └── pages/           17 个页面组件
│   ├── dist/                打包后的生产文件（不进 git）
│   └── vite.config.js       Vite 配置
├── docs/                    产品文档（PRD、需求、音频指南）
├── journals/                工作日志（Day 1-4 + 调试记录）
├── STARTUP.md               启动指南
└── BACKEND_POCKETBASE.md    后端架构方案
```

---

## 启动顺序（电脑关机后怎么恢复）

详见 `STARTUP.md`，简单说：

1. 启动 PocketBase（后端）
2. 启动 Vite（前端，电脑演示用）
3. 如果要手机访问：打包前端 → 启动预览 → 开两个 Cloudflare Tunnel

---

## 答辩时怎么讲

1. **架构图**：浏览器 → Vite → PocketBase → SQLite，四层
2. **演示账号跨设备同步**：电脑创建预设 → 手机登录看到同样的预设
3. **打开 PocketBase 管理后台**：让老师看到数据真的存在数据库里
4. **讲 API Rules**：用户只能看自己的数据，安全
5. **水墨引擎**：WebGL + GLSL 实时模拟流体，音乐驱动画笔
