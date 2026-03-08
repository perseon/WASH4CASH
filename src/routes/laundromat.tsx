import { createFileRoute, useLoaderData } from '@tanstack/react-router'
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
    CreditCard
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../components/ui/dialog'
import { toast } from 'sonner'

export const Route = createFileRoute('/laundromat')({
    component: LaundromatComponent,
    loader: async () => {
        const [machinesRes, programsRes] = await Promise.all([
            commService.api.machines.get(),
            commService.api.programs.get()
        ])
        return {
            initialMachines: (machinesRes.data || []) as Machine[],
            initialPrograms: (programsRes.data || []) as Program[]
        }
    }
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
    totalDurationSeconds?: number
}

function LaundromatComponent() {
    const { initialMachines, initialPrograms } = useLoaderData({ from: '/laundromat' })
    const [machines, setMachines] = useState<Machine[]>(initialMachines)
    const [programs, setPrograms] = useState<Program[]>(initialPrograms)
    const [updates, setUpdates] = useState<Record<number, MachineUpdate>>({})
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
    const [isBookingOpen, setIsBookingOpen] = useState(false)
    const [isPaying, setIsPaying] = useState(false)
    const [isPosModalOpen, setIsPosModalOpen] = useState(false)
    const POS_URL = 'http://localhost:4000'

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

                setMachines(prev => prev.map(m =>
                    m.id === update.machineId ? { ...m, status: update.status || m.status } : m
                ))
            }
            if (data.type === 'pos_update') {
                if (data.data.type === 'TRANSACTION_RESULT') {
                    const { success, error } = data.data.payload
                    if (success && selectedMachine && selectedProgram) {
                        toast.success('Payment successful!', {
                            description: `Starting ${selectedMachine.name} with ${selectedProgram.name}.`
                        })
                        startMachine(selectedMachine.id, selectedProgram.id)
                        setIsPaying(false)
                        setIsBookingOpen(false)
                        setSelectedMachine(null)
                        setSelectedProgram(null)
                        setIsPosModalOpen(false)
                    } else if (!success) {
                        toast.error('Payment failed', {
                            description: error || 'The transaction was declined or interrupted.'
                        })
                        setIsPaying(false)
                        setIsPosModalOpen(false)
                    }
                } else if (data.data.type === 'ERROR') {
                    toast.error('POS Terminal Error', {
                        description: data.data.payload.message
                    })
                    setIsPaying(false)
                }
            }
        })

        commService.send('refreshMachines')
        commService.send('refreshPrograms')

        return () => {
            unsubMessage()
        }
    }, [selectedMachine, selectedProgram])

    useEffect(() => {
        let timeoutId: any = null;

        if (isPaying) {
            timeoutId = setTimeout(() => {
                setIsPaying(false);
                setIsPosModalOpen(false);
                commService.send('posReset');
                toast.error('Payment timeout', {
                    description: 'No response from POS terminal. Please ensure it is running.'
                });
            }, 60000); // 60 seconds
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        }
    }, [isPaying])

    const startMachine = async (machineId: number, programId: number) => {
        try {
            // @ts-ignore
            await commService.api.machines({ id: machineId }).start.post({ programId })
        } catch (e) {
            toast.error('Control error', {
                description: 'Failed to send start signal to the machine.'
            })
            console.error('Failed to start machine', e)
        }
    }

    const handleOpenBooking = (machine: Machine) => {
        setSelectedMachine(machine)
        setIsBookingOpen(true)
        setSelectedProgram(null)
    }

    const handleConfirmBooking = async () => {
        if (!selectedMachine || !selectedProgram) return

        setIsPaying(true)
        try {
            const serviceName = `${selectedMachine.name} - ${selectedProgram.name}`
            const res = await fetch(`http://localhost:3000/trigger-pos?amount=${selectedProgram.price}&serviceName=${serviceName}`)
            if (!res.ok) throw new Error('Cound not trigger POS');

            // Open the POS modal
            setIsPosModalOpen(true)
        } catch (e) {
            toast.error('Backend connection lost', {
                description: 'Could not communicate with the server to initiate payment.'
            })
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
        <div className="min-h-screen bg-background p-6">
            <div className="page-wrap">
                <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-2 text-foreground">
                            <Waves className="text-primary h-8 w-8" />
                            LAUNDROMAT <Badge variant="secondary" className="ml-2 font-black uppercase">Live</Badge>
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">Real-time machine status and booking management.</p>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="h-8 px-3 font-bold uppercase tracking-wider">{machines.filter(m => m.type === 'WASHER').length} Washers</Badge>
                        <Badge variant="outline" className="h-8 px-3 font-bold uppercase tracking-wider">{machines.filter(m => m.type === 'DRYER').length} Dryers</Badge>
                    </div>
                </header>

                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {machines.sort((a, b) => a.id - b.id).map((m) => {
                        const update = updates[m.id]
                        const isBusy = m.status === 'BUSY'
                        const isDone = m.status === 'DONE'

                        return (
                            <Card key={m.id} className={`overflow-hidden transition-all duration-300 hover:shadow-xl border-t-4 ${isBusy ? 'border-t-amber-500' : isDone ? 'border-t-primary' : 'border-t-emerald-500'
                                }`}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-black">{m.name}</CardTitle>
                                        <CardDescription className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                            {m.type === 'WASHER' ? <Waves size={12} className="text-primary" /> : <Wind size={12} className="text-orange-500" />}
                                            {m.type}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={isBusy ? "warning" : isDone ? "default" : "success"} className="font-black capitalize bg-opacity-20">
                                        {(m.status || 'IDLE').toLowerCase()}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="pt-4 pb-8 space-y-6">
                                    <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-3xl border border-dashed border-muted relative overflow-hidden">
                                        {isBusy && update && update.totalDurationSeconds && (
                                            <div
                                                className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-1000"
                                                style={{ width: `${Math.min(100, Math.max(0, ((update.totalDurationSeconds - update.remainingTime) / update.totalDurationSeconds) * 100))}%` }}
                                            />
                                        )}
                                        <Clock className="mb-2 text-muted-foreground" size={24} />
                                        <span className="text-4xl font-mono font-black tabular-nums tracking-tighter z-10">
                                            {isBusy && update ? formatTime(update.remainingTime) : '--:--'}
                                        </span>
                                    </div>

                                    {isBusy && update && update.totalDurationSeconds && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                <span>Progress</span>
                                                <span>{Math.round(((update.totalDurationSeconds - update.remainingTime) / update.totalDurationSeconds) * 100)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                                    style={{ width: `${Math.min(100, Math.max(0, ((update.totalDurationSeconds - update.remainingTime) / update.totalDurationSeconds) * 100))}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full h-12 font-black text-lg gap-2 rounded-xl"
                                        size="lg"
                                        disabled={isBusy}
                                        variant={isBusy ? "secondary" : isDone ? "outline" : "default"}
                                        onClick={() => handleOpenBooking(m)}
                                    >
                                        {isBusy ? <Clock size={20} /> : isDone ? <CheckCircle2 size={20} /> : <Play size={20} />}
                                        {isBusy ? 'IN USE' : isDone ? 'FINISHED' : 'BOOK NOW'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>

                <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                    <DialogContent className="sm:max-w-md rounded-[2.5rem]">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black tracking-tight text-center">
                                CONFIGURE BOOKING
                            </DialogTitle>
                            <DialogDescription className="text-center font-medium">
                                Machine {selectedMachine?.name} ({selectedMachine?.type})
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Available Programs</label>
                            <div className="grid gap-3">
                                {programs.filter(p => p.type === selectedMachine?.type).map(p => (
                                    <Button
                                        key={p.id}
                                        variant={selectedProgram?.id === p.id ? "default" : "outline"}
                                        className={`h-auto flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${selectedProgram?.id === p.id
                                            ? 'border-primary'
                                            : 'border-transparent'
                                            }`}
                                        onClick={() => setSelectedProgram(p)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl bg-muted`}>
                                                <Timer size={18} />
                                            </div>
                                            <div>
                                                <div className="font-bold">{p.name}</div>
                                                <div className="text-xs opacity-60 font-medium">{p.durationMin} minutes</div>
                                            </div>
                                        </div>
                                        <div className="text-lg font-black">
                                            ${p.price.toFixed(2)}
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-col gap-3">
                            <Button
                                size="xl"
                                className="w-full h-16 font-black text-xl gap-3 rounded-2xl"
                                disabled={!selectedProgram || isPaying}
                                onClick={handleConfirmBooking}
                            >
                                {isPaying ? (
                                    <>
                                        <CreditCard size={24} className="animate-pulse" />
                                        AWAITING PAYMENT...
                                    </>
                                ) : (
                                    <>
                                        <Play size={24} />
                                        INITIATE PAYMENT
                                    </>
                                )}
                            </Button>

                            {isPaying && (
                                <div className="flex items-center gap-2 justify-center text-xs font-bold text-amber-500 animate-pulse">
                                    <AlertTriangle size={14} /> COMPLETE PAYMENT AT POS TERMINAL
                                </div>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isPosModalOpen} onOpenChange={setIsPosModalOpen}>
                    <DialogContent className="sm:max-w-xl h-[600px] p-0 overflow-hidden rounded-[2.5rem] border-none">
                        <DialogHeader className="p-6 pb-0 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background to-transparent pointer-events-none">
                            <DialogTitle className="text-xl font-black flex items-center gap-2 opacity-50">
                                <CreditCard size={20} /> SECURE PAYMENT TERMINAL
                            </DialogTitle>
                        </DialogHeader>
                        <iframe
                            src={POS_URL}
                            className="w-full h-full border-none pt-12"
                            title="POS Terminal"
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
