import os


def lnkfile(path: str, target: str, arguments:str, icon: str, wd: str):
    import win32com.client
    shell = win32com.client.Dispatch("WScript.Shell")
    shortcut = shell.CreateShortCut(path)
    shortcut.Targetpath = target
    shortcut.IconLocation = icon
    shortcut.Arguments = arguments
    shortcut.WorkingDirectory = wd
    shortcut.save()


def desktopfile(path: str, exec: str, icon: str, terminal = False, name=None):
    if name is None:
        name = os.path.basename(path)[:-len(".desktop")]
    
    with open(path, mode="w") as f:
        f.write(f"""#!/usr/bin/env xdg-open
[Desktop Entry]
Type=Application
Icon={icon}
Exec={exec}
Terminal={str(terminal).lower()}
Name={name}
""")
