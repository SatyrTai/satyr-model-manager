#!/bin/bash

VENV_DIR="$(cd "$(dirname "$0")/../.."; pwd)/venv"
echo "VENV_DIR : $VENV_DIR"

PYTHON="$VENV_DIR/Scripts/Python.exe"
echo "PYTHON   : $PYTHON"

"$PYTHON" main.py

read -p "Press Enter to continue..."