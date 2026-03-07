import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { commService } from '../services/comm.service'
import {
    Waves,
    Wind,
    Clock,
    Play,
    AlertTriangle,
    CheckCircle2,
    Timer,
    X,
    CreditCard
} from 'lucide-react'

export const Route = createFileRoute('/laundromat')({
    component: LaundromatComponent,
})

type MachineType = 'WASHER' | 'DRYER'
type MachineStatus = 'IDLE' | 'BUSY' | 'DONE' | 'MAINTENANCE' | 'BROKEN'

interface Machine {
    id: number
    name: string
    type: MachineType
    status: MachineStatus
}

interface Program {
    id: number
    name: string
    type: MachineType
    durationMin: number
    price: number
}

interface MachineUpdate {
    machineId: number
    status: MachineStatus
    remainingTime: number
}

function LaundromatComponent() {
    const [machines, setMachines] = useState<Machine[]>([])
    const [programs, setPrograms] = useState<Program[]>([])
    const [updates, setUpdates] = useState<Record<number, MachineUpdate>>({})
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
    const [isBooking, setIsBooking] = useState(false)
    const [isPaying, setIsPaying] = useState(false)

    useEffect(() => {
        commService.connect()

        const unsubMessage = commService.onMessage((data) => {
            if (data.type === 'machines') {
                setMachines(data.data)
            }
            if (data.type === 'programs') {
                setPrograms(data.data)
            }
            if (data.type === 'machine_update') {
                const update = data.data as MachineUpdate
                setUpdates(prev => ({ ...prev, [update.machineId]: update }))

                // Also update the status in the machines list if it changed
                setMachines(prev => prev.map(m =>
                    m.id === update.machineId ? { ...m, status: update.status } : m
                ))
            }
            if (data.type === 'pos_update' && data.data.type === 'TRANSACTION_RESULT') {
                const { success } = data.data.payload
                if (success && selectedMachine && selectedProgram) {
                    startMachine(selectedMachine.id, selectedProgram.id)
                    setIsPaying(false)
                    setIsBooking(false)
                    setSelectedMachine(null)
                    setSelectedProgram(null)
                } else if (!success) {
                    alert('Payment failed. Please try again.')
                    setIsPaying(false)
                }
            }
        })

        // Request initial data
        commService.send('refreshMachines')
        commService.send('refreshPrograms')

        return () => {
            unsubMessage()
        }
    }, [selectedMachine, selectedProgram])

    const startMachine = async (machineId: number, programId: number) => {
        try {
            // @ts-ignore - treaty types are sometimes tricky with params
            await commService.api.machines({ id: machineId }).start.post({ programId })
        } catch (e) {
            console.error('Failed to start machine', e)
        }
    }

    const handleOpenBooking = (machine: Machine) => {
        setSelectedMachine(machine)
        setIsBooking(true)
        setSelectedProgram(null)
    }

    const handleConfirmBooking = async () => {
        if (!selectedMachine || !selectedProgram) return

        setIsPaying(true)
        try {
            // 1. Trigger POS
            const serviceName = `${selectedMachine.name} - ${selectedProgram.name}`
            await fetch(`http://localhost:3000/trigger-pos?amount=${selectedProgram.price}&serviceName=${serviceName}`)

            // The actual machine start will be handled by the WS TRANSACTION_RESULT listener
        } catch (e) {
            console.error('POS Trigger failed', e)
            setIsPaying(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 flex items-end justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            LAUNDROMAT <span className="text-blue-600">LIVE</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Real-time machine status and booking</p>
                    </div>
                    <div className="flex gap-4 mb-1">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <Waves className="text-blue-500" size={14} /> {machines.filter(m => m.type === 'WASHER').length} Washers
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <Wind className="text-orange-500" size={14} /> {machines.filter(m => m.type === 'DRYER').length} Dryers
                        </div>
                    </div>
                </header>

                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {machines.sort((a, b) => a.id - b.id).map((m) => {
                        const update = updates[m.id]
                        const isBusy = m.status === 'BUSY'
                        const isDone = m.status === 'DONE'

                        return (
                            <div
                                key={m.id}
                                className={`group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                            >
                                {/* Status Glow Overlay */}
                                <div className={`absolute top-0 left-0 w-full h-1 opacity-20 ${isBusy ? 'bg-amber-500' : isDone ? 'bg-blue-500' : 'bg-emerald-500'
                                    }`} />

                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3 rounded-2xl ${m.type === 'WASHER' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'
                                        }`}>
                                        {m.type === 'WASHER' ? <Waves size={24} /> : <Wind size={24} />}
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${isBusy ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                                            isDone ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                                                'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                        }`}>
                                        {m.status}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                    {m.name}
                                </h3>

                                <div className="flex items-center gap-2 mb-6">
                                    <Clock size={14} className="text-slate-400" />
                                    <span className="text-2xl font-mono font-bold text-slate-700 dark:text-slate-300">
                                        {isBusy && update ? formatTime(update.remainingTime) : '--:--'}
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleOpenBooking(m)}
                                    disabled={isBusy}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isBusy
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 active:scale-95'
                                        }`}
                                >
                                    {isBusy ? <Clock size={18} /> : isDone ? <CheckCircle2 size={18} /> : <Play size={18} />}
                                    {isBusy ? 'IN USE' : isDone ? 'FINISHED' : 'BOOK NOW'}
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Booking Modal */}
                {isBooking && selectedMachine && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                            CONFIGURE <span className="text-blue-600">BOOKING</span>
                                        </h2>
                                        <p className="text-sm text-slate-500 font-medium">Machine {selectedMachine.name}</p>
                                    </div>
                                    <button
                                        onClick={() => setIsBooking(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Available Programs</label>
                                    <div className="grid gap-3">
                                        {programs.filter(p => p.type === selectedMachine.type).map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedProgram(p)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${selectedProgram?.id === p.id
                                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl ${selectedProgram?.id === p.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                        }`}>
                                                        <Timer size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                                        <div className="text-xs text-slate-500 font-medium">{p.durationMin} minutes</div>
                                                    </div>
                                                </div>
                                                <div className="text-lg font-black text-slate-900 dark:text-white">
                                                    ${p.price.toFixed(2)}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={!selectedProgram || isPaying}
                                    className={`w-full py-5 rounded-[1.25rem] font-black tracking-wider flex items-center justify-center gap-3 transition-all ${!selectedProgram || isPaying
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-xl active:scale-95'
                                        }`}
                                >
                                    {isPaying ? (
                                        <>
                                            <CreditCard size={20} className="animate-pulse" />
                                            AWAITING PAYMENT...
                                        </>
                                    ) : (
                                        <>
                                            <Play size={20} />
                                            INITIATE PAYMENT
                                        </>
                                    )}
                                </button>

                                {isPaying && (
                                    <div className="mt-4 flex items-center gap-2 justify-center text-xs font-bold text-amber-500 animate-pulse">
                                        <AlertTriangle size={14} /> COMPLETE PAYMENT AT POS TERMINAL
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
