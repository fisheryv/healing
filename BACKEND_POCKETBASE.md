# 后端架构方案：PocketBase

> **决策日期**：2026-08-10
> **目标**：在 4 天内（答辩前）为"希音 Healing" H5 Demo 接入一个真实可用的后端，让用户账号能跨设备持久化。
> **选定方案**：PocketBase（单二进制 + SQLite + 内置 Auth / REST API / Admin UI）

---

## 1. 为什么选 PocketBase

| 维度 | PocketBase | Supabase | 自建 Node + Express + SQLite |
| --- | --- | --- | --- |
| 启动时间 | 5 分钟（下载即跑） | 30+ 分钟（账号/项目/SDK 配置） | 半天（写代码 + 部署） |
| 内置 Auth | ✅ 注册/登录/JWT/密码哈希 | ✅ 完整 | ❌ 自己写 |
| 内置 Admin UI | ✅ 浏览器可视化建表 | ✅ Dashboard | ❌ 自己写 |
| 数据库 | SQLite（够用） | Postgres（过度） | SQLite |
| 文件存储 | ✅ 本地 + S3 兼容 | ✅ Storage | ❌ 自己接 |
| 学习成本 | 低（REST 通用） | 中（SDK + RLS） | 中（自己实现） |
| 4 天内可交付 | ✅ | ⚠️ 勉强 | ❌ 紧张 |

**答辩场景下**：5 分钟启动、浏览器就能演示、有可视化后台管理界面、纯 HTTP REST——足够撑场，也方便讲解。

---

## 2. PocketBase 是什么

- **作者**：Golang 社区知名开发者（最初为单人项目，如今被广泛采用）。
- **核心**：用 Go 编写的单二进制，嵌入式 SQLite + REST API + Realtime + Admin UI。
- **版本**：当前稳定版 ≥ 0.22（建议用最新版）。
- **能力清单**：
  - 数据库（SQLite，零配置）
  - 鉴权（注册、登录、JWT、邮箱验证、密码重置、OAuth2）
  - 文件存储（本地磁盘，兼容 S3）
  - Realtime 订阅（SSE，2025+ 起正式可用）
  - 后端 Hooks（JS / Python 写业务逻辑，无需另起服务）
  - Admin UI（建表、查数据、配置权限规则）
- **官方 SDK**：`pocketbase` JS SDK（CDN / npm 包均可）。

---

## 3. 整体架构

```
┌──────────────────────────────────────────────────────────┐
│                     浏览器 (Vite H5)                     │
│  src/store.jsx ── useApp() ──► src/api.js ── fetch() ──┐ │
└──────────────────────────────────────────────────────────┘
                                                        │ HTTPS
                                                        ▼
┌──────────────────────────────────────────────────────────┐
│                PocketBase (单进程)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  users   │  │ artworks │  │ presets  │  │ favorites│ │
│  │  (内置)  │  │  (新建)  │  │  (新建)  │  │  (新建)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│  Admin UI: https://<host>/_/                            │
│  REST API: https://<host>/api/...                       │
│  SQLite: pb_data/data.db (单文件，便于备份)              │
└──────────────────────────────────────────────────────────┘
```

与现在的差异：原来所有数据存浏览器 `localStorage`（`healing_app_state_v1` 等），现在只保留 token + 用户偏好；业务数据全部走 API。

---

## 4. 本地开发环境搭建

### 4.1 安装

```bash
# macOS（推荐）
brew install pocketbase

# 或直接下载二进制（任意平台）
# https://github.com/pocketbase/pocketbase/releases 解压即可

# 验证
pocketbase --version
```

### 4.2 启动

```bash
# 在工程根目录或任意位置新建 backend/ 文件夹
mkdir -p /Users/lingshanli/code/MTX_healing/backend
cd /Users/lingshanli/code/MTX_healing/backend
pocketbase serve
# 默认监听 http://127.0.0.1:8090
# Admin UI: http://127.0.0.1:8090/_/
# API:     http://127.0.0.1:8090/api/...
```

### 4.3 首次访问

1. 打开 `http://127.0.0.1:8090/_/`
2. 创建管理员账户（邮箱 + 密码）——**仅你自己用，不要泄露**。
3. 进 Admin UI 后，先在 Settings → URL 中配置 **API URL**（部署后才改，本地用默认）。

### 4.4 数据目录

- 全部数据落在 `backend/pb_data/data.db`（SQLite 单文件）。
- 备份 = 复制这个文件。
- **加入 `.gitignore`**：`backend/pb_data/`、`backend/pb_migrations/`（migration 本身提交）。

---

## 5. 数据模型（Collections）

> 在 Admin UI 的 "Collections" → "New collection" 中创建。所有集合都设置 `auth` 关闭（除非明确说明）。

### 5.1 `users`（扩展内置 `users` 表）

PocketBase 自带 `users` collection，自带 `email / password / verified / username` 等字段。**直接在它上面扩展**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `nickname` | text (≤20) | 显示昵称 |
| `avatar` | file (image) | 头像（≤1MB） |
| `recoveryQuestion` | text | 安全问题（可选） |
| `recoveryAnswer` | text | 安全问题答案（**存哈希**，不存明文） |
| `lang` | text (`zh`/`en`) | 语言偏好 |
| `settings` | json | `{ screenDown, dnd, completeNotice }` |

### 5.2 `artworks`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `user` | relation → users | 创建者 |
| `image` | file (image, ≤5MB) | Suminagashi 截屏 PNG |
| `duration` | number (sec) | 专注时长 |
| `curveType` | text | 曲线名（来自 `data.js/curveTypes`） |
| `mix` | json | 当时使用的混音方案快照 |
| `status` | text (`complete` / `abandoned` / `distracted`) | 完成状态 |
| `quoteEn` / `quoteCn` | text | 完成时的文学摘录（仅 `complete`） |
| `elapsed` | number (sec) | 实际专注秒数（残卷用） |
| `created` | autodate | PocketBase 自带 |

**索引**：`CREATE INDEX idx_artworks_user_created ON artworks (user, created DESC)`

### 5.3 `presets`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `user` | relation → users | 创建者 |
| `name` | text | 预设名（同一用户内唯一） |
| `mainMusicId` | text | 主音乐 id |
| `mainMusicTitle` | text | 主音乐标题 |
| `mainVolume` | number (0~1) | |
| `bgNoiseId` | text | |
| `bgVolume` | number | |
| `ambient` | json | `[{ id, name, volume }]` |
| `binauralId` | text | |
| `binauralVolume` | number | |
| `created` | autodate | |

### 5.4 `favorites`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `user` | relation → users | |
| `musicId` | text | 收藏的曲 id |

唯一约束：`(user, musicId)`。

### 5.5 `quotes`（可选，看是否需要换源）

如果想让文学摘录从后端拿（避免重复），可以建：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `en` | text | 英文 |
| `cn` | text | 中文 |

初始导入 `data.js/quotes` 的 8 条。

> 如果时间紧，**这一项可以不做**，摘录仍从 `data.js` 随机选（去重逻辑保留在 store 里）。

---

## 6. API 集成

### 6.1 引入官方 SDK

```bash
cd src
pnpm add pocketbase   # 或 npm i pocketbase
```

`src/api.js`（新建）：

```js
import PocketBase from 'pocketbase'

const PB_URL = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090'
export const pb = new PocketBase(PB_URL)

// 自动从 localStorage 恢复登录态
pb.authStore.onChange((token, model) => {
  try {
    if (token) localStorage.setItem('healing_app_token_v1', token)
    else localStorage.removeItem('healing_app_token_v1')
  } catch {}
}, true) // true = 立即触发一次
```

### 6.2 Auth 模块改造

`store.jsx/auth` 全部替换为调 `pb.collection('users')`：

| 现有方法 | 新实现 |
| --- | --- |
| `auth.register({ email, password, ... })` | `pb.collection('users').create({ ... })` 后立即 `pb.collection('users').authWithPassword(email, password)` |
| `auth.login({ email, password })` | `pb.collection('users').authWithPassword(email, password)` |
| `auth.resetPassword(...)` | 调 PocketBase 的 `/api/collections/users/request-password-reset`（或简化：保留安全问题流程，前端校验） |
| `auth.changePassword(...)` | `pb.collection('users').update(pb.authStore.model.id, { password: newPassword, oldPassword })` |
| `auth.loadRemember()` | 删除（不需要，token 自带身份） |

**返回结构**保持兼容：

```js
{ ok: true, user: { email, nickname, avatar, account, id } }
```

### 6.3 CRUD 模块

新建 `src/api.js` 中的子模块（或各自的文件）：

```js
// artworks
export const artworks = {
  list: () => pb.collection('artworks').getList(1, 200, { sort: '-created', filter: `user="${pb.authStore.model.id}"` }),
  create: (record) => pb.collection('artworks').create({ ...record, user: pb.authStore.model.id }),
  delete: (id) => pb.collection('artworks').delete(id),
}

// presets / favorites 同理
```

### 6.4 store.jsx 改造要点

- `user` 不再从 localStorage 读取，而是从 `pb.authStore.model` 派生。
- `favorites / presets / artworks` 不再写 localStorage；改成"加载时 fetch，变更时 API 调用 + 本地缓存"。
- `useApp()` 中暴露 `refresh()` 方法：在 mount / 登录后 / 网络恢复时重新拉数据。
- 删除：`codes` 模块（验证码由后端发）、`loadLocks`（锁定由后端记）、`migratePreset`（统一字段后不再需要）。

### 6.5 Token 刷新

- SDK 默认 7 天过期；过期后用 `pb.collection('users').authRefresh()` 自动续期（SDK 已封装）。
- 失败时清空 store 并跳 `/login`。

---

## 7. 前端改造清单

| 文件 | 改动 |
| --- | --- |
| `src/package.json` | 新增 `pocketbase` 依赖 |
| `src/.env.development` | 新增 `VITE_PB_URL=http://127.0.0.1:8090` |
| `src/src/api.js` | **新建**：SDK 实例 + 各模块封装 |
| `src/src/store.jsx` | `auth` 改 SDK；`codes/locks/migratePreset` 删除；state 用 `useEffect` 同步 SDK |
| `src/src/pages/NicknameSetup.jsx` | 头像上传改用 `pb.collection('users').update(...)` 上传 file |
| `src/src/pages/Profile.jsx` | 删除本地热力图聚合，改用后端统计 |
| `src/src/pages/SignUp.jsx` | 验证码由 PocketBase 发（HTTP），不再本地生成 |
| `src/src/pages/ForgotPassword.jsx` | 同上 |
| `src/src/pages/FocusSession.jsx` | 完成后 `artworks.create(...)` 上传截图 |
| `src/src/App.jsx` | `RequireAuth` 改为检查 `pb.authStore.isValid` |

---

## 8. 安全与权限（API Rules）

PocketBase 每个 collection 都有 4 类规则：`list / view / create / update / delete`。

### 8.1 `users`

- `listRule`: `id = @request.auth.id`（只能列自己）
- `viewRule`: `id = @request.auth.id`
- `createRule`: `""`（允许任何人注册，但要在 Hook 里限制）
- `updateRule`: `id = @request.auth.id`
- `deleteRule`: `id = @request.auth.id`（避免误删）

### 8.2 `artworks / presets / favorites`

- 全部规则限定 `user = @request.auth.id`：

```js
listRule:   "user = @request.auth.id"
viewRule:   "user = @request.auth.id"
createRule: "user = @request.auth.id"
updateRule: "user = @request.auth.id"
deleteRule: "user = @request.auth.id"
```

### 8.3 CORS

在 Admin UI → Settings → CORS 添加：

- `http://localhost:5173`（本地 dev）
- `http://localhost:5174`（备用端口）
- 你部署的前端域名（部署后填）

### 8.4 密码强度

- PocketBase 默认 ≥10 字符。可以放宽到 ≥8（贴近现有前端 `validatePassword`）。
- 在 `users.createRule` 中配合 Hook 做 server-side 校验：

```js
// pb_hooks/main.pb.js (在 backend/ 目录下)
onRecordCreateRequest((e) => {
  const pwd = e.record.password || ''
  if (pwd.length < 8 || !/[a-zA-Z]/.test(pwd) || !/\d/.test(pwd)) {
    throw new BadRequestError('Password must be 8+ chars with letters and digits')
  }
  e.next()
}, 'users')
```

---

## 9. 部署方案

### 9.1 选项 A：Fly.io（推荐）

```bash
brew install flyctl
fly auth signup
cd backend
fly launch --no-deploy   # 选区域，会生成 fly.toml
# 编辑 fly.toml，加：
#   [[mounts]]
#     source = "pb_data"
#     destination = "/app/pb_data"
fly deploy
fly secrets set ADMIN_EMAIL=xxx ADMIN_PASSWORD=xxx
```

数据持久化：挂载 1GB volume（`pb_data`）。

### 9.2 选项 B：Railway

- 连接 GitHub repo，指定 `backend/` 子目录作为 root。
- 自动构建（用提供的 Dockerfile 或 PocketBase 官方 Docker image）。
- 加 volume 持久化 `pb_data`。

### 9.3 选项 C：自有机器（演示用）

```bash
# 在 Mac 上跑，让同局域网手机访问
pocketbase serve --http=0.0.0.0:8090
# 手机连同一 Wi-Fi，访问 http://<mac-ip>:8090
```

> 答辩现场如果网络不便，用 C 方案 + ngrok 公开。

### 9.4 部署检查清单

- [ ] `pb_data/` 已挂载到持久卷（重启不丢数据）
- [ ] Admin 账户密码已改、已加入密码管理器
- [ ] CORS 已加前端域名
- [ ] HTTPS 已开（PocketBase 反向代理到 Caddy / Nginx）
- [ ] 前端 `VITE_PB_URL` 已指部署域名
- [ ] Admin UI 路径 `/_/` 不暴露（设置反代时改成别的路径或加 basic auth）

---

## 10. 4 天时间线

### Day 1（今天）：本地 PocketBase + 数据建模

- [ ] `brew install pocketbase`，跑通 Admin UI
- [ ] 按第 5 节创建 4 个 collections（users / artworks / presets / favorites）
- [ ] 用 curl 测一遍 CRUD：

  ```bash
  curl -X POST http://127.0.0.1:8090/api/collections/users/records \
    -H "Content-Type: application/json" \
    -d '{"email":"a@b.com","password":"abc12345","passwordConfirm":"abc12345","nickname":"test"}'
  ```

- [ ] 设置 API Rules、CORS
- [ ] **产出**：一个可手动跑通注册/登录的 PocketBase 实例

### Day 2：前端接入 SDK，auth 替换

- [ ] `pnpm add pocketbase`
- [ ] 新建 `src/src/api.js`，封装 SDK
- [ ] 重写 `store.jsx/auth`：register / login / logout / changePassword / resetPassword
- [ ] 端到端测试：注册 → 登录 → 刷新页面仍保持登录 → 注销
- [ ] **产出**：Auth 模块完全脱离 localStorage

### Day 3：业务数据迁移（artworks / presets / favorites）

- [ ] `api.js` 加 artworks / presets / favorites CRUD
- [ ] `store.jsx` 同步逻辑：mount 时拉、变更时 API + 本地状态更新
- [ ] `FocusSession` 完成时上传截图
- [ ] `NicknameSetup` / `Profile` 上传头像
- [ ] **产出**：完整业务闭环跑通

### Day 4：部署 + 收尾

- [ ] 部署 PocketBase 到 Fly.io / Railway
- [ ] 前端打包 `pnpm build` 部署到 Vercel / Netlify
- [ ] 跨设备测一次：在手机登录 → 看到自己电脑上的画作
- [ ] 准备答辩 demo：本地 PocketBase + Vercel 前端的演示链路
- [ ] **产出**：可演示的全栈应用

---

## 11. 答辩演示要点（怎么讲）

### 架构图（30 秒）

> "前端是 Vite + React，后端选用 PocketBase——一个 Go 单进程，自带 SQLite、REST API、Admin UI。4 张表：用户、画作、混音预设、收藏。前端用官方 JS SDK，所有数据权限用 API Rules 限制为只能读写自己的记录。"

### 现场演示脚本

1. **打开 Admin UI**：可视化看到 4 张表 + 数据 → "这就是后端管理界面"
2. **注册流程**：手机号 + 验证码 + 密码 + 安全问题 → 走完到昵称设置
3. **专注 + 生成画作**：完成一次专注，画作上传到 PocketBase（Admin UI 实时刷新看得到）
4. **跨设备**：用手机扫码 / 切到另一浏览器登录同一账号 → 看到所有数据
5. **API Rules 演示**：在 DevTools 试着用一个 token 访问别人的 `artworks` → 返回 403

### 老师可能问 & 怎么答

| 问题 | 简答 |
| --- | --- |
| 为什么选 PocketBase 不选 Firebase？ | 学习曲线低、自托管、SQLite 适合 demo 规模、Admin UI 利于调试 |
| 数据安全吗？ | 密码 bcrypt 哈希（PB 内置）；API Rules 限制只能看自己的数据；JWT 7 天自动续期 |
| 横向扩展怎么办？ | 换 Postgres（PocketBase 0.22+ 支持）或迁移到 Supabase / 自建 Node；前端只需改 base URL |
| Realtime 怎么支持？ | PB 提供 SSE `/api/realtime`，监听 collection 变化，可做实时同步 |
| 不用邮件验证吗？ | Demo 范围内信任用户；生产化时启用 PB 的 email verify（需配 SMTP） |

---

## 12. 后续扩展（暂不做，记下来）

- **邮件验证**：PB 内置支持，配 SMTP 即可启用
- **OAuth**：PB 支持 Google / GitHub / Discord 等 OAuth2
- **Realtime 同步**：用 `/api/realtime` 监听 artworks 变化，多端同步
- **文件存储 CDN**：PB 0.22+ 支持挂 S3 兼容存储（MinIO / R2）
- **统计 / 后台分析**：用 PB 的 logs collection 或外接 PostHog
- **数据导出 / 备份**：直接复制 `pb_data/data.db` 即可
- **生产化指标**：加 Prometheus exporter（PB Hook 可输出 metrics）

---

## 附录 A：常用命令

```bash
# 启动
pocketbase serve                          # 默认端口 8090
pocketbase serve --http=0.0.0.0:8090      # 监听所有网卡
pocketbase serve --http=127.0.0.1:8090 --https=letsencrypt

# 备份
cp backend/pb_data/data.db backup-2026-08-10.db

# 备份 + 上传到 S3 / R2（可选）
# 用 cron + rclone

# 升级 PB
brew upgrade pocketbase
# 注意：升级前先备份 pb_data；查看 release notes 是否有 breaking change
```

## 附录 B：关键参考

- 官方文档：https://pocketbase.io/docs/
- JS SDK：https://github.com/pocketbase/js-sdk
- Hooks 文档：https://pocketbase.io/docs/js-overview/
- 当前 Demo 的前端结构：`PROJECT_STRUCTURE.md`