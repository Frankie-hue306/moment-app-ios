#!/bin/bash
set -e

# ====================================
# Moment App v279 腾讯云一键部署
# ====================================
# 用法: 在本机执行 bash deploy.sh
# 前提: 已经有 sshpass 或 expect
# ====================================

VPS="root@81.70.102.36"
PASS="Zp123789@"
SERVER_DIR="/opt/moment"

echo "=== Moment App v279 腾讯云部署 ==="
echo "目标: $VPS"
echo ""

# 1. 创建目录
echo "[1/6] 创建目录..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$VPS" "mkdir -p $SERVER_DIR/data/uploads $SERVER_DIR/logs $SERVER_DIR/scripts"
echo "  ✅ 目录创建完成"

# 2. 传输服务端代码和前端
echo "[2/6] 传输代码..."
BASEDIR="$(cd "$(dirname "$0")" && pwd)"
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no "$BASEDIR/moment-server/json-server.js" "$VPS:$SERVER_DIR/server.js"
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no "$BASEDIR/moment/index.html" "$VPS:$SERVER_DIR/public/index.html"
echo "  ✅ 代码传输完成"

# 3. 安装依赖
echo "[3/6] 安装依赖..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$VPS" "cd $SERVER_DIR && npm init -y > /dev/null 2>&1 && npm install express cors 2>&1 | tail -3"
echo "  ✅ 依赖安装完成"

# 4. 迁移旧图片（如果有 db.json）
echo "[4/6] 迁移旧图片..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$VPS" "node -e '
const fs=require(\"fs\"),p=require(\"path\");
const DATA=\"'"$SERVER_DIR\"'/data\";
const dbPath=p.join(DATA,\"db.json\");
if(!fs.existsSync(dbPath)){console.log(\"  无 db.json，跳过\");process.exit(0)}
const db=JSON.parse(fs.readFileSync(dbPath,\"utf8\"));
const uploads=p.join(DATA,\"uploads\");
let migrated=0;
db.moments.forEach(function(m){
  if(m.imagePath&&m.imagePath.startsWith(\"/uploads/\"))return;
  if(!m.dataUrl||!m.dataUrl.includes(\"base64,\"))return;
  var match=m.dataUrl.match(/^data:image\\/(\\w+);base64,(.+)$/);
  if(!match)return;
  var ext=match[1]===\"png\"?\"png\":\"jpg\";
  var buf=Buffer.from(match[2],\"base64\");
  var name=require(\"crypto\").randomBytes(8).toString(\"hex\")+\".\"+ext;
  fs.writeFileSync(p.join(uploads,name),buf);
  m.imagePath=\"/uploads/\"+name;
  delete m.dataUrl;
  migrated++;
});
if(migrated>0){
  fs.writeFileSync(dbPath,JSON.stringify(db,null,2));
  console.log(\"  ✅ 迁移了 \"+migrated+\" 张旧图片\");
}else{
  console.log(\"  无需迁移\");
}
'"
echo "  ✅"

# 5. 设置权限
echo "[5/6] 设置权限..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$VPS" "chmod -R 755 $SERVER_DIR/data/uploads"
echo "  ✅"

# 6. 安装 pm2 并启动
echo "[6/6] 启动服务..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$VPS" "
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
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$VPS" "curl -s http://localhost:3000/health"
echo ""
echo ""

echo "=== 部署完成 ==="
echo "服务地址: http://81.70.102.36:3000"
echo "健康检查: curl http://81.70.102.36:3000/health"
echo "数据目录: $SERVER_DIR/data/"
