import { ArrowRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, ErrorNote, Field, Input } from '../components/ui'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : error.message)
    setBusy(false)
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(600px circle at 20% 20%, rgba(16,185,107,0.35), transparent 60%), radial-gradient(500px circle at 90% 90%, rgba(14,165,233,0.2), transparent 60%)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="size-10" />
          <span className="text-lg font-semibold text-white">TDT System</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-white">
            Todas tus ventas, gastos y productos en un solo lugar.
          </h2>
          <p className="mt-4 text-brand-100/70">
            Shopee, TikTok Shop, Mercado Livre y tu tienda propia: resultados claros para todos los socios.
          </p>
        </div>
        <p className="relative text-xs text-brand-100/40">© {new Date().getFullYear()} Trébol Shop</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <img src="/favicon.svg" alt="" className="mb-8 size-10 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-ink-500">Accede con tu cuenta de socio.</p>

          <div className="mt-8 space-y-4">
            <Field label="Email">
              <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Contraseña">
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && <ErrorNote message={error} />}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Ingresando…' : 'Ingresar'}
              {!busy && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
