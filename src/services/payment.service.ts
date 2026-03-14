import { commService } from './comm.service'
import { toast } from 'sonner'

export type PaymentStatus = 'idle' | 'awaiting_payment' | 'processing' | 'success' | 'failed' | 'timeout'

interface PaymentResult {
    success: boolean
    error?: string
    machineId?: number
    programId?: number
}

class PaymentService {
    private _status: PaymentStatus = 'idle'
    private _onResultListeners: Set<(result: PaymentResult) => void> = new Set()
    private _onStatusChangeListeners: Set<(status: PaymentStatus) => void> = new Set()
    private _timeoutId: any = null
    private _activePayment: { machineId: number, programId: number } | null = null

    constructor() {
        // We listen to the global commService for POS updates
        commService.onMessage((data) => {
            if (data.type === 'pos_update') {
                this._handlePosUpdate(data.data)
            }
        })
    }

    get status() { return this._status }

    /**
     * Trigger a payment for a specific machine and program
     */
    async initiatePayment(machine: { id: number, name: string }, program: { id: number, name: string, price: number }) {
        if (this._status === 'awaiting_payment') {
            console.warn('⚠️ [PaymentService] Payment already in progress')
            return
        }

        console.log(`💳 [PaymentService] Initiating payment for ${machine.name} - ${program.name} ($${program.price})`)
        this._activePayment = { machineId: machine.id, programId: program.id }
        this._updateStatus('awaiting_payment')

        try {
            // Use Eden Treaty for the API call to ensure it goes through the correct proxy/baseUrl
            const { data, error } = await commService.api['trigger-pos'].post({
                machineId: machine.id,
                programId: program.id
            })

            if (error || (data && !data.success)) {
                throw new Error(error?.value?.toString() || (data as any)?.error || 'Could not trigger POS terminal')
            }

            console.log('🔌 [PaymentService] POS triggered successfully')

            // Start the 60s timeout
            this._startTimeout()

        } catch (error: any) {
            console.error('💥 [PaymentService] Failed to trigger POS:', error)
            toast.error('Payment Error', {
                description: error.message || 'Could not communicate with the POS terminal.'
            })
            this._updateStatus('failed')
            this._notifyResult({ success: false, error: error.message })
        }
    }

    private _handlePosUpdate(data: any) {
        // Elysia/Eden might nest data differently depending on broadcast format
        const type = data.type
        const payload = data.payload

        console.log(`📡 [PaymentService] Received POS update: ${type}`, payload)

        if (type === 'TRANSACTION_RESULT') {
            this._clearTimeout()
            const { success, error } = payload
            
            if (success) {
                console.log('✅ [PaymentService] Payment successful!')
                this._updateStatus('success')
                this._notifyResult({ 
                    success: true, 
                    machineId: this._activePayment?.machineId, 
                    programId: this._activePayment?.programId 
                })
            } else {
                console.warn('❌ [PaymentService] Payment failed:', error)
                this._updateStatus('failed')
                this._notifyResult({ success: false, error: error || 'Transaction declined' })
            }
            this._activePayment = null
        } else if (type === 'STATUS_UPDATE') {
            const { status } = payload
            if (status === 'PROCESSING') {
                this._updateStatus('processing')
            } else if (status === 'WAITING_FOR_CARD') {
                this._updateStatus('awaiting_payment')
            }
        } else if (type === 'ERROR') {
            this._clearTimeout()
            this._updateStatus('failed')
            this._notifyResult({ success: false, error: payload.message })
            this._activePayment = null
        }
    }

    /**
     * Reset the POS terminal and service state
     */
    reset() {
        this._clearTimeout()
        commService.send('posReset')
        this._updateStatus('idle')
        this._activePayment = null
    }

    onResult(callback: (result: PaymentResult) => void) {
        this._onResultListeners.add(callback)
        return () => this._onResultListeners.delete(callback)
    }

    onStatusChange(callback: (status: PaymentStatus) => void) {
        this._onStatusChangeListeners.add(callback)
        return () => this._onStatusChangeListeners.delete(callback)
    }

    private _updateStatus(status: PaymentStatus) {
        this._status = status
        this._notifyStatusChange()
    }

    private _notifyStatusChange() {
        this._onStatusChangeListeners.forEach(cb => cb(this._status))
    }

    private _notifyResult(result: PaymentResult) {
        this._onResultListeners.forEach(cb => cb(result))
    }

    private _startTimeout() {
        this._clearTimeout()
        this._timeoutId = setTimeout(() => {
            console.warn('🕒 [PaymentService] Payment timed out')
            this.reset()
            toast.error('Payment Timeout', {
                description: 'No response from the POS terminal.'
            })
            this._notifyResult({ success: false, error: 'Timeout' })
        }, 60000)
    }

    private _clearTimeout() {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId)
            this._timeoutId = null
        }
    }
}

export const paymentService = new PaymentService()
