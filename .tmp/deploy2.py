#!/usr/bin/env python3
"""SSH deploy using SSH_ASKPASS"""
import subprocess, os, tempfile

# Write password to a temp script
pw_script = '/Users/zz/.easyclaw/workspace/.tmp/pw.sh'
with open(pw_script, 'w') as f:
    f.write('#!/bin/bash\necho X62oeGp70rL1mMN5Bg\n')
os.chmod(pw_script, 0o755)

env = os.environ.copy()
env['SSH_ASKPASS'] = pw_script
env['DISPLAY'] = 'dummy:0'
env['SSH_ASKPASS_REQUIRE'] = 'force'

setsid = '/usr/bin/setsid' if os.path.exists('/usr/bin/setsid') else None

cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=15",
       "-o", "IPQoS=throughput", "-o", "Compression=yes",
       "-c", "aes128-ctr", "-m", "umac-64@openssh.com",
       "root@107.172.157.172",
       "apt-get update -qq 2>&1 | tail -3 && apt-get install -y -qq nodejs npm nginx git 2>&1 | tail -5 && node -v && npm -v && echo DEPLOY-DONE"]

if setsid:
    proc = subprocess.run([setsid, '-w'] + cmd, env=env, capture_output=True, text=True, timeout=120)
else:
    proc = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=120, stdin=subprocess.DEVNULL)

print("STDOUT:", proc.stdout)
print("STDERR:", proc.stderr[-500:] if proc.stderr else "")
print("RC:", proc.returncode)
