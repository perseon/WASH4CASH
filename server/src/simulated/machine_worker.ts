// machine_worker.ts
// Simulates a Washer or Dryer

enum MachineStatus {
    IDLE = "IDLE",
    BUSY = "BUSY",
    DONE = "DONE",
    MAINTENANCE = "MAINTENANCE",
    BROKEN = "BROKEN",
}

let machineStatus: MachineStatus = MachineStatus.IDLE;
let remainingTime = 0;
let totalDurationSeconds = 0;
let timer: Timer | null = null;
let machineId: number | null = null;

const sendStatus = () => {
    // @ts-ignore
    postMessage({
        type: "MACHINE_STATE",
        payload: {
            machineId,
            status: machineStatus,
            remainingTime,
            totalDurationSeconds,
        },
    });
};

const tick = () => {
    if (remainingTime > 0) {
        remainingTime--;
        sendStatus();
    } else {
        if (machineStatus === MachineStatus.BUSY) {
            machineStatus = MachineStatus.DONE;
            remainingTime = 60; // Stay in DONE state for 1 minute
            sendStatus();
            // Note: We don't clear the interval here, because we want it to keep ticking for the DONE state
        } else if (machineStatus === MachineStatus.DONE) {
            machineStatus = MachineStatus.IDLE;
            remainingTime = 0;
            if (timer) clearInterval(timer);
            timer = null;
            sendStatus();
        } else {
            if (timer) clearInterval(timer);
            timer = null;
            sendStatus();
        }
    }
};

// @ts-ignore
self.onmessage = (event: MessageEvent) => {
    const { type, payload } = event.data;

    switch (type) {
        case "INIT":
            machineId = payload.id;
            machineStatus = payload.status || MachineStatus.IDLE;
            remainingTime = payload.remainingTime || 0;
            totalDurationSeconds = payload.totalDurationSeconds || 0;

            if (machineStatus === MachineStatus.BUSY && remainingTime > 0) {
                if (timer) clearInterval(timer);
                timer = setInterval(tick, 1000);
            } else if (machineStatus === MachineStatus.DONE) {
                // If we initialize in DONE state (e.g. after restart), give it 60s to clear
                if (timer) clearInterval(timer);
                remainingTime = 60;
                timer = setInterval(tick, 1000);
            }

            sendStatus();
            break;

        case "START":
            if (machineStatus !== MachineStatus.IDLE && machineStatus !== MachineStatus.DONE) return;

            machineStatus = MachineStatus.BUSY;
            totalDurationSeconds = payload.durationMin * 60;
            remainingTime = totalDurationSeconds;
            sendStatus();

            if (timer) clearInterval(timer);
            timer = setInterval(tick, 1000); // Tick every second
            break;

        case "RESET":
            if (timer) clearInterval(timer);
            timer = null;
            machineStatus = MachineStatus.IDLE;
            remainingTime = 0;
            sendStatus();
            break;

        case "SET_STATUS":
            machineStatus = payload.status;
            if (machineStatus !== MachineStatus.BUSY && timer) {
                clearInterval(timer);
                timer = null;
                remainingTime = 0;
            }
            sendStatus();
            break;
    }
};
