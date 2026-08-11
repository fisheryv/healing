# 希音 Healing — 启动指南

电脑关机/重启后，按本文档操作即可恢复全部服务。

## 前提（一次性安装，装过就跳过）

```bash
brew install pocketbase    # PocketBase 0.39+
brew install cloudflared   # Cloudflare Tunnel
cd src && pnpm install     # 前端依赖
```

---

## 场景 A：只电脑演示（最快，答辩首选）

开 **2 个终端**：

```bash
# 终端 1：启动后端
cd /Users/lingshanli/code/MTX_healing/backend
pocketbase serve --http=0.0.0.0:8090 --origins="*"

# 终端 2：启动前端
cd /Users/lingshanli/code/MTX_healing/src
pnpm dev
```

电脑浏览器打开 `http://localhost:5173/` 即可演示。

---

## 场景 B：手机公网访问（跨设备同步演示）

需要 **4 个终端**。比场景 A 多了 build + 两个 tunnel。

### 终端 1：后端

```bash
cd /Users/lingshanli/code/MTX_healing/backend
pocketbase serve --http=0.0.0.0:8090 --origins="*"
```

### 终端 2：PB tunnel

```bash
cloudflared tunnel --url http://localhost:8090
```

**记下输出的域名 A**，格式类似：
```
https://xxx-xxx-xxx-xxx.trycloudflare.com
```

### 终端 3：build + preview

```bash
cd /Users/lingshanli/code/MTX_healing/src

# 用域名 A build（把 A 替换成终端 2 输出的域名）
VITE_PB_URL="https://xxx-xxx-xxx-xxx.trycloudflare.com" pnpm build

# 启动 preview
pnpm preview
```

### 终端 4：preview tunnel

```bash
cloudflared tunnel --url http://localhost:4173
```

**记下输出的域名 B**。

### 手机访问

用手机 4G/5G 打开**域名 B**（不是域名 A）。域名 A 是后端 API，域名 B 是前端页面。

> ⚠️ **每次重启 cloudflared 域名都会变**。如果重启了终端 2 的 PB tunnel，域名 A 变了，要重新 build 前端（终端 3 重跑 build 命令）。preview tunnel（终端 4）域名变了不影响前端，只是手机访问的 URL 要换。

---

## 答辩前检查清单

- [ ] PB 在跑（`http://localhost:8090/api/health` 返回 200）
- [ ] vite dev 在跑（`http://localhost:5173/` 能打开）
- [ ] 如果要手机演示：两个 tunnel 都在跑，记下域名 B
- [ ] 测试账号能登录
- [ ] Mac 设置里关闭"自动睡眠"（系统设置 → 电池 → 选项 → 防止自动睡眠）
- [ ] 答辩时别合盖

---

## 一键启动脚本（可选）

把下面的内容存到 `~/start-healing.sh`，`chmod +x ~/start-healing.sh`，以后双击或 `~/start-healing.sh` 一键启动场景 A：

```bash
#!/bin/bash
cd /Users/lingshanli/code/MTX_healing
osascript -e 'tell app "Terminal" to do script "cd backend && pocketbase serve --http=0.0.0.0:8090 --origins=\"*\""'
sleep 2
osascript -e 'tell app "Terminal" to do script "cd src && pnpm dev"'
```

---

## 常见问题

### 手机访问慢
- 确认访问的是 preview tunnel（域名 B，端口 4173），不是 dev tunnel（端口 5173）
- preview 是生产构建（3 个文件），dev 是开发模式（几百个请求，很慢）

### tunnel 域名打不开
- 确认 cloudflared 进程还在跑（终端没关）
- 确认 Mac 没睡眠
- 域名是随机的，每次重启变，确认用的是最新输出的域名

### PB 连不上
```bash
lsof -nP -iTCP:8090 -sTCP:LISTEN   # 确认 PB 在跑
curl http://127.0.0.1:8090/api/health  # 应返回 {"message":"API is healthy."}
```

### vite 端口被占
```bash
pkill -f vite          # 杀掉所有 vite 进程
cd src && pnpm dev     # 重启
```

### pull 了队友代码后手机访问旧版本
重新 build + 重启 preview：
```bash
cd src
VITE_PB_URL="当前的PB tunnel域名" pnpm build
# 重启 preview（Ctrl+C 后 pnpm preview）
```

---

## 进程一览（正常运行时）

| 进程 | 端口 | 用途 |
| --- | --- | --- |
| PocketBase | 8090 | 后端 API + Admin UI |
| vite dev | 5173 | 电脑演示（开发模式，有 HMR） |
| vite preview | 4173 | 手机访问（生产构建，快） |
| cloudflared (PB) | — | tunnel → 8090，给手机访问 PB |
| cloudflared (preview) | — | tunnel → 4173，给手机访问前端 |

- 电脑演示：只开 PB + vite dev（场景 A）
- 手机访问：四个全开（场景 B）
- Admin UI：电脑访问 `http://localhost:8090/_/`，手机访问 PB tunnel 域名 + `/_/`
