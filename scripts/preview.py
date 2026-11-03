"""Serve one automatically rebuilt standalone preview from this source checkout."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import subprocess
import sys
from threading import Lock
from urllib.parse import unquote

parser = argparse.ArgumentParser()
parser.add_argument("output", nargs="?", type=Path,
                    default=Path(__file__).resolve().parents[1] / "Play Idlewick.html",
                    help="The playable HTML file to keep updated")
parser.add_argument("--port", type=int, default=8765)
parser.add_argument("--host", default="127.0.0.1", help="Use 0.0.0.0 when a cloud preview requires it")
args = parser.parse_args()
output = args.output.resolve()
package = Path(__file__).with_name("package-game.py")
lock = Lock()

def rebuild():
    subprocess.run([sys.executable, str(package), str(output)], check=True, stdout=subprocess.DEVNULL)

class Preview(SimpleHTTPRequestHandler):
    def do_GET(self):
        if unquote(self.path.split("?")[0]) in ("/", "/" + output.name):
            with lock:
                rebuild()
            if self.path == "/":
                self.path = "/" + output.name
        super().do_GET()

rebuild()
server = ThreadingHTTPServer((args.host, args.port), partial(Preview, directory=str(output.parent)))
print(f"Idlewick preview — http://127.0.0.1:{args.port}", flush=True)
server.serve_forever()
