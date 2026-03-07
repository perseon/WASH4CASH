import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { commService, type CommStatus } from '../services/comm.service'

export default function Header() {
  const [status, setStatus] = useState<CommStatus>(commService.status)

  useEffect(() => {
    const unsub = commService.onStatusChange(setStatus)
    return unsub
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm no-underline"
          >
            Wash4Cash
          </Link>
        </h2>

        <div className="flex items-center gap-4 flex-1">
          <Link
            to="/laundromat"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Laundromat
          </Link>
          <Link
            to="/admin"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Admin
          </Link>
          <Link
            to="/users-ws"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Users (WS)
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_var(--success-color)] animate-pulse' :
                status === 'connecting' ? 'bg-amber-500 animate-bounce' : 'bg-rose-500'
              }`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {status}
            </span>
          </div>
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            About
          </Link>
        </div>
      </nav>
    </header>
  )
}
