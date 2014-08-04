import socket
import time
import random
import array

UDP_IP = "127.0.0.1"
UDP_PORT = 5690

# set starting message from hex string(taken from actual mote message)
source = bytearray.fromhex("d2110012740013b77d5baaaa0000000000000212740013b77d5b0009405e2d0000630000")

source2 = bytearray.fromhex("d2110013740013b15e4baaaa0000000000000213740013b15e4b0009405e2d0000630000")

seq = 0;

while True:
    seq += 1 # increment seq

    source[26] = (seq >> 8) & 0xFF
    source[27] = (seq & 0xff)
    source[28] = random.randint(70,140) # heart rate
    source[29] = random.randint(96,100) # sp02
    source[30] = random.randint(12,20)  # respiration
    source[33] = random.randint(95,101) # temperature LSB
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.sendto(source, (UDP_IP, UDP_PORT))
    time.sleep(random.randint(2,4))

    source2[26] = (seq >> 8) & 0xFF
    source2[27] = (seq & 0xff)
    source2[28] = random.randint(70,140) # heart rate
    source2[29] = random.randint(96,100) # sp02
    source2[30] = random.randint(12,20)  # respiration
    source2[33] = random.randint(95,101) # temperature LSB
    #sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.sendto(source2, (UDP_IP, UDP_PORT))
    time.sleep(random.randint(2,4))

