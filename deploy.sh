#!/bin/bash
# ============================================================
# 希音 Healing — Linux 一键部署脚本
#
# 功能：
#   1. 检查并安装所有依赖（Node.js / pnpm / PocketBase / Nginx）
#   2. 安装前端 npm 依赖并构建生产版本
#   3. 用 Nginx 托管前端静态文件，反向代理后端 API
#   4. 启动 PocketBase 后端
#   5. 配置 systemd 服务，实现开机自启 + 崩溃自动重启
#
# 用法：
#   chmod +x deploy.sh
#   sudo ./deploy.sh                    # 交互式，会询问域名/端口
#   sudo ./deploy.sh --domain=xxx.com   # 指定域名
#   sudo ./deploy.sh --pb-url=http://127.0.0.1:8090  # 指定后端地址（不指定则用同源）
#
# 注意：需要 root 或 sudo 权限（安装系统包 + 配置 Nginx + systemd）
# ============================================================

set -e

# ---------- 颜色输出 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }
section() { echo -e "\n${BLUE}========== $1 ==========${NC}"; }

# ---------- 变量 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/src"
BACKEND_DIR="$SCRIPT_DIR/backend"
PB_VERSION="0.27.1"
NODE_REQUIRED="18"
PNPM_VERSION="9"
# Nginx 配置路径（在 install_nginx 后根据发行版自动调整）
NGINX_CONF=""
NGINX_LINK=""
NGINX_DEFAULT=""

# ---------- 镜像源（中国大陆服务器使用国内镜像加速）----------
# GitHub releases 和 nodejs.org 在国内可能无法直接访问，使用镜像
# 设置 USE_MIRROR=false 可强制使用官方源
USE_MIRROR=true

# Node.js 镜像（npmmirror 淘宝镜像）
NODE_MIRROR="https://npmmirror.com/mirrors/node"

# PocketBase 镜像（ghproxy 加速 GitHub releases）
PB_MIRROR="https://mirror.ghproxy.com"

# 检测是否需要使用镜像：尝试访问 GitHub，3 秒超时则启用镜像
check_mirror_needed() {
    if [ "$USE_MIRROR" = false ]; then
        return 1
    fi
    info "检测 GitHub 连通性..."
    if curl -sf --connect-timeout 5 --max-time 10 "https://github.com" -o /dev/null 2>/dev/null; then
        info "GitHub 可直接访问，使用官方源"
        USE_MIRROR=false
        return 1
    else
        warn "GitHub 不可直接访问，启用国内镜像"
        USE_MIRROR=true
        return 0
    fi
}

# 可配置参数（可通过命令行覆盖）
DOMAIN=""
PB_URL=""
PORT=80
INSTALL_NGINX=true
PB_PORT=8090
# 持久化数据目录：放在 /opt/healing 外，避免 GitHub Actions 的 scp rm:true 每次部署清空数据
PB_DATA_DIR="/var/lib/healing-pb_data"
PB_ADMIN_EMAIL="admin@healing.local"
PB_ADMIN_PASSWORD=""

# ---------- 解析命令行参数 ----------
for arg in "$@"; do
    case $arg in
        --domain=*)
            DOMAIN="${arg#*=}"
            ;;
        --pb-url=*)
            PB_URL="${arg#*=}"
            ;;
        --port=*)
            PORT="${arg#*=}"
            ;;
        --pb-port=*)
            PB_PORT="${arg#*=}"
            ;;
        --no-nginx)
            INSTALL_NGINX=false
            warn "跳过 Nginx 安装与配置，仅启动后端 + 前端 preview 模式"
            ;;
        --pb-admin-email=*)
            PB_ADMIN_EMAIL="${arg#*=}"
            ;;
        --pb-admin-password=*)
            PB_ADMIN_PASSWORD="${arg#*=}"
            ;;
        --help|-h)
            echo "希音 Healing 部署脚本"
            echo ""
            echo "用法: sudo ./deploy.sh [选项]"
            echo ""
            echo "选项:"
            echo "  --domain=xxx.com          指定域名（用于 Nginx server_name）"
            echo "  --pb-url=http://...       指定后端地址（前端 build 时写入，默认同源）"
            echo "  --port=80                 Nginx 监听端口（默认 80）"
            echo "  --pb-port=8090            PocketBase 监听端口（默认 8090）"
            echo "  --pb-admin-email=x@y.com  PocketBase 管理员邮箱（默认 admin@healing.local）"
            echo "  --pb-admin-password=xxx   PocketBase 管理员密码（不传则交互输入）"
            echo "  --no-nginx                不安装 Nginx，用 vite preview 托管前端"
            echo "  --help                    显示此帮助"
            exit 0
            ;;
        *)
            warn "未知参数: $arg"
            ;;
    esac
done

# ---------- 检查 root 权限 ----------
if [ "$EUID" -ne 0 ]; then
    error "请使用 root 或 sudo 运行此脚本"
    exit 1
fi

# ---------- 检测包管理器 ----------
detect_pkg_manager() {
    if command -v apt-get &>/dev/null; then
        PKG_MGR="apt-get"
        PKG_UPDATE="apt-get update -y"
        PKG_INSTALL="apt-get install -y"
    elif command -v yum &>/dev/null; then
        PKG_MGR="yum"
        PKG_UPDATE="yum makecache -y"
        PKG_INSTALL="yum install -y"
    elif command -v dnf &>/dev/null; then
        PKG_MGR="dnf"
        PKG_UPDATE="dnf makecache -y"
        PKG_INSTALL="dnf install -y"
    elif command -v apk &>/dev/null; then
        PKG_MGR="apk"
        PKG_UPDATE="apk update"
        PKG_INSTALL="apk add"
    elif command -v pacman &>/dev/null; then
        PKG_MGR="pacman"
        PKG_UPDATE="pacman -Sy --noconfirm"
        PKG_INSTALL="pacman -S --noconfirm"
    else
        error "未检测到支持的包管理器（apt/yum/dnf/apk/pacman）"
        exit 1
    fi
    info "检测到包管理器: $PKG_MGR"
}

# ---------- 安装系统依赖 ----------
install_system_deps() {
    section "检查并安装系统依赖"

    # 基础工具（通用，所有发行版都有）
    local need_install=()
    command -v curl &>/dev/null    || need_install+=("curl")
    command -v wget &>/dev/null    || need_install+=("wget")
    command -v tar &>/dev/null     || need_install+=("tar")
    command -v git &>/dev/null     || need_install+=("git")
    command -v unzip &>/dev/null   || need_install+=("unzip")

    if [ ${#need_install[@]} -gt 0 ]; then
        info "安装基础工具: ${need_install[*]}"
        $PKG_UPDATE
        $PKG_INSTALL "${need_install[@]}" || true
    else
        info "基础工具已齐全"
    fi

    # 防火墙工具：Debian/Ubuntu 用 ufw，RHEL/CentOS 用 firewalld
    # 仅安装对应发行版可用的防火墙工具，安装失败不阻塞部署
    if [ "$PKG_MGR" = "apt-get" ]; then
        if ! command -v ufw &>/dev/null; then
            info "安装 ufw (Debian/Ubuntu 防火墙)..."
            $PKG_INSTALL ufw 2>/dev/null || warn "ufw 安装失败，跳过防火墙配置"
        fi
    elif [ "$PKG_MGR" = "yum" ] || [ "$PKG_MGR" = "dnf" ]; then
        if ! command -v firewall-cmd &>/dev/null; then
            info "安装 firewalld (RHEL/CentOS 防火墙)..."
            $PKG_INSTALL firewalld 2>/dev/null || warn "firewalld 安装失败，跳过防火墙配置"
            systemctl enable firewalld 2>/dev/null || true
            systemctl start firewalld 2>/dev/null || true
        fi
    fi
}

# ---------- 安装 Node.js ----------
install_node() {
    section "检查 Node.js"

    if command -v node &>/dev/null; then
        local current_version
        current_version=$(node -v | sed 's/v//' | cut -d. -f1)
        if [ "$current_version" -ge "$NODE_REQUIRED" ]; then
            info "Node.js 已安装: $(node -v) ✓"
            return 0
        else
            warn "Node.js 版本过低 (v$current_version)，需要 v$NODE_REQUIRED+，正在升级..."
        fi
    else
        info "Node.js 未安装，正在安装..."
    fi

    # 安装 Node.js —— 优先用官方预编译二进制（兼容所有 Linux 发行版，包括 alinux4）
    # 尝试顺序：apt-get 原生 → yum/dnf 原生 → 官方 tarball 通用兜底
    local node_installed=false

    if [ "$PKG_MGR" = "apt-get" ]; then
        info "通过 NodeSource 安装 Node.js 22.x LTS..."
        if curl -fsSL --max-time 15 https://deb.nodesource.com/setup_22.x | bash -; then
            $PKG_INSTALL nodejs && node_installed=true
        fi
    elif [ "$PKG_MGR" = "yum" ] || [ "$PKG_MGR" = "dnf" ]; then
        info "尝试通过 NodeSource 安装 Node.js 22.x..."
        if curl -fsSL --max-time 15 https://rpm.nodesource.com/setup_22.x | bash - 2>/dev/null; then
            $PKG_INSTALL nodejs && node_installed=true
        else
            warn "NodeSource 不支持此系统或网络不可达，改用官方二进制安装..."
        fi
    elif [ "$PKG_MGR" = "apk" ]; then
        $PKG_INSTALL nodejs npm && node_installed=true
    elif [ "$PKG_MGR" = "pacman" ]; then
        $PKG_INSTALL nodejs npm && node_installed=true
    fi

    # 通用兜底：下载官方预编译 Node.js 二进制
    if [ "$node_installed" = false ] || ! command -v node &>/dev/null; then
        info "通过 Node.js 官方二进制安装 v22.x LTS..."
        local node_version="v22.14.0"
        local arch
        arch=$(uname -m)
        case $arch in
            x86_64|amd64) arch="x64" ;;
            aarch64|arm64) arch="arm64" ;;
            *) error "不支持的 CPU 架构: $arch"; exit 1 ;;
        esac

        local node_url
        if [ "$USE_MIRROR" = true ]; then
            node_url="${NODE_MIRROR}/${node_version}/node-${node_version}-linux-${arch}.tar.xz"
        else
            node_url="https://nodejs.org/dist/${node_version}/node-${node_version}-linux-${arch}.tar.xz"
        fi
        local tmp_node
        tmp_node=$(mktemp -d)
        info "下载: $node_url"
        cd "$tmp_node"
        if command -v wget &>/dev/null; then
            wget -q --show-progress -O node.tar.xz "$node_url"
        else
            curl -fsSL -o node.tar.xz "$node_url"
        fi
        tar -xf node.tar.xz
        local node_dir
        node_dir=$(find . -maxdepth 1 -type d -name "node-*" | head -1)
        # 复制到 /usr/local
        cp -r "$node_dir"/* /usr/local/
        cd "$SCRIPT_DIR"
        rm -rf "$tmp_node"
        node_installed=true
    fi

    if [ "$node_installed" = true ] && command -v node &>/dev/null; then
        info "Node.js 安装完成: $(node -v) ✓"
    else
        error "Node.js 安装失败，请手动安装 v$NODE_REQUIRED+ 后重试"
        exit 1
    fi
}

# ---------- 安装 pnpm ----------
install_pnpm() {
    section "检查 pnpm"

    if command -v pnpm &>/dev/null; then
        local pv
        pv=$(pnpm -v | cut -d. -f1)
        if [ "$pv" -ge "$PNPM_VERSION" ]; then
            info "pnpm 已安装: $(pnpm -v) ✓"
            return 0
        else
            warn "pnpm 版本过低 ($(pnpm -v))，正在升级..."
        fi
    else
        info "pnpm 未安装，正在安装..."
    fi

    # 使用 corepack（Node 16+ 自带）或 npm 全局安装
    # 如果启用镜像，先配置 npm 使用淘宝 registry（pnpm 安装也走这个 registry）
    if [ "$USE_MIRROR" = true ]; then
        info "配置 npm 使用淘宝镜像源..."
        npm config set registry https://registry.npmmirror.com
    fi

    if command -v corepack &>/dev/null; then
        corepack enable
        # 如果启用镜像，让 corepack 也走淘宝 registry 下载 pnpm
        if [ "$USE_MIRROR" = true ]; then
            COREPACK_NPM_REGISTRY="https://registry.npmmirror.com" corepack prepare pnpm@latest --activate
        else
            corepack prepare pnpm@latest --activate
        fi
    else
        npm install -g pnpm@latest
    fi

    info "pnpm 安装完成: $(pnpm -v) ✓"
}

# ---------- 安装 PocketBase ----------
install_pocketbase() {
    section "检查 PocketBase"

    # 检查全局 pocketbase 命令
    if command -v pocketbase &>/dev/null; then
        local installed_version
        installed_version=$(pocketbase --version 2>/dev/null | grep -oP '\d+\.\d+\.\d+' || echo "0.0.0")
        info "PocketBase 已安装: v$installed_version"

        # 版本比较：如果已安装版本 >= 目标版本，跳过
        local installed_major installed_minor installed_patch
        installed_major=$(echo "$installed_version" | cut -d. -f1)
        installed_minor=$(echo "$installed_version" | cut -d. -f2)
        installed_patch=$(echo "$installed_version" | cut -d. -f3)
        local target_major target_minor target_patch
        target_major=$(echo "$PB_VERSION" | cut -d. -f1)
        target_minor=$(echo "$PB_VERSION" | cut -d. -f2)
        target_patch=$(echo "$PB_VERSION" | cut -d. -f3)

        if [ "$installed_major" -gt "$target_major" ] || \
           { [ "$installed_major" -eq "$target_major" ] && [ "$installed_minor" -gt "$target_minor" ]; } || \
           { [ "$installed_major" -eq "$target_major" ] && [ "$installed_minor" -eq "$target_minor" ] && [ "$installed_patch" -ge "$target_patch" ]; }; then
            info "PocketBase 版本满足要求 (>= v$PB_VERSION) ✓"
            return 0
        fi
        warn "PocketBase 版本低于目标 (v$PB_VERSION)，将重新下载..."
    fi

    info "下载 PocketBase v$PB_VERSION for Linux..."

    # 检测架构
    local arch
    arch=$(uname -m)
    case $arch in
        x86_64|amd64)
            arch="amd64"
            ;;
        aarch64|arm64)
            arch="arm64"
            ;;
        armv7l)
            arch="arm_v7"
            ;;
        *)
            error "不支持的 CPU 架构: $arch"
            exit 1
            ;;
    esac

    local pb_url
    local gh_url="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${arch}.zip"
    if [ "$USE_MIRROR" = true ]; then
        pb_url="${PB_MIRROR}/${gh_url}"
    else
        pb_url="$gh_url"
    fi
    local tmp_dir
    tmp_dir=$(mktemp -d)

    info "下载地址: $pb_url"
    cd "$tmp_dir"

    # 下载（先试 wget，再试 curl）
    if command -v wget &>/dev/null; then
        wget -q --show-progress -O pb.zip "$pb_url"
    else
        curl -fsSL -o pb.zip "$pb_url"
    fi

    # 解压（PocketBase 发布的是 zip 格式）
    if ! command -v unzip &>/dev/null; then
        $PKG_INSTALL unzip || true
    fi
    unzip -o pb.zip

    # 安装到 /usr/local/bin
    mv pocketbase /usr/local/bin/pocketbase
    chmod +x /usr/local/bin/pocketbase

    cd "$SCRIPT_DIR"
    rm -rf "$tmp_dir"

    info "PocketBase v$PB_VERSION 安装完成 ✓"
}

# ---------- 安装 Nginx ----------
install_nginx() {
    if [ "$INSTALL_NGINX" = false ]; then
        warn "跳过 Nginx 安装"
        return 0
    fi

    section "检查 Nginx"

    if command -v nginx &>/dev/null; then
        info "Nginx 已安装: $(nginx -v 2>&1 | cut -d/ -f2) ✓"
    else
        info "安装 Nginx..."
        # RHEL/CentOS/Alibaba Cloud Linux 需要 EPEL 仓库才有 nginx
        if [ "$PKG_MGR" = "yum" ] || [ "$PKG_MGR" = "dnf" ]; then
            $PKG_INSTALL epel-release 2>/dev/null || true
        fi
        $PKG_INSTALL nginx
        info "Nginx 安装完成 ✓"
    fi

    # 根据发行版设置 Nginx 配置路径
    # Debian/Ubuntu: sites-available/ + sites-enabled/
    # RHEL/CentOS/Alibaba: conf.d/
    if [ -d /etc/nginx/sites-available ] && [ -d /etc/nginx/sites-enabled ]; then
        NGINX_CONF="/etc/nginx/sites-available/healing"
        NGINX_LINK="/etc/nginx/sites-enabled/healing"
        NGINX_DEFAULT="/etc/nginx/sites-enabled/default"
        info "Nginx 配置路径: Debian/Ubuntu 布局 ($NGINX_CONF)"
    elif [ -d /etc/nginx/conf.d ]; then
        # 确保 nginx.conf 包含 conf.d
        if ! grep -q "conf.d" /etc/nginx/nginx.conf 2>/dev/null; then
            sed -i '/http {/,/}/ { /}/ a\    include /etc/nginx/conf.d/*.conf;' /etc/nginx/nginx.conf 2>/dev/null || true
        fi
        NGINX_CONF="/etc/nginx/conf.d/healing.conf"
        NGINX_LINK=""  # conf.d 下的文件自动被 include，不需要 symlink
        NGINX_DEFAULT="/etc/nginx/conf.d/default.conf"
        info "Nginx 配置路径: RHEL/CentOS 布局 ($NGINX_CONF)"
    else
        # 兜底：创建 Debian 布局
        mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
        # 确保 nginx.conf 包含 sites-enabled
        if ! grep -q "sites-enabled" /etc/nginx/nginx.conf 2>/dev/null; then
            # 在 http 块末尾添加 include
            sed -i '/http {/,/}/ { /}/ a\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf 2>/dev/null || true
        fi
        NGINX_CONF="/etc/nginx/sites-available/healing"
        NGINX_LINK="/etc/nginx/sites-enabled/healing"
        NGINX_DEFAULT="/etc/nginx/sites-enabled/default"
        warn "Nginx 配置路径: 通用布局 ($NGINX_CONF)"
    fi
}

# ---------- 构建前端 ----------
build_frontend() {
    section "构建前端"

    cd "$FRONTEND_DIR"

    info "安装前端依赖 (pnpm install)..."

    # 如果启用镜像，配置 npm/pnpm 使用淘宝 registry
    if [ "$USE_MIRROR" = true ]; then
        info "配置 npm/pnpm 使用淘宝镜像源..."
        npm config set registry https://registry.npmmirror.com
        pnpm config set registry https://registry.npmmirror.com 2>/dev/null || true
    fi

    pnpm install --frozen-lockfile 2>/dev/null || pnpm install

    info "构建生产版本..."

    # 设置后端地址：如果指定了 PB_URL 则用之，否则用同源（Nginx 反代）
    if [ -n "$PB_URL" ]; then
        info "使用指定的后端地址: $PB_URL"
        VITE_PB_URL="$PB_URL" pnpm build
    else
        info "未指定后端地址，前端将使用同源请求（由 Nginx 反向代理到 PocketBase）"
        pnpm build
    fi

    if [ -d "$FRONTEND_DIR/dist" ]; then
        info "前端构建完成，输出目录: $FRONTEND_DIR/dist ✓"
        local file_count
        file_count=$(find "$FRONTEND_DIR/dist" -type f | wc -l)
        info "构建产物: $file_count 个文件"
    else
        error "前端构建失败：dist 目录不存在"
        exit 1
    fi

    cd "$SCRIPT_DIR"
}

# ---------- 部署前端到 Nginx ----------
deploy_nginx() {
    if [ "$INSTALL_NGINX" = false ]; then
        return 0
    fi

    section "配置 Nginx"

    # 复制静态文件到 Nginx 托管目录
    local web_root="/var/www/healing"
    info "部署前端文件到 $web_root ..."
    mkdir -p "$web_root"
    cp -r "$FRONTEND_DIR/dist/"* "$web_root/"
    chown -R www-data:www-data "$web_root" 2>/dev/null || chown -R nginx:nginx "$web_root" 2>/dev/null || true

    # 确定 server_name
    local server_name
    if [ -n "$DOMAIN" ]; then
        server_name="$DOMAIN"
    else
        server_name="_"  # 匹配所有
    fi

    # 确保配置目录存在
    mkdir -p "$(dirname "$NGINX_CONF")"

    info "生成 Nginx 配置 ($NGINX_CONF)..."
    cat > "$NGINX_CONF" << EOF
server {
    listen $PORT;
    listen [::]:$PORT;
    server_name $server_name;

    # 上传限制（artwork PNG 截图可能 >1MB，Nginx 默认 1MB 会 413）
    client_max_body_size 20M;

    # 前端静态文件
    root /var/www/healing;
    index index.html;

    # gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # 静态资源缓存（Vite 产物带 hash，可长期缓存）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # PocketBase API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:$PB_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # PocketBase Admin UI + realtime（websocket）
    location /_/ {
        proxy_pass http://127.0.0.1:$PB_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # PocketBase 上传文件访问
    location /api/files/ {
        proxy_pass http://127.0.0.1:$PB_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        client_max_body_size 20M;
    }

    # SPA 回退：所有未匹配的路由返回 index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

    # 启用站点（Debian/Ubuntu 用 symlink，RHEL/CentOS 的 conf.d 自动 include 无需操作）
    if [ -n "$NGINX_LINK" ] && [ ! -L "$NGINX_LINK" ]; then
        ln -s "$NGINX_CONF" "$NGINX_LINK"
    fi

    # 禁用默认站点（避免 80 端口冲突）
    if [ "$PORT" = "80" ] && [ -f "$NGINX_DEFAULT" ]; then
        warn "检测到默认站点配置 $NGINX_DEFAULT，正在禁用..."
        rm -f "$NGINX_DEFAULT"
    fi

    # 测试配置
    info "测试 Nginx 配置..."
    if nginx -t; then
        info "Nginx 配置正确 ✓"
    else
        error "Nginx 配置测试失败，请检查 $NGINX_CONF"
        exit 1
    fi

    # 重启 Nginx
    info "重启 Nginx..."
    systemctl restart nginx || service nginx restart
    systemctl enable nginx 2>/dev/null || true

    info "Nginx 配置完成 ✓"
}

# ---------- 创建 PocketBase 管理员 ----------
create_pb_admin() {
    section "配置 PocketBase 管理员"

    # 如果没有传密码，生成一个随机密码（非交互环境无法手动输入）
    if [ -z "$PB_ADMIN_PASSWORD" ]; then
        warn "未提供管理员密码，生成随机密码..."
        PB_ADMIN_PASSWORD=$(head -c 16 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 16)
        info "生成的管理员密码: $PB_ADMIN_PASSWORD"
        warn "请妥善保存此密码！也可稍后通过 Admin UI 修改"
    fi

    cd "$BACKEND_DIR"
    info "创建/更新管理员账号: $PB_ADMIN_EMAIL"

    # PocketBase superuser upsert 需要直接访问数据库文件，
    # 但 systemd 服务已启动并锁定了数据库。先临时停止服务，创建管理员，再重启。
    if systemctl is-active --quiet healing-pocketbase 2>/dev/null; then
        info "临时停止 PocketBase 服务以创建管理员..."
        systemctl stop healing-pocketbase
        sleep 2
    fi

    pocketbase superuser upsert --dir="$PB_DATA_DIR" "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" 2>&1 || {
        warn "superuser upsert 命令失败"
        warn "可稍后通过 http://<服务器IP>:$PB_PORT/_/ 手动创建管理员"
    }

    # 重新启动 PocketBase 服务
    if ! systemctl is-active --quiet healing-pocketbase 2>/dev/null; then
        info "重新启动 PocketBase 服务..."
        systemctl start healing-pocketbase
        sleep 3
    fi

    cd "$SCRIPT_DIR"
}

# ---------- 配置 PocketBase systemd 服务 ----------
setup_pb_systemd() {
    section "配置 PocketBase systemd 服务"

    local service_file="/etc/systemd/system/healing-pocketbase.service"

    # 创建持久化数据目录（放在 /opt/healing 外，scp rm:true 删不到）
    mkdir -p "$PB_DATA_DIR"

    # 一次性迁移：如果旧位置 backend/pb_data 有数据且新目录为空，搬过去
    # 注意：GitHub Actions 部署时 scp 会先清 /opt/healing，旧数据通常已不在；
    # 这段迁移主要服务于"在服务器上手动重跑 deploy.sh"的场景。
    local old_pb_data="$BACKEND_DIR/pb_data"
    if [ -d "$old_pb_data" ] && [ -n "$(ls -A "$old_pb_data" 2>/dev/null)" ] && [ -z "$(ls -A "$PB_DATA_DIR" 2>/dev/null)" ]; then
        info "检测到旧 pb_data，迁移到持久化位置 $PB_DATA_DIR ..."
        cp -r "$old_pb_data"/. "$PB_DATA_DIR"/ 2>/dev/null || true
        info "迁移完成 ✓"
    fi

    cat > "$service_file" << EOF
[Unit]
Description=Healing PocketBase Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/local/bin/pocketbase serve --http=127.0.0.1:$PB_PORT --origins="*" --dir=$PB_DATA_DIR
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

# 安全限制
NoNewPrivileges=no
ProtectSystem=false

[Install]
WantedBy=multi-user.target
EOF

    info "PocketBase systemd 服务已创建"

    # 停止旧进程
    if pgrep -f "pocketbase serve" &>/dev/null; then
        info "停止正在运行的 PocketBase 进程..."
        pkill -f "pocketbase serve" || true
        sleep 2
    fi

    systemctl daemon-reload
    systemctl enable healing-pocketbase
    systemctl restart healing-pocketbase

    info "PocketBase 服务已启动 ✓"

    # 等待启动
    sleep 3
    if systemctl is-active --quiet healing-pocketbase; then
        info "PocketBase 正在运行 ✓"
    else
        error "PocketBase 启动失败，查看日志: journalctl -u healing-pocketbase -n 50"
        exit 1
    fi
}

# ---------- 配置防火墙 ----------
setup_firewall() {
    section "配置防火墙"

    if command -v ufw &>/dev/null; then
        info "检测到 UFW，开放端口..."
        ufw allow $PORT/tcp    2>/dev/null || true
        ufw allow $PB_PORT/tcp 2>/dev/null || true
        ufw allow 22/tcp       2>/dev/null || true
        info "防火墙规则已添加 (端口 $PORT, $PB_PORT, 22)"
    elif command -v firewall-cmd &>/dev/null; then
        info "检测到 firewalld，开放端口..."
        firewall-cmd --permanent --add-port=$PORT/tcp    2>/dev/null || true
        firewall-cmd --permanent --add-port=$PB_PORT/tcp 2>/dev/null || true
        firewall-cmd --permanent --add-port=22/tcp       2>/dev/null || true
        firewall-cmd --reload 2>/dev/null || true
        info "防火墙规则已添加"
    else
        warn "未检测到防火墙工具 (ufw/firewalld)，跳过防火墙配置"
        warn "请手动确保端口 $PORT 和 $PB_PORT 已开放"
    fi
}

# ---------- 健康检查 ----------
health_check() {
    section "健康检查"

    # 检查 PocketBase
    info "检查 PocketBase..."
    local pb_ok=false
    for i in 1 2 3 4 5; do
        if curl -sf "http://127.0.0.1:$PB_PORT/api/health" &>/dev/null; then
            pb_ok=true
            break
        fi
        sleep 2
    done
    if [ "$pb_ok" = true ]; then
        info "PocketBase API 正常 ✓"
    else
        warn "PocketBase API 未响应（可能仍在启动中）"
    fi

    # 检查 Nginx
    if [ "$INSTALL_NGINX" = true ]; then
        info "检查 Nginx..."
        if systemctl is-active --quiet nginx; then
            info "Nginx 正在运行 ✓"
        else
            warn "Nginx 未运行，请检查: systemctl status nginx"
        fi

        # 检查前端页面
        info "检查前端页面..."
        if curl -sf "http://127.0.0.1:$PORT/" &>/dev/null; then
            info "前端页面可访问 ✓"
        else
            warn "前端页面未响应"
        fi
    fi
}

# ---------- 打印部署信息 ----------
print_summary() {
    section "部署完成"

    # 获取服务器 IP
    local server_ip
    server_ip=$(curl -s ifconfig.me 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "服务器IP")

    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  希音 Healing 部署成功！${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "服务状态:"
    echo -e "  • PocketBase:  ${GREEN}运行中${NC} (端口 $PB_PORT)"
    if [ "$INSTALL_NGINX" = true ]; then
        echo -e "  • Nginx:       ${GREEN}运行中${NC} (端口 $PORT)"
    fi
    echo ""
    echo -e "访问地址:"
    if [ -n "$DOMAIN" ]; then
        echo -e "  • 前端:     ${BLUE}http://$DOMAIN${NC}"
        echo -e "  • 后端 API: ${BLUE}http://$DOMAIN/api/${NC}"
        echo -e "  • 管理后台: ${BLUE}http://$DOMAIN/_/${NC}"
    else
        echo -e "  • 前端:     ${BLUE}http://$server_ip${NC}"
        echo -e "  • 后端 API: ${BLUE}http://$server_ip/api/${NC}"
        echo -e "  • 管理后台: ${BLUE}http://$server_ip/_/${NC}"
    fi
    echo ""
    echo -e "管理账号:"
    echo -e "  • 邮箱: $PB_ADMIN_EMAIL"
    echo -e "  • 密码: ${YELLOW}(你输入的密码)${NC}"
    echo ""
    echo -e "常用命令:"
    echo -e "  • 重启后端:   systemctl restart healing-pocketbase"
    echo -e "  • 重启 Nginx: systemctl restart nginx"
    echo -e "  • 查看后端日志: journalctl -u healing-pocketbase -f"
    echo -e "  • 查看后端状态: systemctl status healing-pocketbase"
    echo ""
    if [ "$INSTALL_NGINX" = true ]; then
        echo -e "${YELLOW}提示: 生产环境建议配置 HTTPS (Let's Encrypt)${NC}"
        echo -e "  sudo apt install certbot python3-certbot-nginx"
        echo -e "  sudo certbot --nginx -d $DOMAIN"
    fi
    echo ""
}

# ============================================================
# 主流程
# ============================================================

section "希音 Healing 部署脚本启动"
info "项目目录: $SCRIPT_DIR"
info "前端目录: $FRONTEND_DIR"
info "后端目录: $BACKEND_DIR"
if [ -n "$DOMAIN" ]; then info "域名: $DOMAIN"; fi
if [ -n "$PB_URL" ]; then info "后端地址: $PB_URL"; else info "后端地址: 同源 (Nginx 反代)"; fi

# 1. 检测环境
detect_pkg_manager

# 1.5 检测是否需要镜像（GitHub 不可达时启用国内镜像）
check_mirror_needed || true

# 2. 安装系统依赖
install_system_deps

# 3. 安装 Node.js
install_node

# 4. 安装 pnpm
install_pnpm

# 5. 安装 PocketBase
install_pocketbase

# 6. 安装 Nginx
install_nginx

# 7. 构建前端
build_frontend

# 8. 配置并启动 PocketBase
setup_pb_systemd

# 9. 创建管理员
create_pb_admin

# 10. 配置 Nginx（反向代理 + 静态托管）
deploy_nginx

# 11. 配置防火墙
setup_firewall

# 12. 健康检查
health_check

# 13. 打印部署信息
print_summary
