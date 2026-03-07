// POS Terminal Simulator Worker
console.log("[POS Worker] Simulator thread started");
// This runs in a separate thread/process via Bun Workers

export enum POSState {
    IDLE = "IDLE",
    WAITING_FOR_CARD = "WAITING_FOR_CARD",
    PROCESSING = "PROCESSING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
}

let currentState: POSState = POSState.IDLE;
let currentTransactionId: string | null = null;
let currentServiceName: string | null = null;

const sendStatus = (status: POSState, message?: string) => {
    currentState = status;
    // @ts-ignore
    postMessage({
        type: "STATUS_UPDATE",
        payload: { status, message, serviceName: currentServiceName },
    });
};

const sendResult = (success: boolean, transactionId: string, error?: string) => {
    // @ts-ignore
    postMessage({
        type: "TRANSACTION_RESULT",
        payload: { success, transactionId, error },
    });
    sendStatus(success ? POSState.SUCCESS : POSState.FAILED);

    // Reset to IDLE after a short delay
    setTimeout(() => {
        currentServiceName = null;
        currentTransactionId = null;
        sendStatus(POSState.IDLE);
    }, 3000);
};

// @ts-ignore
self.onmessage = (event: MessageEvent) => {
    const { type, payload } = event.data;

    console.log(`[POS Worker] Received command: ${type}`, payload);

    switch (type) {
        case "START_TRANSACTION":
            if (currentState !== POSState.IDLE) {
                // @ts-ignore
                postMessage({
                    type: "ERROR",
                    payload: { message: "Terminal is busy" },
                });
                return;
            }

            currentTransactionId = `tx_${Date.now()}`;
            currentServiceName = payload.serviceName || "Unknown Service";
            sendStatus(POSState.WAITING_FOR_CARD, "Please tap or insert card");
            break;

        case "CONFIRM_PAYMENT":
            if (currentState !== POSState.WAITING_FOR_CARD) {
                return;
            }

            sendStatus(POSState.PROCESSING, "Processing payment...");

            // Simulate network delay (2 seconds) before result
            setTimeout(() => {
                const isSuccess = Math.random() > 0.05; // 95% success rate for manual confirm
                sendResult(isSuccess, currentTransactionId!);
            }, 2000);
            break;

        case "RESET":
            currentServiceName = null;
            currentTransactionId = null;
            sendStatus(POSState.IDLE);
            break;

        case "CANCEL_TRANSACTION":
            if (currentState !== POSState.IDLE && currentState !== POSState.SUCCESS && currentState !== POSState.FAILED) {
                currentServiceName = null;
                currentTransactionId = null;
                sendStatus(POSState.IDLE, "Transaction cancelled");
            }
            break;

        default:
            console.warn(`[POS Worker] Unknown command type: ${type}`);
    }
};

// Report initial status
sendStatus(POSState.IDLE);
