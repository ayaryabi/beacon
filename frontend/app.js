// WebSocket connection
const socket = io();

// Chart configurations
const chartConfig = {
    type: 'line',
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                display: false
            },
            y: {
                display: false,
                min: 0,
                max: 100
            }
        },
        elements: {
            line: {
                borderWidth: 2,
                tension: 0.4
            },
            point: {
                radius: 0
            }
        },
        animation: {
            duration: 300
        }
    }
};

// Chart instances
let cpuChart, ramChart, networkChart, diskChart;
let processCharts = {};

// Data buffers (60 seconds of data)
const MAX_DATA_POINTS = 60;
const chartData = {
    cpu: [],
    ram: [],
    networkDown: [],
    networkUp: [],
    disk: []
};

// Process data history
const processHistory = {};

// Current sort method
let currentSort = 'cpu';

// Initialize charts
function initCharts() {
    // CPU Chart
    cpuChart = new Chart(document.getElementById('cpu-chart'), {
        ...chartConfig,
        data: {
            labels: Array(MAX_DATA_POINTS).fill(''),
            datasets: [{
                data: chartData.cpu,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                fill: true
            }]
        }
    });

    // RAM Chart
    ramChart = new Chart(document.getElementById('ram-chart'), {
        ...chartConfig,
        data: {
            labels: Array(MAX_DATA_POINTS).fill(''),
            datasets: [{
                data: chartData.ram,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                fill: true
            }]
        }
    });

    // Network Chart (Download and Upload)
    networkChart = new Chart(document.getElementById('network-chart'), {
        ...chartConfig,
        data: {
            labels: Array(MAX_DATA_POINTS).fill(''),
            datasets: [
                {
                    data: chartData.networkDown,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: true
                },
                {
                    data: chartData.networkUp,
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    fill: true
                }
            ]
        }
    });

    // Disk Chart
    diskChart = new Chart(document.getElementById('disk-chart'), {
        ...chartConfig,
        data: {
            labels: Array(MAX_DATA_POINTS).fill(''),
            datasets: [{
                data: chartData.disk,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                fill: true
            }]
        }
    });
}

// Update chart data
function updateChartData(dataArray, newValue) {
    dataArray.push(newValue);
    if (dataArray.length > MAX_DATA_POINTS) {
        dataArray.shift();
    }
}

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to Beacon server');
    updateConnectionStatus(true);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
});

socket.on('system_stats', (data) => {
    updateSystemStats(data);
});

socket.on('process_stats', (data) => {
    updateProcessList(data.processes);
});

// Update connection status
function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (connected) {
        statusDot.style.background = '#00d4ff';
        statusText.textContent = 'Connected';
    } else {
        statusDot.style.background = '#ff4757';
        statusText.textContent = 'Disconnected';
    }
}

// Update system stats
function updateSystemStats(data) {
    // CPU
    document.getElementById('cpu-value').textContent = `${data.cpu.total}%`;
    document.getElementById('cpu-cores').textContent = `${data.cpu.count} cores`;
    updateChartData(chartData.cpu, data.cpu.total);
    cpuChart.update('none');

    // RAM
    document.getElementById('ram-value').textContent = `${data.ram.used_gb} GB`;
    document.getElementById('ram-percent').textContent = `${data.ram.percent}% of ${data.ram.total_gb} GB`;
    updateChartData(chartData.ram, data.ram.percent);
    ramChart.update('none');

    // Network
    document.getElementById('network-download').textContent = `${data.network.download_mbps} MB/s`;
    document.getElementById('network-upload').textContent = `${data.network.upload_mbps} MB/s`;
    const maxNetworkSpeed = Math.max(data.network.download_mbps, data.network.upload_mbps, 1);
    updateChartData(chartData.networkDown, (data.network.download_mbps / maxNetworkSpeed) * 100);
    updateChartData(chartData.networkUp, (data.network.upload_mbps / maxNetworkSpeed) * 100);
    networkChart.update('none');

    // Disk
    document.getElementById('disk-value').textContent = `${data.disk.percent}%`;
    document.getElementById('disk-space').textContent = `${data.disk.used_gb} GB / ${data.disk.total_gb} GB`;
    updateChartData(chartData.disk, data.disk.percent);
    diskChart.update('none');
}

// Update process list
function updateProcessList(processes) {
    // Sort processes
    sortProcesses(processes);

    const processListEl = document.getElementById('process-list');
    
    // Get currently expanded process IDs
    const expandedPids = Array.from(document.querySelectorAll('.process-item.expanded'))
        .map(item => parseInt(item.dataset.pid));

    // Update process history for expanded processes
    expandedPids.forEach(pid => {
        const proc = processes.find(p => p.pid === pid);
        if (proc) {
            if (!processHistory[pid]) {
                processHistory[pid] = { cpu: [], memory: [] };
            }
            updateChartData(processHistory[pid].cpu, proc.cpu_percent);
            updateChartData(processHistory[pid].memory, proc.memory_percent);
        }
    });

    // Clear and rebuild list
    processListEl.innerHTML = '';
    
    processes.forEach(proc => {
        const processItem = createProcessItem(proc);
        processListEl.appendChild(processItem);
        
        // Restore expanded state
        if (expandedPids.includes(proc.pid)) {
            processItem.classList.add('expanded');
            updateProcessCharts(proc.pid);
        }
    });
}

// Sort processes
function sortProcesses(processes) {
    switch (currentSort) {
        case 'cpu':
            processes.sort((a, b) => b.cpu_percent - a.cpu_percent);
            break;
        case 'memory':
            processes.sort((a, b) => b.memory_percent - a.memory_percent);
            break;
        case 'name':
            processes.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
}

// Create process item element
function createProcessItem(proc) {
    const item = document.createElement('div');
    item.className = 'process-item';
    item.dataset.pid = proc.pid;
    
    item.innerHTML = `
        <div class="process-main">
            <div class="process-name">
                <span class="expand-icon">▸</span>
                ${escapeHtml(proc.name)}
            </div>
            <div class="process-pid">PID: ${proc.pid}</div>
            <div class="process-stat">CPU: ${proc.cpu_percent}%</div>
            <div class="process-stat">RAM: ${proc.memory_mb} MB</div>
            <button class="kill-btn" onclick="killProcess(${proc.pid}, event)">×</button>
        </div>
        <div class="process-charts">
            <div class="process-chart">
                <div class="process-chart-title">CPU History (60s)</div>
                <div class="process-chart-container">
                    <canvas id="process-cpu-${proc.pid}"></canvas>
                </div>
            </div>
            <div class="process-chart">
                <div class="process-chart-title">Memory History (60s)</div>
                <div class="process-chart-container">
                    <canvas id="process-memory-${proc.pid}"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Toggle expansion on click
    item.querySelector('.process-main').addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            toggleProcessExpansion(proc.pid);
        }
    });
    
    return item;
}

// Toggle process expansion
function toggleProcessExpansion(pid) {
    const item = document.querySelector(`.process-item[data-pid="${pid}"]`);
    item.classList.toggle('expanded');
    
    if (item.classList.contains('expanded')) {
        // Initialize history if needed
        if (!processHistory[pid]) {
            processHistory[pid] = { cpu: [], memory: [] };
        }
        // Create charts
        createProcessCharts(pid);
    } else {
        // Cleanup charts
        if (processCharts[pid]) {
            processCharts[pid].cpu.destroy();
            processCharts[pid].memory.destroy();
            delete processCharts[pid];
        }
    }
}

// Create process charts
function createProcessCharts(pid) {
    const cpuCanvas = document.getElementById(`process-cpu-${pid}`);
    const memoryCanvas = document.getElementById(`process-memory-${pid}`);
    
    if (!cpuCanvas || !memoryCanvas) return;
    
    const history = processHistory[pid] || { cpu: [], memory: [] };
    
    processCharts[pid] = {
        cpu: new Chart(cpuCanvas, {
            ...chartConfig,
            data: {
                labels: Array(MAX_DATA_POINTS).fill(''),
                datasets: [{
                    data: history.cpu,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: true
                }]
            }
        }),
        memory: new Chart(memoryCanvas, {
            ...chartConfig,
            data: {
                labels: Array(MAX_DATA_POINTS).fill(''),
                datasets: [{
                    data: history.memory,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: true
                }]
            }
        })
    };
}

// Update process charts
function updateProcessCharts(pid) {
    if (processCharts[pid] && processHistory[pid]) {
        processCharts[pid].cpu.data.datasets[0].data = processHistory[pid].cpu;
        processCharts[pid].memory.data.datasets[0].data = processHistory[pid].memory;
        processCharts[pid].cpu.update('none');
        processCharts[pid].memory.update('none');
    }
}

// Kill process
async function killProcess(pid, event) {
    event.stopPropagation();
    
    if (!confirm(`Are you sure you want to kill process ${pid}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/kill/${pid}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`Process ${pid} killed successfully`);
            // Remove from history
            delete processHistory[pid];
            if (processCharts[pid]) {
                processCharts[pid].cpu.destroy();
                processCharts[pid].memory.destroy();
                delete processCharts[pid];
            }
        } else {
            alert(`Failed to kill process: ${result.message}`);
        }
    } catch (error) {
        console.error('Error killing process:', error);
        alert('Failed to kill process. Check console for details.');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sort dropdown handler
document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    initCharts();
    console.log('Beacon dashboard initialized');
});
