#!/usr/bin/env python3
"""Raw SSH - read server data before sending"""
import socket, struct, os, time

HOST = "107.172.157.172"

s = socket.socket()
s.settimeout(15)
s.connect((HOST, 22))

# Read ALL initial data from server (banner + KEX init)
all_data = b""
while True:
    try:
        s.settimeout(2)
        chunk = s.recv(8192)
        if not chunk: break
        all_data += chunk
    except socket.timeout:
        break

s.settimeout(20)

# Parse banner (ends at first \n)
banner_end = all_data.find(b"\n")
banner = all_data[:banner_end].decode().strip()
print(f"Banner: {banner}")

# Rest is SSH packets
pkts = all_data[banner_end+1:]
print(f"Packet data: {len(pkts)} bytes")

if len(pkts) >= 6:
    pkt_len = struct.unpack(">I", pkts[:4])[0]
    pkt_type = pkts[5]
    print(f"Server KEX init: len={pkt_len}, type={pkt_type}")
else:
    print("No KEX init from server yet!")
    s.close()
    exit()

# Now send our stuff
s.send(b"SSH-2.0-PythonSSH_1.0\r\n")

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

# Read ECDH reply
try:
    reply = s.recv(4096)
    if len(reply) >= 6:
        print(f"Reply: {len(reply)} bytes, type={reply[5]}")
        if reply[5] == 31:
            print("✅ KEX EXCHANGE WORKING!")
    else:
        print(f"Short reply: {len(reply)} bytes")
except socket.timeout:
    print("Timeout waiting for ECDH reply")
except Exception as e:
    print(f"Error: {e}")

s.close()
