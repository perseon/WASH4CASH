import { treaty } from '@elysiajs/eden'
import type { App } from '../../server/src'

export type CommStatus = 'connecting' | 'connected' | 'disconnected'

/**
 * CommunicationService
 * A global singleton for handling client-server communication via Eden Treaty.
 */
class CommunicationService {
    private _client: ReturnType<typeof treaty<App>>
    private _ws: any = null
    private _listeners: Set<(data: any) => void> = new Set()
    private _statusListeners: Set<(status: CommStatus) => void> = new Set()
    private _queue: any[] = []
    private _status: CommStatus = 'disconnected'
    private _url: string

    constructor(baseUrl: string) {
        this._url = baseUrl
        this._client = treaty<App>(baseUrl)
    }

    get status() {
        return this._status
    }

    /**
     * Subscribe to the global WebSocket channel
     */
    connect() {
        if (this._ws && (this._status === 'connected' || this._status === 'connecting')) {
            console.log('📡 [CommService] Connection already active or in progress')
            return this._ws
        }

        console.log('📡 [CommService] Initializing connection to:', this._url)
        this._updateStatus('connecting')

        // @ts-ignore
        this._ws = this._client.ws.subscribe()

        this._ws.on('open', () => {
            console.log('✅ [CommService] Global channel OPENED')
            this._updateStatus('connected')
            this._flushQueue()
        })

        this._ws.on('message', (event: any) => {
            // Eden Treaty might return the raw MessageEvent or the data depending on version/config
            // We'll log the full event for debugging as requested
            console.log('📥 [CommService] RAW MESSAGE RECEIVED:', event)

            const data = event.data !== undefined ? event.data : event
            console.log('📦 [CommService] EXTRACTED DATA:', data)

            this._notify(data)
        })

        this._ws.on('close', (event: any) => {
            console.log('🔌 [CommService] Global channel CLOSED', event)
            this._updateStatus('disconnected')
            this._ws = null
        })

        this._ws.on('error', (err: any) => {
            console.error('💥 [CommService] Global channel ERROR:', err)
            this._updateStatus('disconnected')
            this._ws = null
        })

        return this._ws
    }

    /**
     * Send a message through the shared WebSocket.
     */
    send(message: any) {
        console.log('📤 [CommService] ATTEMPTING TO SEND:', message)
        if (this._status === 'connected' && this._ws) {
            this._ws.send(message)
            console.log('✈️ [CommService] Message sent successfully')
        } else {
            console.log('⏳ [CommService] Queueing message (status: ' + this._status + ')')
            this._queue.push(message)

            if (this._status === 'disconnected') {
                this.connect()
            }
        }
    }

    private _flushQueue() {
        if (this._queue.length > 0) {
            console.log(`🚀 [CommService] Flushing ${this._queue.length} queued messages`)
            while (this._queue.length > 0 && this._status === 'connected') {
                const msg = this._queue.shift()
                this._ws.send(msg)
            }
        }
    }

    /**
     * Register a listener for global messages
     */
    onMessage(callback: (data: any) => void) {
        this._listeners.add(callback)
        return () => this._listeners.delete(callback)
    }

    /**
     * Register a listener for status changes
     */
    onStatusChange(callback: (status: CommStatus) => void) {
        this._statusListeners.add(callback)
        return () => this._statusListeners.delete(callback)
    }

    private _updateStatus(status: CommStatus) {
        this._status = status
        this._statusListeners.forEach(cb => cb(status))
    }

    private _notify(data: any) {
        this._listeners.forEach(cb => cb(data))
    }

    /**
     * Disconnect the global channel
     */
    disconnect() {
        console.log('🔌 [CommService] Manual disconnect triggered')
        if (this._ws) {
            this._ws.close()
            this._ws = null
            this._updateStatus('disconnected')
        }
    }
}

// Export a singleton instance
export const commService = new CommunicationService('localhost:3000')
