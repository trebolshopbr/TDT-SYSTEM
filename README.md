# TDT System

Panel de gestión de ventas para los socios: pedidos, productos, gastos, cierres de caja y propuestas de productos, con datos en Supabase.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Supabase (auth + Postgres con RLS)
- Recharts, lucide-react, React Router

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completa la publishable key de Supabase
npm run dev
```

La publishable key está en Supabase → Project Settings → API Keys.

## Scripts

| Comando             | Qué hace                               |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                 |
| `npm run build`     | Chequeo de tipos + build de producción |
| `npm run lint`      | Lint con oxlint                        |
| `npm run format`    | Formatea el código con Prettier        |
| `npm run typecheck` | Solo chequeo de tipos                  |

## Estructura

```
src/
  auth/         Sesión y perfil del socio
  components/   Layout y componentes de UI
  lib/          Cliente Supabase, tipos de la base, formato y etiquetas
  pages/        Una pantalla por sección
```

## Base de datos

Proyecto Supabase `global`. La lógica de negocio vive en la base:

- Al crear o editar un pedido, un trigger ajusta el stock del producto y registra la venta en `ventas_plataforma`.
- RLS: todos los socios leen todo; cada uno edita lo que registró; solo los admins eliminan y gestionan plataformas y socios.
- Los usuarios nuevos se crean en Supabase → Authentication y su perfil se genera automáticamente.

Para regenerar `src/lib/database.types.ts` después de cambiar el esquema:

```bash
npx supabase gen types typescript --project-id drnjdufklfihowrjxfdd > src/lib/database.types.ts
```
