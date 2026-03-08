import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { commService } from '../services/comm.service'
import {
    Settings,
    Plus,
    Trash2,
    Waves,
    Wind,
    DollarSign,
    Clock,
    AlertCircle,
    Check
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

export const Route = createFileRoute('/admin')({
    component: AdminComponent,
    loader: async () => {
        const { data } = await commService.api.programs.get()
        return { initialPrograms: (data || []) as Program[] }
    }
})

interface Program {
    id: number
    name: string
    type: 'WASHER' | 'DRYER'
    durationMin: number
    price: number
}

function AdminComponent() {
    const { initialPrograms } = useLoaderData({ from: '/admin' })
    const [programs, setPrograms] = useState<Program[]>(initialPrograms)
    const [isAdding, setIsAdding] = useState(false)
    const [newP, setNewP] = useState<Partial<Program>>({
        name: '',
        type: 'WASHER',
        durationMin: 30,
        price: 5.00
    })
    const [isLoading, setIsLoading] = useState(false)

    const fetchPrograms = async () => {
        try {
            const { data } = await commService.api.programs.get()
            if (data) setPrograms(data as Program[])
        } catch (e) {
            console.error('Failed to fetch programs', e)
        }
    }

    const handleAdd = async () => {
        if (!newP.name || !newP.durationMin || !newP.price) return

        setIsLoading(true)
        try {
            await commService.api.programs.post({
                name: newP.name,
                type: newP.type as any,
                durationMin: newP.durationMin,
                price: newP.price
            })
            await fetchPrograms()
            setIsAdding(false)
            setNewP({ name: '', type: 'WASHER', durationMin: 30, price: 5.00 })
        } catch (e) {
            console.error('Failed to add program', e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this program?')) return
        try {
            await commService.api.programs({ id }).delete()
            await fetchPrograms()
        } catch (e) {
            console.error('Failed to delete program', e)
        }
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="page-wrap">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-xl">
                            <Settings size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight leading-none text-foreground uppercase">Admin Panel</h1>
                            <p className="text-muted-foreground mt-1 font-medium italic">Configure services and programs</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsAdding(!isAdding)}
                        variant={isAdding ? "destructive" : "default"}
                        size="lg"
                        className="font-bold h-12 px-8 rounded-xl"
                    >
                        {isAdding ? <AlertCircle className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
                        {isAdding ? 'CANCEL' : 'ADD PROGRAM'}
                    </Button>
                </header>

                {isAdding && (
                    <Card className="mb-12 border-2 border-primary/20 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                        <CardHeader>
                            <CardTitle className="text-2xl font-black flex items-center gap-2">
                                <Plus className="text-primary" /> CREATE NEW PROGRAM
                            </CardTitle>
                            <CardDescription>Add a new washing or drying service to the system.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Program Name</label>
                                <Input
                                    value={newP.name}
                                    onChange={e => setNewP({ ...newP, name: e.target.value })}
                                    placeholder="Quick Wash..."
                                    className="h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Type</label>
                                <Select
                                    value={newP.type}
                                    onValueChange={(val: any) => setNewP({ ...newP, type: val })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WASHER">Washer</SelectItem>
                                        <SelectItem value="DRYER">Dryer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Duration (min)</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input
                                        type="number"
                                        value={newP.durationMin}
                                        onChange={e => setNewP({ ...newP, durationMin: parseInt(e.target.value) })}
                                        className="h-12 pl-10 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Price ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={newP.price}
                                        onChange={e => setNewP({ ...newP, price: parseFloat(e.target.value) })}
                                        className="h-12 pl-10 rounded-xl"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0 flex justify-end">
                            <Button
                                onClick={handleAdd}
                                disabled={isLoading}
                                className="font-black px-12 rounded-2xl h-14"
                            >
                                {isLoading ? 'SAVING...' : 'SAVE PROGRAM'}
                            </Button>
                        </div>
                    </Card>
                )}

                <Card className="shadow-lg border-muted/50 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <Check className="text-emerald-500" /> ACTIVE PROGRAMS
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20 hover:bg-muted/20">
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8">Service</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Type</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Duration</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Price</TableHead>
                                    <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {programs.sort((a, b) => b.id - a.id).map(p => (
                                    <TableRow key={p.id} className="group hover:bg-muted/10">
                                        <TableCell className="py-6 pl-8">
                                            <div className="font-bold text-lg">{p.name}</div>
                                            <div className="text-[10px] text-muted-foreground font-medium tracking-tighter uppercase">ID-00{p.id}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {p.type === 'WASHER' ? <Waves size={16} className="text-primary" /> : <Wind size={16} className="text-orange-500" />}
                                                <Badge variant="secondary" className="font-black">{p.type}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-black text-slate-600 dark:text-slate-400">
                                            {p.durationMin} MIN
                                        </TableCell>
                                        <TableCell className="text-center font-black text-lg">
                                            ${p.price.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(p.id)}
                                                className="text-muted-foreground hover:text-destructive transition-colors rounded-full"
                                            >
                                                <Trash2 size={20} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
