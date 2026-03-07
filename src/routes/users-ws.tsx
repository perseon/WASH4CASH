import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { commService, type CommStatus } from '../services/comm.service'
import { Users, RefreshCcw, Wifi, WifiOff, User as UserIcon, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/users-ws')({
    component: UsersWSComponent,
})

interface User {
    id: number
    email: string
    name: string | null
}

function UsersWSComponent() {
    const [users, setUsers] = useState<User[]>([])
    const [status, setStatus] = useState<CommStatus>(commService.status)
    const [lastMessage, setLastMessage] = useState<string | null>(null)

    useEffect(() => {
        // Sync with global communication service
        commService.connect()

        const unsubStatus = commService.onStatusChange((newStatus) => {
            console.log('🔄 [UI] Status changed to:', newStatus)
            setStatus(newStatus)
        })

        const unsubMessage = commService.onMessage((data) => {
            console.log('📥 [UI] Page received data:', data)
            setLastMessage(JSON.stringify(data).substring(0, 100) + '...')

            // Try to find users in multiple possible structures
            const usersData = data?.type === 'users' ? data.data : (data?.data?.type === 'users' ? data.data.data : null)

            if (usersData) {
                console.log('✅ [UI] Applying user list update')
                setUsers(usersData)
            }
        })

        // Request initial data
        commService.send('refresh')

        return () => {
            unsubStatus()
            unsubMessage()
        }
    }, [])

    const handleRefresh = () => {
        setLastMessage(null)
        commService.send('refresh')
    }

    const handleReconnect = () => {
        commService.disconnect()
        commService.connect()
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-8 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shadow-inner">
                            <Users size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">WebSocket Stream</h1>
                            <div className="flex items-center gap-2 mt-1">
                                {status === 'connected' ? (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                                        <Wifi size={14} className="animate-pulse" /> LIVE CONNECTION
                                    </span>
                                ) : status === 'connecting' ? (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 animate-pulse">
                                        <RefreshCcw size={14} className="animate-spin" /> SYNCHRONIZING...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
                                        <WifiOff size={14} /> CONNECTION DISCONTINUED
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleReconnect}
                            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                        >
                            Reset Channel
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={status === 'connecting'}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all font-semibold border border-slate-200 dark:border-slate-700 active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCcw size={18} className={status === 'connecting' ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </header>

                {/* Debug Log Console (Mini) */}
                <div className="mb-6 bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-xl overflow-hidden group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Server Comm Log
                        </span>
                        <span className="text-[10px] text-slate-600">Last event: {new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="font-mono text-xs text-emerald-400 whitespace-pre truncate opacity-80 group-hover:opacity-100 transition-opacity">
                        {lastMessage || 'Waiting for first handshake...'}
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {users.length > 0 ? (
                        users.map((user, idx) => (
                            <div
                                key={user.id}
                                className="group relative bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-sm transition-transform group-hover:scale-110">
                                        <UserIcon size={28} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg tracking-tight">
                                            {user.name || 'Anonymous User'}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-4">
                                            {user.email}
                                        </p>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase">
                                                UID-{user.id}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center text-slate-400 text-center px-6">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                                <AlertCircle size={40} className="text-slate-200 dark:text-slate-700" />
                            </div>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No data in stream</p>
                            <p className="text-sm max-w-xs opacity-60">The global channel is open, but we haven't captured any user records yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
