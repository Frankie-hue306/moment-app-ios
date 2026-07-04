#!/bin/bash
set -e

# ====================================
# Moment App 腾讯云一键部署
# ====================================
# 用法:
#   方式一 (推荐): 配置 SSH key 后直接执行
#     ssh-copy-id root@124.156.163.213
#     bash deploy.sh
#
#   方式二: 通过环境变量传入密码
#     export DEPLOY_PASS="your_password"
#     bash deploy.sh
#
#   方式三: 通过 .deploy.env 文件 (不会被 git 追踪)
#     在项目根目录创建 .deploy.env:
#       DEPLOY_PASS="your_password"
#     bash deploy.sh
# ====================================

VPS="root@124.156.163.213"
SERVER_DIR="/opt/moment"

# ---- 加载密码 ----
# 优先从 .deploy.env 加载（已加入 .gitignore）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/.deploy.env" ]; then
  source "$SCRIPT_DIR/.deploy.env"
fi

# ---- 构建 SSH 命令 ----
# 如果有密码则用 sshpass，否则用 SSH key
if [ -n "$DEPLOY_PASS" ]; then
  # 检查 sshpass 是否可用
  if ! command -v sshpass &> /dev/null; then
    echo "❌ 需要 sshpass，请安装: brew install sshpass"
    exit 1
  fi
  SSH_CMD="sshpass -p $DEPLOY_PASS ssh -o StrictHostKeyChecking=no"
  SCP_CMD="sshpass -p $DEPLOY_PASS scp -o StrictHostKeyChecking=no"
else
  # 尝试 SSH key 认证
  SSH_CMD="ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o BatchMode=yes"
  SCP_CMD="scp -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o BatchMode=yes"
  # 快速测试连接
  if ! $SSH_CMD -o ConnectTimeout=5 "$VPS" "echo ok" &>/dev/null; then
    echo "❌ SSH key 认证失败，请先配置:"
    echo "   ssh-copy-id $VPS"
    echo "   或设置环境变量: export DEPLOY_PASS='your_password'"
    exit 1
  fi
fi

echo "=== Moment App 腾讯云部署 ==="
echo "目标: $VPS"
echo "认证: $([ -n "$DEPLOY_PASS" ] && echo '密码' || echo 'SSH Key')"
echo ""

# 1. 创建目录
echo "[1/6] 创建目录..."
$SSH_CMD "$VPS" "mkdir -p $SERVER_DIR/data/uploads $SERVER_DIR/logs $SERVER_DIR/scripts $SERVER_DIR/public"
echo "  ✅ 目录创建完成"

# 2. 传输服务端代码（使用更安全的 moment/server.js）和前端
echo "[2/6] 传输代码..."
$SCP_CMD "$SCRIPT_DIR/moment-server/json-server.js" "$VPS:$SERVER_DIR/server.js"
$SCP_CMD "$SCRIPT_DIR/moment/index.html" "$VPS:$SERVER_DIR/public/index.html"
$SCP_CMD "$SCRIPT_DIR/moment/manifest.json" "$VPS:$SERVER_DIR/public/manifest.json"
$SCP_CMD "$SCRIPT_DIR/moment/sw.js" "$VPS:$SERVER_DIR/public/sw.js"
$SCP_CMD "$SCRIPT_DIR/moment/starry-world.js" "$VPS:$SERVER_DIR/public/starry-world.js"
$SCP_CMD "$SCRIPT_DIR/moment/privacy.html" "$VPS:$SERVER_DIR/public/privacy.html"
$SCP_CMD "$SCRIPT_DIR/moment/terms.html" "$VPS:$SERVER_DIR/public/terms.html"
echo "  ✅ 代码传输完成"

# 3. 安装依赖
echo "[3/6] 安装依赖..."
$SSH_CMD "$VPS" "cd $SERVER_DIR && npm init -y > /dev/null 2>&1 && npm install express cors 2>&1 | tail -3"
echo "  ✅ 依赖安装完成"

# 4. 迁移旧图片（如果有 db.json）
echo "[4/6] 迁移旧图片..."
$SCP_CMD "$SCRIPT_DIR/moment-server/scripts/migrate-images.js" "$VPS:$SERVER_DIR/scripts/migrate-images.js"
$SSH_CMD "$VPS" "node $SERVER_DIR/scripts/migrate-images.js $SERVER_DIR/data"
echo "  ✅"

# 5. 设置权限
echo "[5/6] 设置权限..."
$SSH_CMD "$VPS" "chmod -R 755 $SERVER_DIR/data/uploads"
echo "  ✅"

# 6. 安装 pm2 并启动
echo "[6/6] 启动服务..."
$SSH_CMD "$VPS" "
  npm install -g pm2 > /dev/null 2>&1
  pm2 delete moment-server 2>/dev/null || true
  pm2 start $SERVER_DIR/server.js --name moment-server
  pm2 save
  pm2 startup 2>/dev/null || true
  echo '  ✅ pm2 已启动'
"
echo ""

# 验证
echo "=== 验证 ==="
sleep 2
$SSH_CMD "$VPS" "curl -s http://localhost:3000/health"
echo ""
echo ""

echo "=== 部署完成 ==="
echo "服务地址: http://124.156.163.213:3000"
echo "健康检查: curl http://124.156.163.213:3000/health"
echo "数据目录: $SERVER_DIR/data/"
