const statusText = document.getElementById('pos-status-text');
const messageText = document.getElementById('pos-message');
const serviceText = document.getElementById('pos-service-name');
const connBadge = document.getElementById('connection-status');
const livenessDot = document.getElementById('comm-liveness');
const logContainer = document.getElementById('log-container');
const payBtn = document.getElementById('pay-btn');
const resetBtn = document.getElementById('reset-btn');

let ws = null;

function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.textContent = `[${time}] ${message}`;
    logContainer.prepend(entry);
}

function connect() {
    addLog('🔄 Connecting to backend...');
    ws = new WebSocket('ws://localhost:3000/ws');

    ws.onopen = () => {
        connBadge.textContent = 'Connected';
        connBadge.className = 'status-badge connected';
        livenessDot.className = 'liveness-dot online';
        addLog('✅ Connected to server', 'success');
    };

    ws.onclose = () => {
        connBadge.textContent = 'Disconnected';
        connBadge.className = 'status-badge disconnected';
        livenessDot.className = 'liveness-dot offline';
        addLog('❌ Disconnected from server', 'error');
        setTimeout(connect, 3000);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data);
        } catch (e) {
            console.error('Failed to parse message:', event.data);
        }
    };
}

function handleMessage(data) {
    if (data.type === 'pos_update') {
        const { type, payload } = data.data;
        
        if (type === 'STATUS_UPDATE') {
            updateStatus(payload.status, payload.message, payload.serviceName);
            addLog(`Status: ${payload.status} ${payload.message || ''}`, 'info');
        } else if (type === 'TRANSACTION_RESULT') {
            const resultMsg = payload.success ? `SUCCESS (TX: ${payload.transactionId})` : `FAILED: ${payload.error || 'Unknown'}`;
            addLog(`Transaction Result: ${resultMsg}`, payload.success ? 'success' : 'error');
        } else if (type === 'ERROR') {
            addLog(`Error: ${payload.message}`, 'error');
        }
    }
}

function updateStatus(status, message, serviceName) {
    statusText.textContent = status;
    messageText.textContent = message || '---';
    serviceText.textContent = serviceName || '-';

    // Reset UI based on status
    statusText.style.color = 'var(--text-main)';
    payBtn.disabled = true;
    
    switch (status) {
        case 'IDLE':
            statusText.textContent = 'Ready';
            break;
        case 'WAITING_FOR_CARD':
            statusText.style.color = 'var(--waiting-color)';
            payBtn.disabled = false;
            break;
        case 'PROCESSING':
            statusText.style.color = 'var(--primary-color)';
            break;
        case 'SUCCESS':
            statusText.style.color = 'var(--success-color)';
            break;
        case 'FAILED':
            statusText.style.color = 'var(--error-color)';
            break;
    }
}

payBtn.onclick = () => {
    ws.send(JSON.stringify({ type: 'confirmPayment' }));
    addLog('➡️ Sent: Confirm Payment (Tap)');
};

resetBtn.onclick = () => {
    ws.send(JSON.stringify({ type: 'posReset' }));
    addLog('➡️ Sent: Reset Terminal');
};

connect();
