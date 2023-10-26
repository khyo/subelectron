import subprocess
import os
import atexit
import json
from pathlib import Path

lib_root = Path(__file__).parent


def launch(url_or_html="index.html"):
    p = subprocess.Popen([
            lib_root.joinpath("electron-v27.0.2", "electron"),
            lib_root.joinpath("main.js"),
            url_or_html
        ],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE
    )
    print({"main": os.getpid(), "inferior": p.pid})
    atexit.register(p.kill)
    if p.stdin is None or p.stdout is None:
        raise Exception("broken pipes")
    
    write = p.stdin.write
    flush = p.stdin.flush

    def send(obj):
        write(json.dumps(obj).encode() + b'\n')
        flush()
    
    while True:
        line = p.stdout.readline()
        if not line:
            break
        aid, op, args = json.loads(line)
        if op == "q":
            break
        try:
            if aid:
                resp = str(args) + "OK"
                send((aid, op, resp))
            else:
                print("received", op, args)
        except:
            pass
        
    # p.wait()
