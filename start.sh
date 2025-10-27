#!/bin/bash

# Beacon Startup Script
echo "============================================================"
echo "🚀 Starting BEACON System Monitor..."
echo "============================================================"

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: python3 -m venv backend/venv"
    echo "Then run: source backend/venv/bin/activate && pip install -r backend/requirements.txt"
    exit 1
fi

# Activate virtual environment and run
echo "✅ Virtual environment found"
echo "🔌 Starting server..."
echo ""

./venv/bin/python app.py
