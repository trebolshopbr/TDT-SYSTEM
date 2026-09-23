import { Plus, Store } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Select,
} from '../components/ui'
import { tipoPlataforma } from '../lib/labels'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/useData'

export function Plataformas() {
  const [nueva, setNueva] = useState(false)
  const plataformas = useData(() => supabase.from('plataformas').select('*').order('nombre'), [])

  async function toggle(id: string, activa: boolean) {
    const { error } = await supabase.from('plataformas').update({ activa }).eq('id', id)
    if (error) alert(error.message)
    plataformas.reload()
  }

  return (
    <>
      <PageHeader
        title="Plataformas"
        subtitle="Canales donde venden. Las inactivas no aparecen al cargar pedidos nuevos."
        action={
          <Button onClick={() => setNueva(true)}>
            <Plus className="size-4" /> Nueva plataforma
          </Button>
        }
      />
      {plataformas.error && <ErrorNote message={plataformas.error} />}
      {plataformas.loading ? (
        <LoadingBlock />
      ) : !plataformas.data?.length ? (
        <Card>
          <EmptyState icon={<Store className="size-5" />} title="Sin plataformas" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plataformas.data.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Store className="size-5" />
                </div>
                <Badge tone={p.activa ? 'green' : 'gray'}>{p.activa ? 'Activa' : 'Inactiva'}</Badge>
              </div>
              <h3 className="mt-4 font-semibold text-ink-900">{p.nombre}</h3>
              <p className="text-xs text-ink-500">{tipoPlataforma[p.tipo] ?? p.tipo}</p>
              <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => toggle(p.id, !p.activa)}>
                {p.activa ? 'Desactivar' : 'Activar'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {nueva && (
        <PlataformaForm
          onClose={() => setNueva(false)}
          onSaved={() => {
            setNueva(false)
            plataformas.reload()
          }}
        />
      )}
    </>
  )
}

function PlataformaForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('marketplace')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('plataformas').insert({ nombre: nombre.trim(), tipo })
    setBusy(false)
    if (error) setError(error.code === '23505' ? 'Ya existe una plataforma con ese nombre.' : error.message)
    else onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nueva plataforma"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="plataforma-form" disabled={busy}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="plataforma-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Nombre">
          <Input required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <Field label="Tipo">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.entries(tipoPlataforma).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        {error && <ErrorNote message={error} />}
      </form>
    </Modal>
  )
}
