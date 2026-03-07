import { createFileRoute } from '@tanstack/react-router'
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

export const Route = createFileRoute('/admin')({
    component: AdminComponent,
})

interface Program {
    id: number
    name: string
    type: 'WASHER' | 'DRYER'
    durationMin: number
    price: number
}

function AdminComponent() {
    const [programs, setPrograms] = useState<Program[]>([])
    const [isAdding, setIsAdding] = useState(false)
    const [newP, setNewP] = useState<Partial<Program>>({
        name: '',
        type: 'WASHER',
        durationMin: 30,
        price: 5.00
    })
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        fetchPrograms()
    }, [])

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-900 dark:bg-white rounded-2xl text-white dark:text-slate-900 shadow-xl">
                            <Settings size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">ADMIN PANEL</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Configure services and programs</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isAdding
                                ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                            }`}
                    >
                        {isAdding ? <AlertCircle size={20} /> : <Plus size={20} />}
                        {isAdding ? 'CANCEL' : 'ADD PROGRAM'}
                    </button>
                </header>

                {isAdding && (
                    <div className="mb-12 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                        <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                            <Plus className="text-blue-600" size={24} /> CREATE NEW PROGRAM
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Program Name</label>
                                <input
                                    type="text"
                                    value={newP.name}
                                    onChange={e => setNewP({ ...newP, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                    placeholder="Quick Wash..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Type</label>
                                <select
                                    value={newP.type}
                                    onChange={e => setNewP({ ...newP, type: e.target.value as any })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                >
                                    <option value="WASHER">Washer</option>
                                    <option value="DRYER">Dryer</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Duration (min)</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="number"
                                        value={newP.durationMin}
                                        onChange={e => setNewP({ ...newP, durationMin: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Price ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newP.price}
                                        onChange={e => setNewP({ ...newP, price: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleAdd}
                                disabled={isLoading}
                                className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-4 rounded-2xl font-black tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                            >
                                {isLoading ? 'SAVING...' : 'SAVE PROGRAM'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-lg">
                    <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                        <Check className="text-emerald-500" size={24} /> ACTIVE PROGRAMS ({programs.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="text-left py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Service</th>
                                    <th className="text-left py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</th>
                                    <th className="text-left py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Duration</th>
                                    <th className="text-left py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Price</th>
                                    <th className="text-right py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {programs.sort((a, b) => b.id - a.id).map(p => (
                                    <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/50 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-5">
                                            <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium tracking-tighter uppercase">ID-00{p.id}</div>
                                        </td>
                                        <td className="py-5">
                                            <div className="flex items-center gap-2">
                                                {p.type === 'WASHER' ? <Waves size={14} className="text-blue-500" /> : <Wind size={14} className="text-orange-500" />}
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wide">{p.type}</span>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <div className="text-sm font-black text-slate-700 dark:text-slate-300">{p.durationMin} MIN</div>
                                        </td>
                                        <td className="py-5">
                                            <div className="text-sm font-black text-slate-900 dark:text-white">${p.price.toFixed(2)}</div>
                                        </td>
                                        <td className="py-5 text-right">
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
