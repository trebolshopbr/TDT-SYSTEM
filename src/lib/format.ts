const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const num = new Intl.NumberFormat('es-AR')

export function money(value: number | null | undefined, currency: 'BRL' | 'USD' | string = 'BRL') {
  return (currency === 'USD' ? usd : brl).format(Number(value ?? 0))
}

export function number(value: number | null | undefined) {
  return num.format(Number(value ?? 0))
}

export function percent(value: number) {
  if (!Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

// Supabase `date` columns come as 'YYYY-MM-DD'; parsing them with `new Date()` shifts the day in UTC-3.
export function parseDate(value: string) {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function today() {
  return toISODate(new Date())
}

export function shortDate(value: string) {
  return parseDate(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export function longDate(value: string) {
  return parseDate(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}
