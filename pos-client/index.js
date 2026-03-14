// --- DOM refs ---
const connBadge = document.getElementById('connection-status');
const livenessDot = document.getElementById('comm-liveness');
const logContainer = document.getElementById('log-container');
const payBtn = document.getElementById('pay-btn');
const resetBtn = document.getElementById('reset-btn');

// State panels
const screen = document.querySelector('.display-screen');
const stateIdle = document.getElementById('state-idle');
const stateActive = document.getElementById('state-active');
const stateResult = document.getElementById('state-result');

// Active transaction elements
const serviceName = document.getElementById('pos-service-name');
const priceAmount = document.getElementById('pos-price');
const statusChip = document.getElementById('pos-status-text');
const statusMessage = document.getElementById('pos-message');
const billDetails = document.getElementById('bill-details');

// Result elements
const resultIcon = document.getElementById('result-icon');
const resultTitle = document.getElementById('result-title');
const resultTx = document.getElementById('result-tx');

let ws = null;

// --- Logging ---
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.textContent = `[${time}] ${message}`;
    logContainer.prepend(entry);
}

// --- UI State Machine ---
function showPanel(panel) {
    [stateIdle, stateActive, stateResult].forEach(p => p.classList.remove('active'));
    panel.classList.add('active');
}

function setScreenTheme(theme) {
    screen.className = 'display-screen ' + theme;
}

function showIdle() {
    showPanel(stateIdle);
    setScreenTheme('idle');
    payBtn.disabled = true;
}

function showTransaction(svcName, amount, chipClass, chipText, msgText, canPay, details) {
    serviceName.textContent = svcName || 'Unknown Service';
    priceAmount.textContent = amount != null ? parseFloat(amount).toFixed(2) : '0.00';

    statusChip.className = 'status-chip ' + chipClass;
    statusChip.textContent = chipText;
    statusMessage.textContent = msgText;

    // Render bill details if available
    billDetails.innerHTML = '';
    if (details) {
        const items = [
            { label: 'Machine', value: details.machineName || '-' },
            { label: 'Program', value: details.programName || '-' },
            { label: 'Duration', value: `${details.durationMin || 0} mins` }
        ];

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'bill-item';
            div.innerHTML = `
                <span class="bill-item-label">${item.label}</span>
                <span class="bill-item-value">${item.value}</span>
            `;
            billDetails.appendChild(div);
        });
    }

    showPanel(stateActive);
    payBtn.disabled = !canPay;
}

function showResult(success, txId) {
    resultIcon.className = 'result-icon ' + (success ? 'success' : 'error');
    resultIcon.textContent = success ? '✓' : '✕';
    resultTitle.textContent = success ? 'Payment Successful' : 'Payment Failed';
    resultTx.textContent = txId ? `TX: ${txId}` : '';

    setScreenTheme(success ? 'success' : 'error');
    showPanel(stateResult);
    payBtn.disabled = true;
}

// --- Message Handling ---
function handleMessage(data) {
    if (data.type === 'pos_update') {
        const { type, payload } = data.data;

        if (type === 'STATUS_UPDATE') {
            const { status, message, serviceName: svc, amount, details } = payload;
            addLog(`Status: ${status}${message ? ' — ' + message : ''}`, 'info');

            switch (status) {
                case 'IDLE':
                    showIdle();
                    break;
                case 'WAITING_FOR_CARD':
                    setScreenTheme('waiting');
                    showTransaction(svc, amount, 'waiting', 'Waiting for Card', message || 'Please tap or insert your card', true, details);
                    break;
                case 'PROCESSING':
                    setScreenTheme('processing');
                    showTransaction(svc, amount, 'processing', 'Processing...', message || 'Please wait...', false, details);
                    break;
                case 'SUCCESS':
                    setScreenTheme('success');
                    showTransaction(svc, amount, 'success', 'Approved', message || 'Payment complete!', false, details);
                    break;
                case 'FAILED':
                    setScreenTheme('error');
                    showTransaction(svc, amount, 'error', 'Declined', message || 'Transaction failed.', false, details);
                    break;
            }
        } else if (type === 'TRANSACTION_RESULT') {
            const { success, transactionId, error } = payload;
            const msg = success
                ? `Payment approved — TX: ${transactionId}`
                : `Payment declined — ${error || 'Unknown error'}`;
            addLog(msg, success ? 'success' : 'error');
            showResult(success, transactionId);

            // Return to idle after 3s
            setTimeout(showIdle, 3500);
        } else if (type === 'ERROR') {
            addLog(`Error: ${payload.message}`, 'error');
        }
    }
}

// --- WebSocket ---
function connect() {
    addLog('Connecting to backend...', 'warn');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Relative path to hit our own host's proxy
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    addLog(`Target: ${wsUrl}`, 'info');
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        connBadge.textContent = 'Connected';
        connBadge.className = 'status-badge connected';
        livenessDot.className = 'liveness-dot online';
        addLog('Connected to server', 'success');
    };

    ws.onclose = () => {
        connBadge.textContent = 'Disconnected';
        connBadge.className = 'status-badge disconnected';
        livenessDot.className = 'liveness-dot offline';
        addLog('Disconnected — retrying in 3s', 'error');
        setTimeout(connect, 3000);
    };

    ws.onmessage = (event) => {
        try {
            handleMessage(JSON.parse(event.data));
        } catch (e) {
            console.error('Failed to parse message:', event.data);
        }
    };
}

// --- Buttons ---
payBtn.onclick = () => {
    ws.send(JSON.stringify({ type: 'confirmPayment' }));
    addLog('Sent: Confirm Payment (tap)', 'info');
};

resetBtn.onclick = () => {
    ws.send(JSON.stringify({ type: 'posReset' }));
    addLog('Sent: Reset Terminal', 'warn');
    showIdle();
};

connect();
