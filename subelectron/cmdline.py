#!/usr/bin/env python3
import argparse, subprocess, os, shutil
from .common import *
import subpack.shortcut as shortcut


def sh(cmd, shell=True, **kwargs):
    subprocess.call(cmd, shell=shell, **kwargs)


def make_posix_shortcut(path: Path | str, name: str, png_file: Optional[Path | str]=None):
    path = str(path)
    shortcut.desktopfile(
        path, 
        exec=f'/bin/bash -c "subelectron --cwd=\'{os.getcwd()}\'"', 
        icon=str(png_file or vars.lib_dir.joinpath("default", "icon.png")),
        terminal=False,
        name=name
    )
    os.chmod(path, 0o777)


def make_windows_shortcut(path: Path | str, ico_file:  Optional[Path | str]=None):
    pythonw = shutil.which("pythonw") or "pythonw"
    shortcut.lnkfile(
            str(path),
            target=pythonw,
            arguments='-m "subelectron.cmdline"',
            icon=str(ico_file or vars.lib_dir.joinpath("default", "icon.ico")),
            wd=str(Path.cwd())
    )


def main():
    parser = argparse.ArgumentParser(description="Electron Subprocess Library")
    args = parser.parse_args()


if __name__ == "__main__":
    main()
