#!/bin/bash
# 飞书专家群自动回复监听器
# 每30秒检查两个专家群是否有新消息，有则通知主 session 处理

STOCK_GROUP="oc_09471338d68f90a1f6437c916884c8c8"
SHOP_GROUP="oc_405a661b5fc7456a0eb5587d18330c4e"
USER_ID="ou_d58d638f58cc3d914e6d311c8660a58f"
LAST_CHECK_FILE="/tmp/feishu_group_last_check"

mkdir -p /tmp

while true; do
  NOW=$(date +%s)
  LAST=$([ -f "$LAST_CHECK_FILE" ] && cat "$LAST_CHECK_FILE" || echo 0)
  echo $NOW > "$LAST_CHECK_FILE"

  for CHAT_ID in "$STOCK_GROUP" "$SHOP_GROUP"; do
    NEW_MSG=$(lark-cli im +chat-messages-list --chat-id "$CHAT_ID" --as user --format json --page-size 3 2>/dev/null | \
      python3 -c "
import json, sys
data = json.load(sys.stdin)
if not data.get('ok'): 
    sys.exit(0)
items = data.get('data',{}).get('items',[])
for m in items:
    s = m.get('sender',{}).get('id','')
    if s != '$USER_ID':
        continue
    ct = m.get('create_time','')
    # 只检查最近60秒且不是post（系统通知）
    mt = m.get('msg_type','text')
    body = (m.get('body',{}).get('content','') or '')[:500]
    if not body.strip():
        continue
    print(json.dumps({'chat_id':'$CHAT_ID','msg_type':mt,'body':body,'create_time':ct},ensure_ascii=False))
")

    if [ -n "$NEW_MSG" ]; then
      # 通知主 session
      echo "$NEW_MSG" >> /tmp/feishu_group_pending
    fi
  done

  # 检查是否有待处理消息
  if [ -f /tmp/feishu_group_pending ] && [ -s /tmp/feishu_group_pending ]; then
    MSG_CONTENT=$(cat /tmp/feishu_group_pending)
    rm /tmp/feishu_group_pending
    
    # 写入信号文件
    echo "$MSG_CONTENT" > /tmp/feishu_group_signal
  fi

  sleep 30
done
