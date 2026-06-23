#!/usr/bin/env python3
"""SSH deploy to VPS"""
import pexpect, sys

HOST = "107.172.157.172"
USER = "root"
PASS = "X62oeGp70rL1mMN5Bg"
SSH_OPTS = "-o StrictHostKeyChecking=no -o ConnectTimeout=15 -o IPQoS=throughput -o Compression=yes -c aes128-ctr -m umac-64@openssh.com"

print("Connecting...")
child = pexpect.spawn(f"ssh {SSH_OPTS} {USER}@{HOST}", encoding='utf-8', timeout=60)

i = child.expect(['password:', 'continue connecting', pexpect.TIMEOUT, pexpect.EOF], timeout=25)
if i == 1:
    child.sendline('yes')
    child.expect('password:', timeout=10)
    child.sendline(PASS)
elif i == 0:
    child.sendline(PASS)
else:
    print(f"FAILED: {i} {child.before}")
    sys.exit(1)

i = child.expect(['#', r'\$', 'Permission denied', pexpect.TIMEOUT], timeout=15)
if i >= 2:
    print(f"LOGIN FAILED: {child.before}")
    sys.exit(1)

print("✅ LOGGED IN!")

cmds = [
    "echo '---START---'",
    "apt-get update -qq && apt-get install -y -qq nodejs npm nginx git 2>&1 | tail -5",
    "node -v && npm -v",
    "mkdir -p /opt/moment && echo 'DEPLOY OK'",
]
for cmd in cmds:
    print(f"> {cmd}")
    child.sendline(cmd)
    child.expect(['#', r'\$'], timeout=120)
    print(child.before[-500:] if child.before else "")

print("✅ DONE!")
child.sendline('exit')
child.close()
