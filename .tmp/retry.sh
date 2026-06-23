#!/bin/bash
PASS="X62oeGp70rL1mMN5Bg"
HOST="107.172.157.172"
SSHOPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10 -o IPQoS=throughput -o Compression=yes -c aes128-ctr -m umac-64@openssh.com -o PasswordAuthentication=yes -o PubkeyAuthentication=no"

i=0
while true; do
  i=$((i+1))
  echo "[$(date +%H:%M:%S)] Try $i..."
  result=$(/usr/bin/expect << 'EXPECT_EOF'
set timeout 60
log_user 0
spawn ssh {*}$argv root@$env(HOST) {*}$env(CMD)
expect {
  "password:" { send "$env(PASS)\r"; exp_continue }
  "Permission denied" { puts "BADPASS"; exit 1 }
  timeout { puts "TIMEOUT"; exit 2 }
  eof { puts "EOF"; exit 3 }
}
EXPECT_EOF
  )
  ret=$?
  echo "   $result"
  if echo "$result" | grep -q "DEPLOY-SUCCESS"; then
    echo "🎉 DONE!"; exit 0
  fi
  if [ $ret -eq 1 ]; then echo "Wrong password!"; exit 1; fi
  sleep 10
done
