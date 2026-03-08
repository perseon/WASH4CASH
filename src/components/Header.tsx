import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { commService, type CommStatus } from '../services/comm.service'
import { Badge } from './ui/badge'

export default function Header() {
  const [status, setStatus] = useState<CommStatus>(commService.status)

  useEffect(() => {
    const unsub = commService.onStatusChange(setStatus)
    return unsub
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="page-wrap flex flex-wrap items-center gap-x-6 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-lg font-bold tracking-tight">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-primary font-black">WASH</span>
            <span className="text-foreground">4CASH</span>
          </Link>
        </h2>

        <div className="flex items-center gap-1 flex-1">
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
            Users
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'connected' ? 'bg-emerald-400' :
                  status === 'connecting' ? 'bg-amber-400' : 'bg-rose-400'
                }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'connected' ? 'bg-emerald-500' :
                  status === 'connecting' ? 'bg-amber-500' : 'bg-rose-500'
                }`}></span>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0">
              {status}
            </Badge>
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
