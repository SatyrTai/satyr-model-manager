@echo off

set VENV_DIR=%~dp0%..\..\venv

echo VENV_DIR : %VENV_DIR%

set PYTHON="%VENV_DIR%\Scripts\Python.exe"

echo PYTHON   : %PYTHON%

%PYTHON% main.py

::%PYTHON% main.py --user-data-dir "C:\\"

pause

