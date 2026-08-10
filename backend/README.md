# Backend (PocketBase)

希音 Healing 的后端，基于 [PocketBase](https://pocketbase.io/)（Go 单二进制 + SQLite + REST API + Admin UI）。

## 快速启动

### 1. 安装 PocketBase

```bash
# macOS
brew install pocketbase

# 或去 https://github.com/pocketbase/pocketbase/releases 下载对应平台的二进制
```

### 2. 启动

```bash
cd backend
pocketbase serve --http=0.0.0.0:8090 --origins="*"
```

参数说明：
- `--http=0.0.0.0:8090`：监听所有网卡（手机 / 局域网设备可访问）
- `--origins="*"`：允许任意来源的 CORS（仅 dev，生产要改回白名单）

首次启动会自动：
1. 创建 `pb_data/data.db`（SQLite 数据库）
2. 执行 `pb_migrations/` 里的 5 个迁移脚本，建好 4 个 collection（`users` / `artworks` / `presets` / `favorites`）+ API Rules

### 3. 创建管理员

```bash
pocketbase superuser upsert admin@healing.local '你的密码'
```

或打开 `http://127.0.0.1:8090/_/` 首次访问时创建。

### 4. 访问

- **Admin UI**：`http://127.0.0.1:8090/_/`
- **REST API**：`http://127.0.0.1:8090/api/`

## Collections 一览

| Collection | 类型 | 说明 |
| --- | --- | --- |
| `users`（扩展内置） | auth | 用户账号：email / password / nickname / avatar / recoveryQuestion / recoveryAnswer (SHA-256) / lang / settings |
| `artworks` | base | 专注画作：user / image / duration / curveType / mix / status / quote |
| `presets` | base | 混音预设：user / name / mainMusicId / volumes / ambient / binaural |
| `favorites` | base | 收藏：user / musicId |

所有业务表的 API Rules 都是 `user = @request.auth.id`（只能读写自己的记录）。

## 数据说明

- `pb_data/` 被 `.gitignore` 忽略，**不上传 git**。每人本地一份独立数据库。
- 想用别人注册的账号？让对方打包 `pb_data/` 发给你，解压覆盖即可（见下方"数据共享"）。

## 前端配合

前端（`src/`）dev 环境下通过 vite proxy 访问 PB：
- 浏览器请求 `http://localhost:5173/api/...` → vite 转发到 `http://127.0.0.1:8090/api/...`
- 所以**必须同时启动 vite 和 PB**，且端口固定（vite 5173 / PB 8090）

```bash
# 终端 1：启动 PB
cd backend && pocketbase serve --http=0.0.0.0:8090 --origins="*"

# 终端 2：启动前端
cd src && pnpm install && pnpm dev
```

访问 `http://localhost:5173/`。

## 数据共享（可选）

如果队友想用你这边注册的账号：

**你这边**：
```bash
pkill -f pocketbase                        # 先停 PB
cd backend && tar czf pb_data_backup.tar.gz pb_data/   # 打包
# 把 pb_data_backup.tar.gz 发给队友
pocketbase serve --http=0.0.0.0:8090 --origins="*"     # 重新启动
```

**队友那边**：
```bash
cd backend
pocketbase serve                           # 启动一次让它建目录，然后 Ctrl+C
rm -rf pb_data/                            # 删掉自动创建的空库
tar xzf pb_data_backup.tar.gz              # 解压你的备份
pocketbase superuser upsert admin@healing.local '他的密码'   # 管理员要单独建
pocketbase serve --http=0.0.0.0:8090 --origins="*"
```

## 常用命令

```bash
# 备份
cp backend/pb_data/data.db backup-$(date +%Y%m%d).db

# 升级 PB
brew upgrade pocketbase
# 升级前先备份 pb_data，查看 release notes 有无 breaking change

# 查看迁移日志
ls backend/pb_migrations/
```

## 注意事项

- ⚠️ `--origins="*"` 只能用于本地 dev，**生产部署必须改回白名单**
- ⚠️ 生产环境必须用 HTTPS（`crypto.subtle` 需要 secure context）
- ⚠️ 管理员密码不要提交到 git
- ⚠️ `pb_data/` 不要提交到 git（已在 `.gitignore`）

## 相关文档

- [后端架构方案](../BACKEND_POCKETBASE.md) — 选型理由、数据模型、部署方案、4 天计划
- [工作日志](../journals/) — 搭建过程、踩坑记录、排查指南
