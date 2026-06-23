#!/usr/bin/env python3
"""Raw SSH connection using subprocess with pty"""
import subprocess
import sys
import os
import pty
import select

HOST = "107.172.157.172"
USER = "root"
PASS = "ao2Ee1AQ0F9qr7y8NS"

# Use expect-like approach with pty
master_fd, slave_fd = pty.openpty()

proc = subprocess.Popen(
    ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10",
     "-o", "IPQoS=throughput", "-c", "aes128-ctr", "-m", "hmac-sha1",
     "-o", "PubkeyAuthentication=no", "-o", "PreferredAuthentications=password",
     f"{USER}@{HOST}", "echo DEPLOY-READY && hostnamectl"],
    stdin=slave_fd, stdout=slave_fd, stderr=slave_fd,
    bufsize=0, close_fds=True
)
os.close(slave_fd)

output = b""
timeout = 30
import time
start = time.time()

while True:
    if time.time() - start > timeout:
        print("TIMEOUT")
        break
    r, w, e = select.select([master_fd], [], [], 1.0)
    if r:
        try:
            data = os.read(master_fd, 4096)
            if not data:
                break
            output += data
            text = data.decode('utf-8', errors='replace')
            print(repr(text))
            if 'password:' in text.lower():
                os.write(master_fd, (PASS + "\n").encode())
                print(">>> SENT PASSWORD")
            if 'DEPLOY-READY' in text:
                print("\n✅ CONNECTED!")
                break
            if 'Permission denied' in text:
                print("\n❌ Password rejected")
                break
        except OSError:
            break

os.close(master_fd)
proc.terminate()
print("\n=== FULL OUTPUT ===")
print(output.decode('utf-8', errors='replace')[-2000:])
