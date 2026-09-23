import { Users } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Badge, Button, Card, EmptyState, ErrorNote, LoadingBlock, PageHeader, Table, Td, Th } from '../components/ui'
import type { Enums } from '../lib/database.types'
import { initials, longDate } from '../lib/format'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/useData'

export function Socios() {
  const { profile } = useAuth()
  const socios = useData(() => supabase.from('profiles').select('*').order('nombre_completo'), [])

  async function actualizar(id: string, cambios: { activo?: boolean; rol?: Enums<'rol_socio'> }) {
    const { error } = await supabase.from('profiles').update(cambios).eq('id', id)
    if (error) alert(error.message)
    socios.reload()
  }

  return (
    <>
      <PageHeader
        title="Socios"
        subtitle="Las cuentas nuevas se crean desde Supabase → Authentication; su perfil aparece aquí automáticamente."
      />
      <Card>
        {socios.error && (
          <div className="p-4">
            <ErrorNote message={socios.error} />
          </div>
        )}
        {socios.loading ? (
          <LoadingBlock />
        ) : !socios.data?.length ? (
          <EmptyState icon={<Users className="size-5" />} title="Sin socios" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Socio</Th>
                <Th>Empresa</Th>
                <Th>Rol</Th>
                <Th>Estado</Th>
                <Th>Alta</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {socios.data.map((s) => {
                const yo = s.id === profile?.id
                return (
                  <tr key={s.id} className="hover:bg-ink-50/60">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                          {initials(s.nombre_completo || s.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink-900">
                            {s.nombre_completo}
                            {yo && <span className="ml-1.5 text-xs font-normal text-ink-400">(tú)</span>}
                          </p>
                          <p className="truncate text-xs text-ink-500">{s.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-ink-600">{s.empresa ?? '—'}</Td>
                    <Td>
                      <Badge tone={s.rol === 'admin' ? 'violet' : 'gray'}>{s.rol === 'admin' ? 'Admin' : 'Socio'}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={s.activo ? 'green' : 'red'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-ink-600">{longDate(s.created_at)}</Td>
                    <Td className="text-right whitespace-nowrap">
                      {!yo && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => actualizar(s.id, { rol: s.rol === 'admin' ? 'socio' : 'admin' })}
                          >
                            {s.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => actualizar(s.id, { activo: !s.activo })}>
                            {s.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                        </>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
