# SubElectron Bun-Vite Template

## Overview

Everything Bun or Vite related is agnostic to SubElectron.
The only linkage is inside `app.py`

After ensuring Bun is installed on your system you'd be able to
run the vite dev-server via `bun run dev` then open a browser and
connect to it as normal. But instead...

Running `app.py` will launch:
- vite dev server with a new port
- electron browser window connected to the vite-dev server
- an IPC channel communicate between Python and the window's Javascript.

And when the app.py Python process exits, the vite dev-server and electron
processes will also exit.


## Quickstart

```bash
# install node_modules (vite & preact) 
bun install

# setup virtualenv
python3 -mvenv .venv
source .venv/bin/activate
pip install https://github.com/khyo/subelectron

# launch the gui
python3 app.py
```
