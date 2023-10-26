# Copyright (c) 2023 Kyle Howen
# All Rights Reserved.

import os, re, platform
from setuptools import setup


def read(*rnames):
    return open(os.path.join(os.path.dirname(__file__), *rnames)).read()

VERSION = re.findall(r"\d+", read("subelectron", "version.py"))

dependencies = []
if "window" in platform.system().lower():
    dependencies = ["pypiwin32", "pywin32"]


setup(
    name='subelectron',
    version='{}.{}.{}'.format(*VERSION),
    description='Electron Subprocess Manager',
    packages=['subelectron'],
    entry_points = {
        'console_scripts': [
            'subelectron=subelectron.cmdline:main'
        ]},
    install_requires=dependencies,
    include_package_data=True,
    license='UNLICENSED',
    url='https://github.com/khyo/subelectron.git',
    author='Kyle Howen',
    author_email='kyle.howen@subinitial.com',
    keywords="electron subprocess",
    classifiers = [
        'Development Status :: 5 - Production/Stable',
        'Intended Audience :: Developers',
        'License :: Other/Proprietary License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.12',
    ]
)
