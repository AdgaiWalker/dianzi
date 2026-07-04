#!/bin/bash
set -e

echo "=== NorthStar 部署脚本 ==="

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
    echo "请先设置 POSTGRES_PASSWORD 环境变量"
    exit 1
fi

if [ -z "${JWT_SECRET:-}" ]; then
    echo "请先设置 JWT_SECRET 环境变量"
    exit 1
fi

export DATABASE_URL="${DATABASE_URL:-postgres://postgres:${POSTGRES_PASSWORD}@db:5432/northstar}"

# 1. 安装 pnpm（如果没有）
if ! command -v pnpm &> /dev/null; then
    echo "安装 pnpm..."
    npm install -g pnpm
fi

# 2. 安装依赖
echo "安装项目依赖..."
cd /opt/northstar
pnpm install --frozen-lockfile || pnpm install

# 3. 启动 Docker Compose（镜像构建会完成服务端类型检查和两站前端构建）
echo "启动服务..."
cd /opt/northstar
docker compose up -d --build

# 4. 等待数据库就绪并推送 schema
echo "等待数据库启动..."
sleep 5

echo "推送数据库 schema..."
docker compose exec app npx drizzle-kit push || echo "Schema push 需要手动执行"

echo "=== 部署完成 ==="
echo "全球站: http://$(hostname -I | awk '{print $1}')"
echo "校园站: http://$(hostname -I | awk '{print $1}'):3001"
echo "API: http://$(hostname -I | awk '{print $1}'):4000/api/health"
