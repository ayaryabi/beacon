# 🚀 BEACON - System Monitor Dashboard

A lightweight, real-time system monitoring dashboard with a sleek futuristic UI. Track CPU, RAM, network, disk usage, and running processes with live charts and one-click process management.

## ✨ Features

- **Real-time System Metrics** - Live monitoring with 1-second updates via WebSocket
  - CPU usage (overall + per-core breakdown)
  - RAM usage (GB and percentage)
  - Network I/O (upload/download speeds)
  - Disk usage and statistics

- **Process Management**
  - Live list of top 50 processes sorted by CPU/memory usage
  - Expandable process cards with historical CPU and RAM charts (60-second rolling window)
  - One-click process termination
  - Sort by CPU, Memory, or Name

- **Futuristic UI**
  - Dark glassmorphic design with subtle glow effects
  - Smooth animations and transitions
  - Real-time Chart.js visualizations
  - Responsive and desktop-optimized

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask, Flask-SocketIO, psutil
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Real-time**: WebSocket (Socket.IO)
- **Visualization**: Chart.js

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ayaryabi/beacon.git
   cd beacon
   ```

2. **Set up Python virtual environment**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## 🚀 Usage

1. **Start the server**
   ```bash
   cd beacon/backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python app.py
   ```

2. **Open your browser**
   Navigate to: `http://localhost:5001`

3. **Monitor your system**
   - View real-time system stats in the overview cards
   - Scroll through the process list
   - Click on any process to expand and see historical charts
   - Click the × button to terminate a process (with confirmation)

## 🎨 UI Preview

```
┌─────────────────────────────────────────────────────────┐
│  BEACON                                      [Connected] │
└─────────────────────────────────────────────────────────┘

       SYSTEM OVERVIEW
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   CPU    │ │   RAM    │ │ NETWORK  │ │   DISK   │
│  67.3%   │ │ 12.4 GB  │ │↓ 2.3 MB/s│ │   82%    │
│ [chart]  │ │ [chart]  │ │↑ 0.8 MB/s│ │ [chart]  │
└──────────┘ └──────────┘ │ [chart]  │ └──────────┘
                          └──────────┘

       TOP PROCESSES
┌────────────────────────────────────────────────┐
│ ▸ Chrome    PID: 1234  CPU: 45%  RAM: 3.2 GB [×]│
│ ▾ VS Code   PID: 5678  CPU: 22%  RAM: 1.8 GB [×]│
│   ┌──────────────┐  ┌──────────────┐          │
│   │ CPU History  │  │ RAM History  │          │
│   └──────────────┘  └──────────────┘          │
└────────────────────────────────────────────────┘
```

## 🔧 Configuration

The server runs on `localhost:5001` by default. To change:
- Edit `app.py` line with `socketio.run(app, host='0.0.0.0', port=5001)`

**Note**: Port 5000 is often used by macOS AirPlay Receiver. If you want to use port 5000, disable AirPlay Receiver in System Settings → General → AirDrop & Handoff.

## 🐛 Troubleshooting

- **Permission Denied when killing process**: Some system processes require elevated permissions. Run with sudo if needed (not recommended for regular use)
- **WebSocket connection fails**: Check if port 5000 is available and not blocked by firewall
- **Charts not loading**: Ensure you have internet connection for CDN resources (Chart.js, Socket.IO)

## 📝 License

MIT License - feel free to use this project for any purpose!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 🙏 Acknowledgments

- Built with [Flask](https://flask.palletsprojects.com/)
- Real-time data with [Socket.IO](https://socket.io/)
- System monitoring via [psutil](https://github.com/giampaolo/psutil)
- Charts powered by [Chart.js](https://www.chartjs.org/)

---

Made with ⚡ by [Arian Yaryabi](https://github.com/ayaryabi)
