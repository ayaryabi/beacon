from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import psutil
import time
import threading
import os

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
app.config['SECRET_KEY'] = 'beacon-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Store previous network stats for calculating speed
prev_network = None
prev_network_time = None

def get_cpu_stats():
    """Get CPU usage statistics"""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    cpu_per_core = psutil.cpu_percent(interval=0.1, percpu=True)
    cpu_count = psutil.cpu_count()
    
    return {
        'total': round(cpu_percent, 1),
        'per_core': [round(core, 1) for core in cpu_per_core],
        'count': cpu_count
    }

def get_ram_stats():
    """Get RAM usage statistics"""
    memory = psutil.virtual_memory()
    
    return {
        'percent': round(memory.percent, 1),
        'used_gb': round(memory.used / (1024 ** 3), 2),
        'total_gb': round(memory.total / (1024 ** 3), 2),
        'available_gb': round(memory.available / (1024 ** 3), 2)
    }

def get_network_stats():
    """Get network I/O statistics"""
    global prev_network, prev_network_time
    
    current_network = psutil.net_io_counters()
    current_time = time.time()
    
    if prev_network is None or prev_network_time is None:
        prev_network = current_network
        prev_network_time = current_time
        return {
            'upload_mbps': 0.0,
            'download_mbps': 0.0
        }
    
    time_delta = current_time - prev_network_time
    if time_delta == 0:
        time_delta = 1
    
    # Calculate bytes per second
    upload_speed = (current_network.bytes_sent - prev_network.bytes_sent) / time_delta
    download_speed = (current_network.bytes_recv - prev_network.bytes_recv) / time_delta
    
    # Convert to MB/s
    upload_mbps = round(upload_speed / (1024 ** 2), 2)
    download_mbps = round(download_speed / (1024 ** 2), 2)
    
    prev_network = current_network
    prev_network_time = current_time
    
    return {
        'upload_mbps': upload_mbps,
        'download_mbps': download_mbps
    }

def get_disk_stats():
    """Get disk usage statistics"""
    disk = psutil.disk_usage('/')
    disk_io = psutil.disk_io_counters()
    
    return {
        'percent': round(disk.percent, 1),
        'used_gb': round(disk.used / (1024 ** 3), 2),
        'total_gb': round(disk.total / (1024 ** 3), 2),
        'read_mb': round(disk_io.read_bytes / (1024 ** 2), 2) if disk_io else 0,
        'write_mb': round(disk_io.write_bytes / (1024 ** 2), 2) if disk_io else 0
    }

def get_process_list():
    """Get list of running processes with their stats"""
    processes = []
    
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'memory_percent']):
        try:
            pinfo = proc.info
            processes.append({
                'pid': pinfo['pid'],
                'name': pinfo['name'],
                'cpu_percent': round(pinfo['cpu_percent'] or 0, 1),
                'memory_mb': round(pinfo['memory_info'].rss / (1024 ** 2), 1) if pinfo['memory_info'] else 0,
                'memory_percent': round(pinfo['memory_percent'] or 0, 1)
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    # Sort by CPU usage (descending)
    processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
    
    # Return top 50 processes to avoid overwhelming the frontend
    return processes[:50]

def background_system_stats():
    """Background thread to emit system stats every second"""
    while True:
        try:
            stats = {
                'cpu': get_cpu_stats(),
                'ram': get_ram_stats(),
                'network': get_network_stats(),
                'disk': get_disk_stats(),
                'timestamp': time.time()
            }
            socketio.emit('system_stats', stats)
            time.sleep(1)
        except Exception as e:
            print(f"Error in background_system_stats: {e}")
            time.sleep(1)

def background_process_stats():
    """Background thread to emit process stats every second"""
    while True:
        try:
            processes = get_process_list()
            socketio.emit('process_stats', {'processes': processes, 'timestamp': time.time()})
            time.sleep(1)
        except Exception as e:
            print(f"Error in background_process_stats: {e}")
            time.sleep(1)

@app.route('/')
def index():
    """Serve the main dashboard"""
    return render_template('index.html')

@app.route('/api/kill/<int:pid>', methods=['POST'])
def kill_process(pid):
    """Kill a process by PID"""
    try:
        proc = psutil.Process(pid)
        proc_name = proc.name()
        proc.terminate()
        
        # Wait up to 3 seconds for the process to terminate
        proc.wait(timeout=3)
        
        return jsonify({
            'success': True,
            'message': f'Process {proc_name} (PID: {pid}) terminated successfully'
        })
    except psutil.NoSuchProcess:
        return jsonify({
            'success': False,
            'message': f'Process with PID {pid} not found'
        }), 404
    except psutil.AccessDenied:
        return jsonify({
            'success': False,
            'message': f'Access denied to kill process {pid}. Try running with elevated permissions.'
        }), 403
    except psutil.TimeoutExpired:
        # If terminate doesn't work, try kill
        try:
            proc.kill()
            return jsonify({
                'success': True,
                'message': f'Process {proc_name} (PID: {pid}) forcefully killed'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Failed to kill process: {str(e)}'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error killing process: {str(e)}'
        }), 500

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    emit('connected', {'data': 'Connected to Beacon server'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')

if __name__ == '__main__':
    # Start background threads
    system_thread = threading.Thread(target=background_system_stats, daemon=True)
    process_thread = threading.Thread(target=background_process_stats, daemon=True)
    
    system_thread.start()
    process_thread.start()
    
    print("=" * 60)
    print("🚀 BEACON System Monitor Starting...")
    print("=" * 60)
    print("📊 Dashboard: http://localhost:5001")
    print("🔌 WebSocket: Connected")
    print("=" * 60)
    
    socketio.run(app, host='0.0.0.0', port=5001, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)
