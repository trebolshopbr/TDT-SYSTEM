import { lazy, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { Layout } from './components/Layout'
import { Button, Spinner } from './components/ui'
import { Login } from './pages/Login'

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Pedidos = lazy(() => import('./pages/Pedidos').then((m) => ({ default: m.Pedidos })))
const Productos = lazy(() => import('./pages/Productos').then((m) => ({ default: m.Productos })))
const Gastos = lazy(() => import('./pages/Gastos').then((m) => ({ default: m.Gastos })))
const Caja = lazy(() => import('./pages/Caja').then((m) => ({ default: m.Caja })))
const Propuestas = lazy(() => import('./pages/Propuestas').then((m) => ({ default: m.Propuestas })))
const Plataformas = lazy(() => import('./pages/Plataformas').then((m) => ({ default: m.Plataformas })))
const Socios = lazy(() => import('./pages/Socios').then((m) => ({ default: m.Socios })))

function Gate() {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-7" />
      </div>
    )
  }

  if (!session) return <Login />

  if (!profile || !profile.activo) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold">Tu cuenta no está habilitada</p>
        <p className="max-w-sm text-sm text-ink-500">Pídele a un administrador que active tu perfil de socio.</p>
        <Button variant="secondary" onClick={signOut}>
          Cerrar sesión
        </Button>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="productos" element={<Productos />} />
        <Route path="gastos" element={<Gastos />} />
        <Route path="caja" element={<Caja />} />
        <Route path="propuestas" element={<Propuestas />} />
        <Route
          path="plataformas"
          element={
            <AdminOnly>
              <Plataformas />
            </AdminOnly>
          }
        />
        <Route
          path="socios"
          element={
            <AdminOnly>
              <Socios />
            </AdminOnly>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  )
}
