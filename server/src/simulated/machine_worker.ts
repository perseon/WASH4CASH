// machine_worker.ts
// Simulates a Washer or Dryer

enum MachineStatus {
    IDLE = "IDLE",
    BUSY = "BUSY",
    DONE = "DONE",
    MAINTENANCE = "MAINTENANCE",
    BROKEN = "BROKEN",
}

let status: MachineStatus = MachineStatus.IDLE;
let remainingTime = 0;
let timer: Timer | null = null;
let machineId: number | null = null;

const sendStatus = () => {
    // @ts-ignore
    postMessage({
        type: "MACHINE_STATE",
        payload: {
            machineId,
            status,
            remainingTime,
        },
    });
};

const tick = () => {
    if (remainingTime > 0) {
        remainingTime--;
        sendStatus();
    } else {
        status = MachineStatus.DONE;
        if (timer) clearInterval(timer);
        timer = null;
        sendStatus();
    }
};

// @ts-ignore
self.onmessage = (event: MessageEvent) => {
    const { type, payload } = event.data;

    switch (type) {
        case "INIT":
            machineId = payload.id;
            status = payload.status || MachineStatus.IDLE;
            sendStatus();
            break;

        case "START":
            if (status !== MachineStatus.IDLE && status !== MachineStatus.DONE) return;

            status = MachineStatus.BUSY;
            remainingTime = payload.durationMin * 60; // Convert to seconds for simulation
            sendStatus();

            if (timer) clearInterval(timer);
            timer = setInterval(tick, 1000); // Tick every second
            break;

        case "RESET":
            if (timer) clearInterval(timer);
            timer = null;
            status = MachineStatus.IDLE;
            remainingTime = 0;
            sendStatus();
            break;

        case "SET_STATUS":
            status = payload.status;
            if (status !== MachineStatus.BUSY && timer) {
                clearInterval(timer);
                timer = null;
                remainingTime = 0;
            }
            sendStatus();
            break;
    }
};
