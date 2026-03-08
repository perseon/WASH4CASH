import { createFileRoute, useLoaderData, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { commService } from '../services/comm.service'
import {
  Waves,
  Wind,
  Play,
  AlertTriangle,
  CreditCard,
  ArrowLeft,
  Timer,
  Settings,
  CheckCircle
} from 'lucide-react'

import { LanguageToggle } from '../components/LanguageToggle'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { toast } from 'sonner'

export const Route = createFileRoute('/')({
  component: MobileWizardComponent,
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

function MobileWizardComponent() {
  const { t } = useTranslation()
  const { initialMachines, initialPrograms } = useLoaderData({ from: '/' })
  const [machines, setMachines] = useState<Machine[]>(initialMachines)
  const [programs, setPrograms] = useState<Program[]>(initialPrograms)
  const [updates, setUpdates] = useState<Record<number, MachineUpdate>>({})

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedType, setSelectedType] = useState<MachineType | null>(null)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)

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
            toast.success(t('Payment successful!'), {
              description: `${t('Starting')} ${selectedMachine.name} ${t('with')} ${selectedProgram.name}.`
            })
            startMachine(selectedMachine.id, selectedProgram.id)
            setIsPaying(false)
            setIsPosModalOpen(false)
            setStep(4) // Advance to Step 4 (Thank You page)
          } else if (!success) {
            toast.error(t('Payment failed'), {
              description: error || t('The transaction was declined or interrupted.')
            })
            setIsPaying(false)
            setIsPosModalOpen(false)
          }
        } else if (data.data.type === 'ERROR') {
          toast.error(t('POS Terminal Error'), {
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
        toast.error(t('Payment timeout'), {
          description: t('No response from POS terminal. Please ensure it is running.')
        });
      }, 60000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, [isPaying])

  // Auto-close timer for Step 4
  useEffect(() => {
    let timeoutId: any = null;
    if (step === 4) {
      timeoutId = setTimeout(() => {
        resetWizard();
      }, 30000); // 30 seconds
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, [step])

  const startMachine = async (machineId: number, programId: number) => {
    try {
      // @ts-ignore
      await commService.api.machines({ id: machineId }).start.post({ programId })
    } catch (e) {
      toast.error(t('Control error'), {
        description: t('Failed to send start signal to the machine.')
      })
      console.error('Failed to start machine', e)
    }
  }

  const resetWizard = () => {
    setIsPaying(false)
    setIsPosModalOpen(false)
    setStep(1)
    setSelectedType(null)
    setSelectedMachine(null)
    setSelectedProgram(null)
  }

  const handleConfirmBooking = async () => {
    if (!selectedMachine || !selectedProgram) return

    setIsPaying(true)
    try {
      const serviceName = `${selectedMachine.name} - ${selectedProgram.name}`
      const res = await fetch(`http://localhost:3000/trigger-pos?amount=${selectedProgram.price}&serviceName=${serviceName}`)
      if (!res.ok) throw new Error('Cound not trigger POS');

      setIsPosModalOpen(true)
    } catch (e) {
      toast.error(t('Backend connection lost'), {
        description: t('Could not communicate with the server to initiate payment.')
      })
      console.error('POS Trigger failed', e)
      setIsPaying(false)
    }
  }

  const goBack = () => {
    if (step === 3) {
      setSelectedProgram(null)
      setStep(2)
    } else if (step === 2) {
      setSelectedMachine(null)
      setSelectedType(null)
      setStep(1)
    }
  }

  // Step renderers
  const renderStep1 = () => (
    <div className="flex-1 flex flex-col justify-center gap-6 p-6 pb-24">
      <h2 className="text-3xl font-black tracking-tight text-center mb-4">{t('What do you need?')}</h2>

      <button
        onClick={() => { setSelectedType('WASHER'); setStep(2) }}
        className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-blue-700 p-8 text-white shadow-xl transition-transform active:scale-95"
      >
        <div className="absolute -right-4 -top-8 opacity-20 transition-transform group-hover:scale-110">
          <Waves size={160} />
        </div>
        <div className="relative z-10 flex flex-col items-start gap-4">
          <div className="rounded-full bg-white/20 p-4 backdrop-blur-md">
            <Waves size={32} />
          </div>
          <div className="text-left">
            <h3 className="text-3xl font-black">{t('Wash')}</h3>
            <p className="font-medium text-blue-100 mt-1">{t('Select an available Washer')}</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => { setSelectedType('DRYER'); setStep(2) }}
        className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500 to-red-600 p-8 text-white shadow-xl transition-transform active:scale-95"
      >
        <div className="absolute -right-4 -top-8 opacity-20 transition-transform group-hover:scale-110">
          <Wind size={160} />
        </div>
        <div className="relative z-10 flex flex-col items-start gap-4">
          <div className="rounded-full bg-white/20 p-4 backdrop-blur-md">
            <Wind size={32} />
          </div>
          <div className="text-left">
            <h3 className="text-3xl font-black">{t('Dry')}</h3>
            <p className="font-medium text-orange-100 mt-1">{t('Select an available Dryer')}</p>
          </div>
        </div>
      </button>
    </div>
  )

  const renderStep2 = () => {
    // Sort machines: IDLE first, then others by lowest remaining time
    const availableMachines = [...machines]
      .filter(m => m.type === selectedType)
      .sort((a, b) => {
        if (a.status === 'IDLE' && b.status !== 'IDLE') return -1;
        if (a.status !== 'IDLE' && b.status === 'IDLE') return 1;
        if (a.status === 'IDLE' && b.status === 'IDLE') return a.id - b.id;

        const timeA = updates[a.id]?.remainingTime ?? Infinity;
        const timeB = updates[b.id]?.remainingTime ?? Infinity;
        return timeA - timeB;
      });

    return (
      <div className="flex-1 flex flex-col p-6 pb-24 overflow-y-auto">
        <h2 className="text-2xl font-black tracking-tight mb-6">{t('Select a Machine')}</h2>
        <div className="grid gap-4">
          {availableMachines.map(m => {
            const isAvailable = m.status === 'IDLE'
            const update = updates[m.id]
            const isBusy = m.status === 'BUSY'

            return (
              <button
                key={m.id}
                disabled={!isAvailable}
                onClick={() => { setSelectedMachine(m); setStep(3) }}
                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${isAvailable
                  ? 'border-border bg-card hover:border-primary active:scale-[0.98] shadow-sm'
                  : 'border-transparent bg-muted/40 cursor-not-allowed'
                  }`}
              >
                {/* Background progress bar snippet if busy */}
                {isBusy && update && update.totalDurationSeconds && (
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(0, ((update.totalDurationSeconds - update.remainingTime) / update.totalDurationSeconds) * 100))}%` }}
                  />
                )}

                <div className="flex items-center gap-4 relative z-10 w-full">
                  <div className={`p-3 rounded-2xl shrink-0 ${isAvailable ? (selectedType === 'WASHER' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600') : 'bg-muted text-muted-foreground'}`}>
                    {selectedType === 'WASHER' ? <Waves size={24} /> : <Wind size={24} />}
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <div className={`font-black text-lg ${!isAvailable && 'text-muted-foreground'}`}>{m.name}</div>
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                        {t('Status')}: <Badge variant={isAvailable ? "outline" : "secondary"} className={`text-[10px] w-fit ${isAvailable ? 'text-emerald-500 border-emerald-500/30' : ''}`}>{t((m.status || 'IDLE').toLowerCase())}</Badge>
                      </div>
                    </div>

                    {!isAvailable && update && (
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('Available in')}</span>
                        <div className="text-xl font-mono font-black tabular-nums bg-background/50 backdrop-blur-sm px-3 py-1 rounded-lg text-foreground">
                          {Math.floor(update.remainingTime / 60)}:{(update.remainingTime % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderStep3 = () => {
    const availablePrograms = programs.filter(p => p.type === selectedMachine?.type)
    return (
      <div className="flex-1 flex flex-col p-6 pb-32 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight">{t('Select Program')}</h2>
          <p className="text-muted-foreground font-medium mt-1">{t('For')} {selectedMachine?.name}</p>
        </div>
        <div className="grid gap-4">
          {availablePrograms.map(p => {
            const isSelected = selectedProgram?.id === p.id
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProgram(p)}
                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card hover:border-primary/50 shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Timer size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-lg leading-tight">{p.name}</div>
                    <div className="text-sm font-medium text-muted-foreground mt-0.5">{p.durationMin} {t('minutes')}</div>
                  </div>
                </div>
                <div className="text-xl font-black text-right">
                  ${p.price.toFixed(2)}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderStep4 = () => {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          <CheckCircle size={48} />
        </div>

        <h2 className="text-4xl font-black tracking-tight mb-2">{t('Thank You!')}</h2>
        <p className="text-xl text-muted-foreground font-medium mb-8">
          {t('Your payment was successful.')}
        </p>

        <div className="bg-muted p-6 rounded-[2rem] w-full max-w-sm mb-12">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">{t('Ready to use')}</p>
          <div className="text-3xl font-black flex items-center justify-center gap-3">
            {selectedMachine?.type === 'WASHER' ? <Waves className="text-blue-500" /> : <Wind className="text-orange-500" />}
            {selectedMachine?.name}
          </div>
          <p className="text-sm font-medium mt-3">
            {t('Program')}: <strong>{selectedProgram?.name}</strong>
          </p>
        </div>

        <Button
          size="xl"
          variant="outline"
          className="w-full max-w-sm h-16 rounded-[1.5rem] font-bold text-lg"
          onClick={resetWizard}
        >
          {t('START ANOTHER BOOKING')}
        </Button>
        <div className="text-xs font-medium text-muted-foreground mt-4 animate-pulse">
          {t('This screen will close automatically in 30 seconds.')}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background w-full max-w-md mx-auto relative shadow-2xl overflow-hidden sm:border-x sm:border-border">

      {/* Top Navigation Bar */}
      <header className="flex-none flex items-center justify-between p-4 pt-6 z-10 bg-background/80 backdrop-blur-md sticky top-0">
        <div className="w-12 h-12 flex items-center justify-start">
          {step > 1 && step < 4 && !isPaying ? (
            <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 active:scale-95 bg-muted/50" onClick={goBack}>
              <ArrowLeft size={24} />
            </Button>
          ) : step === 4 ? null : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Waves size={20} className="ml-1" />
            </div>
          )}
        </div>

        <div className="flex gap-1 items-center justify-center transition-opacity" style={{ opacity: step === 4 ? 0 : 1 }}>
          <div className={`h-2 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        <div className="w-12 h-12 flex items-center justify-end">
          {step !== 4 && (
            <Link to="/laundromat">
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 text-muted-foreground">
                <Settings size={20} />
              </Button>
            </Link>
          )}
          <LanguageToggle />
        </div>
      </header>

      {/* Main Content Area */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Bottom sticky checkout area for Step 3 */}
      {step === 3 && (
        <div className="fixed sm:absolute bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-lg border-t border-border z-20 animate-in slide-in-from-bottom-8 duration-300">
          <Button
            size="xl"
            className="w-full h-16 rounded-[1.5rem] font-black text-xl gap-3 shadow-lg shadow-primary/25 active:scale-95 transition-transform"
            disabled={!selectedProgram || isPaying}
            onClick={handleConfirmBooking}
          >
            {isPaying ? (
              <>
                <CreditCard size={24} className="animate-pulse" />
                {t('AWAITING PAYMENT...')}
              </>
            ) : (
              <>
                <Play size={24} />
                {selectedProgram ? `${t('PAY')} $${selectedProgram.price.toFixed(2)}` : t('SELECT A PROGRAM')}
              </>
            )}
          </Button>
          {isPaying && (
            <div className="flex items-center gap-2 justify-center text-xs font-bold text-amber-500 animate-pulse mt-4">
              <AlertTriangle size={14} /> {t('COMPLETE IN TERMINAL')}
            </div>
          )}
        </div>
      )}

      {/* POS Modal */}
      <Dialog open={isPosModalOpen} onOpenChange={setIsPosModalOpen}>
        <DialogContent className="w-[95vw] max-w-md h-[70vh] p-0 overflow-hidden rounded-[2.5rem] border-none">
          <DialogHeader className="p-4 pb-0 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background to-transparent pointer-events-none">
            <DialogTitle className="text-sm font-black flex items-center gap-2 opacity-60">
              <CreditCard size={16} /> {t('SECURE PAYMENT')}
            </DialogTitle>
          </DialogHeader>
          {isPosModalOpen && (
            <iframe
              src={POS_URL}
              className="w-full h-full border-none pt-10"
              title="POS Terminal"
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
