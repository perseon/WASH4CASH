export enum MachineStatus {
    IDLE = "IDLE",
    BUSY = "BUSY",
    DONE = "DONE",
    MAINTENANCE = "MAINTENANCE",
    BROKEN = "BROKEN",
}

export enum MachineType {
    WASHER = "WASHER",
    DRYER = "DRYER",
}

export enum POSState {
    IDLE = "IDLE",
    WAITING_FOR_CARD = "WAITING_FOR_CARD",
    PROCESSING = "PROCESSING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
}
