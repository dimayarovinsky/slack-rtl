#!/usr/bin/env python3
"""Injects rtl.js into all Slack webviews via the Chrome DevTools Protocol.

Pure stdlib (no pip packages) so it runs on any Mac's system python3.
"""
import base64
import json
import os
import socket
import struct
import sys
import time
from urllib.parse import urlparse
from urllib.request import urlopen

PORT = os.environ.get("SLACK_RTL_PORT", "9222")
DIR = os.path.dirname(os.path.abspath(__file__))
WAIT_SECONDS = 90

with open(os.path.join(DIR, "rtl.js"), encoding="utf-8") as f:
    SRC = f.read()


class WSClient:
    """Minimal WebSocket client, enough for CDP over localhost."""

    def __init__(self, url):
        u = urlparse(url)
        self.sock = socket.create_connection((u.hostname, u.port), timeout=15)
        key = base64.b64encode(os.urandom(16)).decode()
        path = u.path + (("?" + u.query) if u.query else "")
        request = (
            "GET {} HTTP/1.1\r\n"
            "Host: {}:{}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Key: {}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        ).format(path, u.hostname, u.port, key)
        self.sock.sendall(request.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise ConnectionError("websocket handshake failed")
            buf += chunk
        head, _, self.buf = buf.partition(b"\r\n\r\n")
        if b" 101 " not in head.split(b"\r\n", 1)[0]:
            raise ConnectionError("websocket upgrade refused")

    def _read(self, n):
        while len(self.buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise ConnectionError("connection closed")
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def send_text(self, text):
        payload = text.encode()
        length = len(payload)
        header = bytearray([0x81])  # FIN + text frame
        if length < 126:
            header.append(0x80 | length)
        elif length < 65536:
            header.append(0x80 | 126)
            header += struct.pack(">H", length)
        else:
            header.append(0x80 | 127)
            header += struct.pack(">Q", length)
        mask = os.urandom(4)
        header += mask
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        self.sock.sendall(bytes(header) + masked)

    def recv_text(self):
        message = b""
        while True:
            b1, b2 = self._read(2)
            opcode = b1 & 0x0F
            length = b2 & 0x7F
            if length == 126:
                length = struct.unpack(">H", self._read(2))[0]
            elif length == 127:
                length = struct.unpack(">Q", self._read(8))[0]
            if b2 & 0x80:
                mask = self._read(4)
                data = bytes(x ^ mask[i % 4] for i, x in enumerate(self._read(length)))
            else:
                data = self._read(length)
            if opcode == 0x9:  # ping -> pong
                pong = bytearray([0x8A, 0x80 | (len(data) & 0x7F)])
                m = os.urandom(4)
                pong += m + bytes(x ^ m[i % 4] for i, x in enumerate(data))
                self.sock.sendall(bytes(pong))
                continue
            if opcode == 0x8:
                raise ConnectionError("connection closed by peer")
            message += data
            if b1 & 0x80:  # FIN
                return message.decode()

    def close(self):
        try:
            self.sock.close()
        except OSError:
            pass


def list_targets():
    with urlopen("http://127.0.0.1:{}/json/list".format(PORT), timeout=2) as r:
        return json.load(r)


def inject(target):
    ws = WSClient(target["webSocketDebuggerUrl"])
    try:
        commands = [
            ("Page.enable", {}),
            # Survives in-app reloads of this window:
            ("Page.addScriptToEvaluateOnNewDocument", {"source": SRC}),
            # Apply right now:
            ("Runtime.evaluate", {"expression": SRC}),
        ]
        for i, (method, params) in enumerate(commands, start=1):
            ws.send_text(json.dumps({"id": i, "method": method, "params": params}))
        last_id = len(commands)
        deadline = time.time() + 15
        while time.time() < deadline:
            msg = json.loads(ws.recv_text())
            if msg.get("error"):
                raise RuntimeError(msg["error"].get("message", "CDP error"))
            if msg.get("id") == last_id:
                return
        raise TimeoutError("CDP timeout")
    finally:
        ws.close()


def main():
    deadline = time.time() + WAIT_SECONDS
    while time.time() < deadline:
        try:
            targets = list_targets()
        except OSError:
            targets = []  # port not up yet
        pages = [
            t for t in targets
            if t.get("type") == "page" and "app.slack.com" in (t.get("url") or "")
        ]
        if pages:
            ok = 0
            for p in pages:
                try:
                    inject(p)
                    ok += 1
                    print("RTL injected: {}".format(p.get("title") or p.get("url")))
                except (OSError, RuntimeError, TimeoutError) as e:
                    print("Failed on {}: {}".format(p.get("url"), e), file=sys.stderr)
            sys.exit(0 if ok else 1)
        time.sleep(1)
    print("Timed out waiting for a Slack window on the debug port.", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
