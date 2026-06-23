#!/bin/bash
PASS="4v8Bzr9W75VPV6jyFj"
HOST="107.172.157.172"
LOG="/Users/zz/.easyclaw/workspace/.tmp/deploy_result.txt"

echo "Starting deployment attempts at $(date)" > $LOG

attempt=0
while true; do
  attempt=$((attempt + 1))
  echo "[$(date +%H:%M:%S)] Attempt $attempt" | tee -a $LOG

  /usr/bin/expect << 'EXPECT_EOF' 2>&1 | tee -a /Users/zz/.easyclaw/workspace/.tmp/deploy_result.txt
set timeout 12
log_user 0
spawn ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=6 -o PasswordAuthentication=yes -o PubkeyAuthentication=no -o PreferredAuthentications=password root@107.172.157.172 "id && echo '===INSTALL===' && apt-get update -qq 2>&1 | tail -2 && apt-get install -y -qq nodejs npm nginx git 2>&1 | tail -5 && node -v && npm -v && echo '===DEPLOY-COMPLETE==='"
expect {
  -re "assword:" { send "4v8Bzr9W75VPV6jyFj\r"; exp_continue }
  "===DEPLOY-COMPLETE===" { puts "\n✅✅✅ DEPLOY SUCCESS ✅✅✅"; exit 0 }
  "===INSTALL===" { puts "\nConnected, installing..."; exp_continue }
  timeout { puts "T" }
  eof { puts "E" }
}
exit 1
EXPECT_EOF

  ret=$?
  if [ $ret -eq 0 ]; then
    echo "🎉🎉🎉 DEPLOYMENT COMPLETE at $(date)!!!" | tee -a $LOG
    exit 0
  fi

  sleep 5
done
