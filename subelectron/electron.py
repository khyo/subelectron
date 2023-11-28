import subprocess
import atexit
import json
import logging
import threading
import traceback
import socket
import time
import sys
import os
import hashlib
from .common import *
import subpack.packages as packages



Handler = typing.Callable[[str, Any], Any]

MAX_ASK_COUNT = 1024


class ResponsePending:
    pass


class IpcError(Exception):
    pass


logger = logging.getLogger(__name__)


class Electron:
    def __init__(self, title: str, version: Optional[str] = None, proj_dir: Optional[Path]=None):
        self.title = title
        self.install = packages.Electron(version=version or packages.Electron.DEFAULT_VERSION)
        self.pmain: subprocess.Popen[bytes] | None = None
        self._handlers: dict[str, Handler] = {}
        self._responses: dict[int, Any] = {}
        self._tlisten: threading.Thread | None = None
        self._cv = threading.Condition()
        self._ask_id = 1
        self.proj_dir = proj_dir or Path.cwd()
        self.cache = packages.Package.SUBPACK_DIR.joinpath('se-cache', f'{self.title}_{hashlib.sha1(str(self.proj_dir).encode()).hexdigest()}')
 
        self.fresh = not self.cache.exists()
        if not self.fresh and "--se-cache-clear" in sys.argv:
            import shutil
            print("removing", self.cache)
            shutil.rmtree(self.cache)
            self.fresh = True
        

        # exit handler
        self._handlers["_exit"] = lambda e, arg: self.close()

    def refresh(self):
        self.fresh = True

    @staticmethod
    def tcp_port_next_free() -> int:
        """ returns an unused TCP port """
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(('', 0))
            return sock.getsockname()[1]
    
    @staticmethod
    def tcp_port_in_use(port: int) -> bool:
        """ if True, tcp port is in use """
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            return sock.connect_ex(('localhost', port)) == 0
                
    @staticmethod
    def childproc(*args: str, stdin=None, stdout=None, stderr=None):
        """ spawn new subprocess that will close when this superior process closes"""
        p = subprocess.Popen(args,
            stdin=stdin,
            stdout=stdout,
            stderr=stderr,
        )
        
        master_pid = [os.getpid()]

        def monitor_child_proc():
            rc = p.wait()
            if (pid := master_pid[0]):
                master_pid[0] = None
                import signal
                os.kill(pid, signal.SIGKILL)

        # def on_master_exit():
        #     if master_pid[0]:
        #         ()
            
        threading.Thread(target=monitor_child_proc, daemon=True).start()
        atexit.register(p.kill)
        return p

    @staticmethod
    def tcp_server_wait(p: subprocess.Popen, port: int, timeout: Optional[float]=2.5, poll_period=0.005) -> int:
        t_start = time.monotonic()

        while p.poll() is None:
            time.sleep(poll_period)
            if Electron.tcp_port_in_use(port):
                return port
            
            if timeout is not None:
                if time.monotonic() - t_start > timeout:
                    break

        raise TimeoutError(f"couldn't start vite dev-server on port: {port}")

    def _url_or_html_to_arg(self, url_or_html: str | Path) -> str:
        s = str(url_or_html)
        
        # handle url
        sl = s.lower()
        if sl.startswith("http:") or sl.startswith("https:") or sl.startswith("plugin:"):
            return s
        
        p = Path(s)
        
        # handle absolute vs project relative paths 
        if p.is_absolute():
            return str(p)
        else:
            return str(self.proj_dir.joinpath(p))
        

    def launch(self, url_or_html: str | Path="index.html", *args: str, wait_port: Optional[int]=None):        
        exe = self.install.ensure_installed()
        if self.fresh:
            self.cache.mkdir(parents=True, exist_ok=True)
        
        # clear out any previous repsonses to our ask-requests
        self._responses.clear()

        # launch the electron main process
        main_js = vars.lib_dir.joinpath("main", "main.js")
        p = self.pmain = self.childproc(
            str(exe),
            str(main_js),
            json.dumps(dict(
                title=self.title,
                cache=str(self.cache),
                fresh=self.fresh,
                wait_port=wait_port,
                load=self._url_or_html_to_arg(url_or_html))),  # options
            *args,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            # stderr=subprocess.PIPE,
        )
        atexit.register(p.kill)

        if p.stdin is None or p.stdout is None:
            raise Exception("Electron process failed to pipe stdin & stdout")

        # start a listening task to monitor for JS events        
        self._tlisten = threading.Thread(target=self._task_listen, daemon=True)
        self._tlisten.start()
    
    def _task_listen(self):
        """ listening task loop """
        responses, handlers, cv = self._responses, self._handlers, self._cv
        while (p := self.pmain):
            line: str = p.stdout.readline()  # type: ignore
            if not line:
                break
            
            try:
                aid, op, arg = json.loads(line)
                
                if aid > 0:
                    # JS send us a response for a request we previously asked
                    with cv:
                        if responses.pop(aid, None) is ResponsePending:
                            if op == "_err":
                                arg = IpcError(arg)
                            responses[aid] = arg
                            logger.info("received response to ask#%d: %s(%s)", aid, op, arg)
                            cv.notify_all()
                        else:
                            logger.warning("unexpected response to ask#%d: %s(%s)", aid, op, arg)
                
                elif aid < 0:
                    # JS asked us a request, and we must respond
                    try:
                        h = handlers[op]
                        resp = h(op, arg)
                        logger.info("responding to ask#%d: %s(%s) -> %s", aid, op, arg, resp)
                        self._tx((aid, op, resp))
                    except Exception as ex:
                        self._tx((aid, "_err", str(ex)))
                        logger.warning("failed to respond to request#%d: %s(%s) -> %s", aid, op, arg, ex)
                        
                else:
                    # JS sent us a one-way event
                    if (h := handlers.get(op)):
                        logger.info("handled event %s(%s)", op, arg)
                        h(op, arg)
                    else:
                        logger.warning("unhandled event: %s(%s)", op, arg)
                

            except Exception as ex:
                logger.error("Unhandled error occured in _task_listen: %s", ex)
                traceback.print_exc()

    def close(self):
        if self.pmain:
            self.pmain.kill()
            self.pmain = None

    def send(self, event: str, arg):
        """
        Send one-way event to Javascript
        @param event: event identifier
        @param arg: any JSON serializable python variable
        """
        self._tx((0, event, arg))
    
    def on(self, event: str, handler: Handler):
        """
        Specify an event handler for one-way event sent from Javascript
        @param event: event identifier
        """
        self._handlers[event] = handler
    
    def cancel(self, event: str) -> Handler | None:
        """
        Cancel an event handler and return the handler if one existed
        @param event: event identifier
        """
        return self._handlers.pop(event, None)
    
    def ask(self, req: str, arg: Any=None, timeout: Optional[float]=None) -> Any:
        """
        Ask Javascript to perform request with arguments, wait for and return the response
        @param req: request method
        @param arg: request arguments
        @param timeout: optional time in seconds after which to throw an exception 
        @return: response of the request
        """
        aid = self.ask_and(req, arg)
        return self.wait_response(aid, timeout)

    def ask_and(self, req: str, arg: Any=None) -> int:
        """
        Ask Javascript to perform request with arguments, and immediately return an indentifier 
        @param req: request method
        @param arg: request arguments
        @return: ask identifier, use this in .get_response() to later retrieve or wait for the response
        """
        aid = self._ask_id
        self._ask_id = aid + 1 if aid < MAX_ASK_COUNT else 1
        self._responses[aid] = ResponsePending
        self._tx((aid, req, arg))
        return aid

    def get_response(self, aid: int) -> ResponsePending | Any:
        resp = self._responses.get(aid, ResponsePending)
        if resp is not ResponsePending:
            if type(resp) == IpcError:
                raise resp
        return resp
        
    def wait_response(self, aid: int, timeout: Optional[float] = None) -> Any:
        cv, responses = self._cv, self._responses
        with cv:
            while True:
                resp = responses.get(aid)
                if resp != ResponsePending:
                    if type(resp) == IpcError:
                        raise resp
                    return resp
                cv.wait(timeout)

    def _tx(self, obj: Any):
        """ ipc xmission """
        p: Any = self.pmain.stdin  # type: ignore
        p.write(json.dumps(obj).encode() + b'\n')
        p.flush()
