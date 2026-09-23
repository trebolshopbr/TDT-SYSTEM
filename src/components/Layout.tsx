import { Boxes, ClipboardList, LayoutDashboard, Lightbulb, LogOut, Menu, Receipt, Store, Users, Wallet, X } from 'lucide-react'
import { Suspense, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { cn } from '../lib/cn'
import { initials } from '../lib/format'
import { LoadingBlock } from './ui'

const nav = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/productos', label: 'Productos', icon: Boxes },
  { to: '/gastos', label: 'Gastos', icon: Receipt },
  { to: '/caja', label: 'Cierres de caja', icon: Wallet },
  { to: '/propuestas', label: 'Propuestas', icon: Lightbulb },
]

const navAdmin = [
  { to: '/plataformas', label: 'Plataformas', icon: Store },
  { to: '/socios', label: 'Socios', icon: Users },
]

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img src="/favicon.svg" alt="" className="size-8" />
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight text-white">TDT System</p>
        <p className="text-[11px] text-brand-300/80">Gestión de ventas</p>
      </div>
    </div>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, isAdmin, signOut } = useAuth()

  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-white/10 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white',
    )

  return (
    <div className="flex h-full flex-col bg-brand-950 px-3 py-5">
      <Logo className="px-2" />

      <nav className="mt-8 flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={link} onClick={onNavigate}>
              <Icon className="size-4 shrink-0 opacity-80" />
              {label}
            </NavLink>
          ))}
        </div>

        {isAdmin && (
          <div>
            <p className="mb-1.5 px-3 text-[11px] font-medium tracking-wider text-ink-500 uppercase">Administración</p>
            <div className="space-y-0.5">
              {navAdmin.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={link} onClick={onNavigate}>
                  <Icon className="size-4 shrink-0 opacity-80" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-semibold text-brand-200">
          {initials(profile?.nombre_completo ?? profile?.email ?? '?')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{profile?.nombre_completo ?? 'Socio'}</p>
          <p className="truncate text-xs text-ink-400 capitalize">{profile?.rol ?? ''}</p>
        </div>
        <button
          onClick={signOut}
          className="rounded-lg p-2 text-ink-400 hover:bg-white/10 hover:text-white"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <Sidebar onNavigate={() => setOpen(false)} />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-5 right-3 rounded-lg p-1.5 text-ink-300 hover:bg-white/10"
              aria-label="Cerrar menú"
            >
              <X className="size-5" />
            </button>
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink-200/70 bg-brand-950 px-4 lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 text-ink-200 hover:bg-white/10" aria-label="Abrir menú">
          <Menu className="size-5" />
        </button>
        <Logo />
      </header>

      <main key={location.pathname} className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Suspense fallback={<LoadingBlock />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
