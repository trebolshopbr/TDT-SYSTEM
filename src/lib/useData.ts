import { useCallback, useEffect, useState } from 'react'

type Result<T> = { data: T | null; error: { message: string } | null }

export function useData<T>(fetcher: () => PromiseLike<Result<T>>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.resolve(fetcher()).then((res) => {
      if (cancelled) return
      setData(res.data)
      setError(res.error?.message ?? null)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return { data, error, loading, reload }
}
