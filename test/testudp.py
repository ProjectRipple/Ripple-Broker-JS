import socket
import time
import random
import array

UDP_IP = "127.0.0.1"
UDP_PORT = 5690

# set starting message from hex string(taken from actual mote message)
source = bytearray.fromhex("d2110012740013b77d5baaaa0000000000000212740013b77d5b0009405e2d0000630000")

seq = 0;

while True:
    seq += 1 # increment seq
    source[26] = (seq >> 8) & 0xFF
    source[27] = (seq & 0xff)
    source[28] = random.randint(50,140) # heart rate
    source[29] = random.randint(85,100) # sp02
    source[33] = random.randint(90,100) # temperature LSB
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.sendto(source, (UDP_IP, UDP_PORT))
    time.sleep(2)	
