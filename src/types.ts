import type { App } from '../server/src'
import { MachineType, MachineStatus, POSState } from '../server/src/types'
import type { treaty } from '@elysiajs/eden'

// Infer the API type from the backend App
type Api = ReturnType<typeof treaty<App>>

/**
 * Entity types inferred directly from the Elysia backend.
 * These are "Shared Types" that stay in sync with the server.
 */
export type Machine = NonNullable<Awaited<ReturnType<Api['machines']['get']>>['data']>[number]
export type Program = NonNullable<Awaited<ReturnType<Api['programs']['get']>>['data']>[number]

// Re-export shared enums
export { MachineType, MachineStatus, POSState }

/**
 * Type for real-time WebSocket updates.
 * We use the shared MachineStatus enum for strict typing.
 */
export interface MachineUpdate {
    machineId: number
    status: MachineStatus
    remainingTime: number
    totalDurationSeconds?: number
}
