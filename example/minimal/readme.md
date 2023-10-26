# SubElectron Minimal Template

## Overview

Running `app.py` will launch:
- electron browser window that loads index.html
- an IPC channel communicate between Python and the window's Javascript.

And when the app.py Python process exits, the electron processes will also exit.


## Quickstart

```bash
# setup virtualenv
python3 -mvenv .venv
source .venv/bin/activate
pip install https://github.com/khyo/subelectron

# launch the gui
python3 app.py
```
