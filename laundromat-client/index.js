// laundromat index.js

let machines = [];
let programs = [];
let ws = null;
let selectedMachine = null;
let selectedProgram = null;

const machineGrid = document.getElementById('machine-grid');
const commDot = document.getElementById('comm-dot');
const commText = document.getElementById('comm-text');
const modal = document.getElementById('modal-container');
const optionsGrid = document.getElementById('program-options');
const startBtn = document.getElementById('start-machine-btn');

async function init() {
    await fetchMachines();
    await fetchPrograms();
    renderMachines();
    connect();
}

async function fetchMachines() {
    try {
        const res = await fetch('http://localhost:3000/machines');
        machines = await res.json();
    } catch (e) {
        console.error('Failed to fetch machines', e);
    }
}

async function fetchPrograms() {
    try {
        const res = await fetch('http://localhost:3000/programs');
        programs = await res.json();
    } catch (e) {
        console.error('Failed to fetch programs', e);
        // Fallback for demo if DB is empty/fetch fails
        programs = [
            { id: 1, name: 'Quick Wash', type: 'WASHER', durationMin: 30, price: 4.50 },
            { id: 5, name: 'High Temp Dry', type: 'DRYER', durationMin: 45, price: 4.00 }
        ];
    }
}

function connect() {
    ws = new WebSocket('ws://localhost:3000/ws');
    
    ws.onopen = () => {
        commDot.className = 'dot online';
        commText.innerText = 'Online';
    };

    ws.onclose = () => {
        commDot.className = 'dot offline';
        commText.innerText = 'Offline';
        setTimeout(connect, 3000);
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'machine_update') {
            updateMachineUI(data.data);
        }
    };
}

function renderMachines() {
    machineGrid.innerHTML = '';
    machines.sort((a,b) => a.id - b.id).forEach(machine => {
        const card = document.createElement('div');
        card.className = 'machine-card';
        card.id = `machine-${machine.id}`;
        card.innerHTML = `
            <div class="machine-header">
                <span class="machine-type">${machine.type}</span>
                <span class="machine-name">#${machine.id}</span>
            </div>
            <div class="machine-status status-${machine.status}">${machine.status}</div>
            <div class="timer" id="timer-${machine.id}">--:--</div>
            <button class="action-btn" onclick="openBooking(${machine.id})">Book Now</button>
        `;
        machineGrid.appendChild(card);
    });
}

function updateMachineUI(data) {
    const { machineId, status, remainingTime } = data;
    const card = document.getElementById(`machine-${machineId}`);
    if (!card) return;

    const statusEl = card.querySelector('.machine-status');
    statusEl.className = `machine-status status-${status}`;
    statusEl.innerText = status;

    const timerEl = document.getElementById(`timer-${machineId}`);
    if (status === 'BUSY' && remainingTime > 0) {
        const mins = Math.floor(remainingTime / 60);
        const secs = remainingTime % 60;
        timerEl.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
        timerEl.innerText = '--:--';
    }

    const btn = card.querySelector('.action-btn');
    btn.disabled = status === 'BUSY';
}

window.openBooking = (id) => {
    selectedMachine = machines.find(m => m.id === id);
    selectedProgram = null;
    startBtn.disabled = true;
    
    document.getElementById('modal-title').innerText = `Configure ${selectedMachine.name}`;
    
    optionsGrid.innerHTML = '';
    programs.filter(p => p.type === selectedMachine.type).forEach(p => {
        const opt = document.createElement('div');
        opt.className = 'option-card';
        opt.innerHTML = `
            <div>
                <strong>${p.name}</strong>
                <div style="font-size: 0.7rem; color: var(--text-muted)">${p.durationMin} min</div>
            </div>
            <div class="price">$${p.price.toFixed(2)}</div>
        `;
        opt.onclick = () => {
            document.querySelectorAll('.option-card').forEach(el => el.classList.remove('selected'));
            opt.classList.add('selected');
            selectedProgram = p;
            startBtn.disabled = false;
        };
        optionsGrid.appendChild(opt);
    });

    modal.classList.remove('hidden');
};

document.getElementById('close-modal').onclick = () => modal.classList.add('hidden');

startBtn.onclick = async () => {
    if (!selectedMachine || !selectedProgram) return;

    // Trigger POS Payment first?
    // User said: "initiate payment" is FE responsibility.
    // Flow: Initiate POS Transaction -> On POS Success -> Start Machine.
    
    startBtn.innerText = 'Awaiting Payment...';
    startBtn.disabled = true;

    // 1. Trigger POS
    try {
        const posRes = await fetch(`http://localhost:3000/trigger-pos?amount=${selectedProgram.price}&serviceName=${selectedMachine.name} - ${selectedProgram.name}`);
        const posData = await posRes.json();
        
        if (posData.success) {
            // Ideally we'd wait for a WebSocket message confirming payment success
            // For now, let's just show a message or assume we wait.
            // In a real flow, we'd listen for the TRANSACTION_RESULT on the WS.
            alert('Please complete payment at the POS Terminal');
            
            // Note: In this simulation, we'll wait for the user to click "Pay" on the POS UI.
            // We need a way to know when payment is done.
            // I'll add a listener for TRANSACTION_RESULT in index.js
        }
    } catch (e) {
        console.error('POS Trigger failed', e);
        startBtn.innerText = 'Start Machine';
        startBtn.disabled = false;
    }
};

// Listen for transaction result to actually start the machine
const originalOnMessage = ws.onmessage;
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'pos_update' && data.data.type === 'TRANSACTION_RESULT') {
        const { success } = data.data.payload;
        if (success && selectedMachine && selectedProgram) {
            startMachine(selectedMachine.id, selectedProgram.id);
            modal.classList.add('hidden');
            startBtn.innerText = 'Start Machine';
        } else if (!success) {
            alert('Payment failed. Please try again.');
            startBtn.innerText = 'Start Machine';
            startBtn.disabled = false;
        }
    }
    
    if (data.type === 'machine_update') {
        updateMachineUI(data.data);
    }
};

async function startMachine(machineId, programId) {
    try {
        await fetch(`http://localhost:3000/machines/${machineId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ programId })
        });
    } catch (e) {
        console.error('Failed to start machine', e);
    }
}

// Admin Logic
const adminPanel = document.getElementById('admin-panel');
const programList = document.getElementById('program-list');

document.getElementById('show-admin').onclick = () => {
    renderAdminPrograms();
    adminPanel.classList.remove('hidden');
};

document.getElementById('hide-admin').onclick = () => {
    adminPanel.classList.add('hidden');
};

function renderAdminPrograms() {
    programList.innerHTML = `
        <div class="add-program">
            <input type="text" id="new-p-name" placeholder="Name (e.g. Delicates)">
            <select id="new-p-type">
                <option value="WASHER">Washer</option>
                <option value="DRYER">Dryer</option>
            </select>
            <input type="number" id="new-p-duration" placeholder="Mins">
            <input type="number" id="new-p-price" placeholder="Price">
            <button onclick="addProgram()" class="primary-btn">Add</button>
        </div>
    `;

    programs.forEach(p => {
        const item = document.createElement('div');
        item.className = 'program-item';
        item.style = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid var(--glass-border); font-size: 0.9rem;';
        item.innerHTML = `
            <span>${p.name} (${p.type}) - ${p.durationMin}m - $${p.price.toFixed(2)}</span>
            <button onclick="deleteProgram(${p.id})" class="delete-btn" style="background:none; border:none; color:var(--error-color); cursor:pointer;">&times;</button>
        `;
        programList.appendChild(item);
    });
}

window.addProgram = async () => {
    const name = document.getElementById('new-p-name').value;
    const type = document.getElementById('new-p-type').value;
    const durationMin = parseInt(document.getElementById('new-p-duration').value);
    const price = parseFloat(document.getElementById('new-p-price').value);

    if (!name || isNaN(durationMin) || isNaN(price)) return;

    try {
        const res = await fetch('http://localhost:3000/programs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type, durationMin, price })
        });
        if (res.ok) {
            await fetchPrograms();
            renderAdminPrograms();
        }
    } catch (e) {
        console.error('Failed to add program', e);
    }
};

window.deleteProgram = async (id) => {
    if (!confirm('Delete this program?')) return;
    try {
        const res = await fetch(`http://localhost:3000/programs/${id}`, { method: 'DELETE' });
        if (res.ok) {
            await fetchPrograms();
            renderAdminPrograms();
        }
    } catch (e) {
        console.error('Failed to delete program', e);
    }
};

init();
