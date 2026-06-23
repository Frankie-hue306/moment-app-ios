#!/usr/bin/env python3
"""Raw SSH protocol - fixed packet framing"""
import socket, struct, os

HOST = "107.172.157.172"

s = socket.socket()
s.settimeout(20)
print("Connecting...")
s.connect((HOST, 22))

# Read server banner
banner = s.recv(256)
print("Banner:", banner.decode().strip())

# Send our banner
s.send(b"SSH-2.0-PythonSSH_1.0\r\n")

# Read server KEX init (may come with banner or separately)
# Already got some data, but may need more
timeout = s.gettimeout()
s.settimeout(3)
kex_data = b""
while True:
    try:
        chunk = s.recv(4096)
        if not chunk: break
        kex_data += chunk
    except socket.timeout:
        break
s.settimeout(timeout)

if len(kex_data) < 6:
    print(f"Not enough KEX data: {len(kex_data)} bytes")
    s.close()
    exit(1)

print(f"Server KEX data: {len(kex_data)} bytes, type={kex_data[5]}")

# Build our KEX init with CORRECT packet framing
our_cookie = os.urandom(16)

def nl(name):
    return struct.pack(">I", len(name)) + name.encode()

algs = b""
for a in ["curve25519-sha256","rsa-sha2-512","aes128-ctr","aes128-ctr",
           "hmac-sha1","hmac-sha1","none","none","",""]:
    algs += nl(a)

payload = b"\x14" + our_cookie + algs + b"\x00" * 5  # KEX_INIT type=20

# CORRECT padding calculation per RFC 4253:
# total_len = 1 (padlen byte) + len(payload) + pad_len  must be multiple of 8
# pad_len >= 4
block = 8
pad = block - ((1 + len(payload)) % block)
if pad < 4:
    pad += block

plen = 1 + len(payload) + pad
packet = struct.pack(">I", plen) + bytes([pad]) + payload + b"\x00" * pad

print(f"Sending KEX init: len={plen}, pad={pad}")
s.send(packet)

# Wait for ECDH reply (packet type 31)
print("Waiting for ECDH reply...")
reply = b""
s.settimeout(25)
try:
    while len(reply) < 4:
        chunk = s.recv(4096)
        if not chunk: break
        reply += chunk
        if len(reply) >= 4:
            total_len = struct.unpack(">I", reply[:4])[0]
            print(f"Reply packet length: {total_len}")
            if total_len > 100000:
                print("Implausible length, aborting")
                break

    # Read rest of packet
    while len(reply) < 4 + total_len:
        chunk = s.recv(4096)
        if not chunk: break
        reply += chunk

    if len(reply) >= 6:
        pkt_type = reply[5]
        print(f"Reply type: {pkt_type} ({len(reply)} bytes total)")
        if pkt_type == 31:
            print("✅ KEX reply received! SSH working!")
        elif pkt_type == 1:
            print("Got disconnect packet - server rejected us")
            print(reply[6:200])
except socket.timeout:
    print("Timeout waiting for reply")
except Exception as e:
    print(f"Error: {e}")

s.close()
print("Done")
