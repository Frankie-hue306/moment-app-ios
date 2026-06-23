#!/usr/bin/env python3
"""Raw SSH protocol implementation to bypass broken system SSH"""
import socket, struct, os, time

HOST = "107.172.157.172"
PASS = "4v8Bzr9W75VPV6jyFj"

s = socket.socket()
s.settimeout(20)
print("Connecting...")
s.connect((HOST, 22))

banner = s.recv(256)
print("Banner:", banner.decode().strip())

s.send(b"SSH-2.0-PythonSSH_1.0\r\n")
raw = s.recv(4096)
print(f"Server KEX init: {len(raw)} bytes received")

# Build our KEX init
our_cookie = os.urandom(16)

def nl(name): return struct.pack(">I", len(name)) + name.encode()

algs = b""
for a in ["curve25519-sha256","rsa-sha2-512","aes128-ctr","aes128-ctr",
           "hmac-sha1","hmac-sha1","none","none","",""]:
    algs += nl(a)

payload = b"\x14" + our_cookie + algs + b"\x00" * 5
pl = len(payload)
pad = 8 - ((pl + 5) % 8)
if pad < 4: pad += 8
packet = struct.pack(">I", pl + pad + 1) + bytes([pad]) + payload + b"\x00" * pad
s.send(packet)

print("KEX init sent, waiting for reply...")
raw2 = s.recv(8192)
print(f"Reply: {len(raw2)} bytes, type={raw2[5]}")

# KEX reply = 31 (0x1f)
if raw2[5] == 31:
    print("Got KEX reply! SSH protocol working!")
else:
    print(f"Unexpected packet type: {raw2[5]}")

s.close()
print("Done")
