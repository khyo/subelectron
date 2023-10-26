#!/usr/bin/env python3
import argparse, subprocess, os, shutil, platform
from typing import Optional
from pathlib import Path


def sh(cmd, shell=True, **kwargs):
    subprocess.call(cmd, shell=shell, **kwargs)


class vars:
    ori_cwd = Path.cwd()
    proj_dir = ori_cwd
    lib_dir = Path(__file__).parent
    is_linux = "linux" in platform.system().lower()


def make_linux_shortcut(path: Path | str, name, png_file: Optional[Path | str]=None):
    import shortcut
    shortcut.desktopfile(str(path), 
        exec=f'/bin/bash -c "subelectron --cwd=\'{os.getcwd()}\'"', 
        icon=str(png_file or vars.lib_dir.joinpath("default", "icon.png")),
        terminal=False,
        name=name)
    os.chmod(path, 0o777)


def make_windows_shortcut(path: Path | str, ico_file:  Optional[Path | str]=None):
    pythonw = shutil.which("pythonw") or "pythonw"
    import shortcut
    shortcut.lnkfile(str(path),
        target=pythonw,
        arguments='-m "subelectron.cmdline"',
        icon=str(ico_file or vars.lib_dir.joinpath("default", "icon.ico")),
        wd=str(Path.cwd()))


def main():
    parser = argparse.ArgumentParser(description="Electron Subprocess Library")
    args = parser.parse_args()


if __name__ == "__main__":
    main()
