#!/usr/bin/env python3
import sys, logging, time
from subelectron import Electron, ResponsePending


def main():
    print(f"Launched app.py via {sys.executable}: {sys.version}")
    # logging.basicConfig(level=logging.INFO)
    
    e = Electron(title="ExampleApp")

    # Register some event handlers before we launch.
    e.on('js-sourced-event', lambda e, arg: print(f"JS sent an event:", e, arg))
    e.on('ping-python', lambda e, arg: f"python-pong-response")

    def delayed_response(event, arg: float):
        time.sleep(arg)
        return f"done with {event}"
    
    e.on('delayed-response', delayed_response)

    # Launch a new browser window. If Electron isn't available yet, it will be downloaded.
    e.launch("./index.html")

    # Ask many synchronous requests of Javascript as needed.
    while True:
        arg = input("long-process>")
        if arg == "q":
            break
        if not arg.strip():
            continue
        try:
            delay = float(arg)
            resp = e.ask("long-process",delay)
            print("JS responded with:", resp)
        except:
            pass

    # We can close the browser, or if not it will close when Python exits.
    e.close()


if __name__ == "__main__":
    main()
