#!/usr/bin/env python3
"""Raw SSH - proper sequential exchange"""
import socket, struct, os, time

HOST = "107.172.157.172"

s = socket.socket()
s.settimeout(20)
s.connect((HOST, 22))

# 1. Read banner
banner = s.recv(256).decode().strip()
print(f"Banner: {banner}")

# 2. Send our banner
s.send(b"SSH-2.0-PythonSSH_1.0\r\n")

# 3. Read server KEX init
s.settimeout(10)
try:
    raw = s.recv(4096)
except socket.timeout:
    print("Timeout waiting for server KEX init")
    s.close()
    exit()

if len(raw) < 6:
    print(f"Short KEX data: {len(raw)} bytes")
    s.close()
    exit()

pkt_len = struct.unpack(">I", raw[:4])[0]
pkt_type = raw[5]
print(f"Server KEX: len={pkt_len}, type={pkt_type}")

# 4. Build and send our KEX init
def nl(name):
    return struct.pack(">I", len(name)) + name.encode()

algs = b""
for a in ["curve25519-sha256","rsa-sha2-512","aes128-ctr","aes128-ctr",
           "hmac-sha1","hmac-sha1","none","none","",""]:
    algs += nl(a)

payload = b"\x14" + os.urandom(16) + algs + b"\x00" * 5
block = 8
pad = block - ((1 + len(payload)) % block)
if pad < 4: pad += block
packet = struct.pack(">I", 1 + len(payload) + pad) + bytes([pad]) + payload + b"\x00" * pad

print(f"Sending KEX init ({len(packet)} bytes)...")
s.send(packet)

# 5. Wait for ECDH reply
s.settimeout(20)
try:
    reply = b""
    # Read packet length first
    while len(reply) < 4:
        chunk = s.recv(4 - len(reply))
        if not chunk: break
        reply += chunk

    if len(reply) >= 4:
        total = struct.unpack(">I", reply[:4])[0] + 4
        print(f"Expecting {total} bytes total")
        while len(reply) < total:
            chunk = s.recv(min(4096, total - len(reply)))
            if not chunk: break
            reply += chunk

        if len(reply) >= 6:
            print(f"Reply type: {reply[5]} ({len(reply)} bytes)")
            if reply[5] == 31:
                print("✅ KEX reply received!")
            elif reply[5] == 1:
                print(f"DISCONNECT: {reply[6:200]}")

except socket.timeout:
    print("Timeout waiting for ECDH reply")
except Exception as e:
    print(f"Error: {e}")

s.close()
print("Done")
