import { treaty } from '@elysiajs/eden'
import type { App } from '../../server/src'

export type CommStatus = 'connecting' | 'connected' | 'disconnected'

/**
 * CommunicationService
 * A global singleton for handling client-server communication via Eden Treaty.
 */
class CommunicationService {
    public api: ReturnType<typeof treaty<App>>
    private _ws: any = null
    private _listeners: Set<(data: any) => void> = new Set()
    private _statusListeners: Set<(status: CommStatus) => void> = new Set()
    private _queue: any[] = []
    private _status: CommStatus = 'disconnected'
    private _url: string

    constructor(baseUrl: string) {
        this._url = baseUrl
        this.api = treaty<App>(baseUrl)
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

        try {
            // Internal derivation of WS URL for logging
            const wsUrl = this._url.replace(/^http/, 'ws') + '/ws'
            console.log('🔌 [CommService] Derived WebSocket URL:', wsUrl)

            // @ts-ignore
            this._ws = this.api.ws.subscribe()

            if (!this._ws) {
                console.error('💥 [CommService] Failed to create subscription object')
                this._updateStatus('disconnected')
                return null
            }

            // In some versions of Eden/Vite, 'open' might be 'connect'
            const onOpen = () => {
                console.log('✅ [CommService] Global channel OPENED')
                this._updateStatus('connected')
                this._flushQueue()
            }

            this._ws.on('open', onOpen)
            this._ws.on('connect', onOpen)

            this._ws.on('message', (event: any) => {
                // event might be the raw message or an object with data
                const data = event.data !== undefined ? event.data : event
                //console.log('📥 [CommService] MESSAGE RECEIVED:', data)
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

            // Safety timeout: if after 5 seconds we are still "connecting", something is fishy but maybe it's just slow
            setTimeout(() => {
                if (this._status === 'connecting') {
                    console.warn('⏳ [CommService] Still in connecting state after 5s...')
                }
            }, 5000)

        } catch (err) {
            console.error('💥 [CommService] Exception during connect:', err)
            this._updateStatus('disconnected')
        }

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
        return () => { this._listeners.delete(callback) }
    }

    /**
     * Register a listener for status changes
     */
    onStatusChange(callback: (status: CommStatus) => void) {
        this._statusListeners.add(callback)
        return () => { this._statusListeners.delete(callback) }
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
// Use absolute URL from current origin to avoid host resolution issues
const getBaseUrl = () => {
    // If VITE_API_URL is provided, use it (e.g. for external access)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
    }

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        // In local Docker dev, we expose backend on 3000. 
        // Bypassing the Vite proxy (5173) for WebSockets often resolves upgrade issues.
        return `${window.location.protocol}//${hostname}:3000`
    }

    // Server-side / Internal Docker network default
    return 'http://backend:3000'
}

export const commService = new CommunicationService(getBaseUrl())
