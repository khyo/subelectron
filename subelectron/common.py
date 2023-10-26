import platform
from pathlib import Path
from typing import Optional, Any
import typing


class vars:
    is_posix = "linux" in platform.system().lower()
    
    ELECTRON_VERSION = "27.0.2"
    """ The one-true electron version (aka default version) """
    ori_cwd = Path.cwd()
    """ Calling processes's original working directory """
    lib_dir = Path(__file__).parent
    """ Path to the subelectron library files """
    elec_dir = Path.home().joinpath(".config/subelectron" if is_posix else "AppData\\Roaming\\subelectron")
    """ Path to the common electron assets managed by one-or-many subelectron libraries """
