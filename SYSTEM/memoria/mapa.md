# Mapa de TDT NUEVO

Actualizado: 2026-09-23

## Carpetas

| Carpeta | Contiene |
|---|---|
| `SYSTEM/landing-sistema/` | Portada `tdtsystem.html` (solo el logo), `proyectos.html` (System, Global, Growth, Digital), `marca/` (logo) y System: `system.html` (PIN) → `dashboard.html` |
| `SYSTEM/dashboard/` | `dashboard-maestro.html`: dashboard maestro de TT, servido protegido en `/sistema/dashboard-maestro.html` |
| `SYSTEM/deploy/` | `armar-landing.sh`: junta la portada con las landings de cada proyecto en `_registro/deploy-landing` para publicar en `tdt.systems`. No publica solo |
| `SYSTEM/runtime/` | Servidor local (`server.mjs`) que sirve todo en :8790. Pruebas en `tests/` |
| `SYSTEM/servicios/` | `registro.json`: los servicios externos (Vercel, GitHub, Supabase, Namecheap) y qué vive en cada uno. Sin claves. Lo mantiene el Publicador |
| `SYSTEM/roles/` | Un archivo por rol (ahora `direccion.md`, para GPT Chrome). Cada uno declara su herramienta en `## Herramienta` |
| `SYSTEM/CLAUDE.md` | El rol Guardián del sistema. Lo lee solo un chat de Claude Code iniciado en la carpeta `SYSTEM` |
| `SYSTEM/memoria/` | Esta memoria para orientar a las IA |
| `SYSTEM/ia/promt/` | `registro.json`: prompts preparados por sector (`preparados`) y cuáles se usaron y quién (`usos`). Se muestra en Promt, dentro de IA y automatización |
| `SYSTEM/ia/agentes/` | `registro.json`: lo que hace cada IA ahora (Claude Code, Antigravity IDE, GPT Work). Se muestra al tocar cada tarjeta en IA y automatización. Lo lee `/_tdt/ia` |
| `SYSTEM/ia/promt/` | Registro local de prompts preparados por sector y de los que fueron utilizados. Actualmente vacío |
| `SYSTEM/direccion/` | Estado vivo de Dirección: ahora, horizontes, inbox e historial local de cambios |
| `SYSTEM/documentos-internos/` | Documentos fuente internos |
| `GLOBAL/` | App Next.js del equipo Global (socios). Landing en `GLOBAL/landing/global.html`. Migraciones en `GLOBAL/supabase/migrations/` |
| `GROWTH/` | Solo la landing `GROWTH/landing/growth.html`. Sin app todavía |
| `PERSONAL/` | Todo lo relacionado con la imagen de TT. Por ahora, el prototipo `landing/operador-no-guru/personal.html` (local: `/personal.html`) |
| `DIGITAL/` | Por ahora solo la landing `DIGITAL/landing/digital.html` |
| `_registro/runtime/` | Solo los logs del servidor local. El material viejo está en `~/TDT_REVISION` (ver `revision.md`) |

## Mapa simple

Explicación en palabras simples de cada carpeta. El apartado de carpetas del dashboard maestro muestra este texto; si se agrega una carpeta, se suma aquí.

- `SYSTEM` — Tu sistema: la base que ordena todo
- `SYSTEM/dashboard` — Tu dashboard maestro, esto que estás viendo
- `SYSTEM/landing-sistema` — La entrada: el logo, la elección de proyecto y la pantalla del PIN
- `SYSTEM/runtime` — El motor que prende todo en tu Mac y cuida tu PIN
- `SYSTEM/memoria` — Donde las IA leen cómo está todo y anotan lo que hacen
- `SYSTEM/ia` — Lo que hace cada IA ahora mismo, para que lo veas en el dashboard
- `SYSTEM/documentos-internos` — Documentos fuente de TDT
- `GLOBAL` — Proyecto Global: la app de tus socios
- `GLOBAL/landing` — Su página de presentación, con el botón Login
- `GLOBAL/src` — La app de los socios por dentro: pedidos, productos, financeiro
- `GLOBAL/supabase` — La base de datos de Global
- `GLOBAL/public` — Imágenes públicas de la app
- `GROWTH` — Proyecto Growth
- `GROWTH/landing` — Su página de presentación
- `DIGITAL` — Proyecto Digital
- `DIGITAL/landing` — Su página de presentación
- `PERSONAL` — Tu imagen
- `PERSONAL/landing` — Prototipo de tu página personal
- `_registro` — Registros automáticos
- `_registro/runtime` — Lo que el motor anota mientras está prendido
- `TDT_REVISION` — Lo viejo, guardado aparte para revisar con calma
- `SYSTEM/deploy` — El armado de la portada antes de publicarla
- `SYSTEM/direccion` — Tus prioridades y decisiones, lo que ordena Faro
- `SYSTEM/roles` — Qué le toca a cada IA: un archivo por rol
- `SYSTEM/servicios` — Los servicios de afuera donde vive todo: Vercel, GitHub, Supabase y Namecheap
- `_registro/deploy-landing` — El paquete ya armado de la portada, listo para publicar
- `TDT_REVISION/01-GLOBAL` — Lo viejo de Global, guardado
- `TDT_REVISION/02-GROWTH` — Lo viejo de Growth, guardado
- `TDT_REVISION/03-DIGITAL` — Lo viejo de Digital, guardado
- `TDT_REVISION/04-PERSONAL` — Lo viejo de tu imagen, guardado
- `TDT_REVISION/05-SYSTEM-ADMIN-Y-CAPITAL` — Lo viejo de System, administración y capital
- `TDT_REVISION/06-MEMORIA-COGNITIVA-Y-SENSORES` — Lo viejo de memoria y sensores
- `TDT_REVISION/growth-app-prueba-2026-09-23` — La app de prueba de Growth que nunca se usó
- `TDT_REVISION/login-supabase-system-2026-09-23` — El acceso viejo de System con usuario y contraseña

## Direcciones locales

- `./abrir.sh` (desde la raíz) → http://localhost:8790: portada, proyectos, landings y System. No arranca ninguna app.
- `cd GLOBAL && npm run dev` → http://localhost:3000: app Global (`/login`).

## Dominios (tdt.systems, DNS en Namecheap, hosting Vercel)

| Dominio | Destino |
|---|---|
| `tdt.systems` | Portada → proyectos → landings |
| `app.tdt.systems` | System de TT: pantalla con PIN y dashboard maestro |
| `global.tdt.systems` | Landing de Global → `/login` → app Global (equipo) |

Por ahora se trabaja en local y no se despliega sin que TT lo pida.
Publicado el 2026-09-23: `tdt.systems` sirve portada y landings; `global.tdt.systems` es el dominio activo para la app Global (con su propio `/login`); `app.tdt.systems` queda reservado para System de TT (sin publicar todavía). El dashboard maestro y el PIN NO están publicados: solo funcionan en local.


## Dos logins distintos (no mezclar)

| Login | Para | Supabase |
|---|---|---|
| `system.html` | TT (System), con PIN local de 4 números | no usa Supabase |
| `GLOBAL` `/login` | Socios de Global | proyecto `drnjdufklfihowrjxfdd` |

Las claves están en `.env.local` y `config.js`, nunca en esta carpeta. El Supabase `zffjultbznluqzweiuxj` (`config.js`) ya no se usa para entrar a System; el servidor todavía conserva esa verificación.

## Acceso local (:8790)

- Escucha solo en 127.0.0.1. `/sistema/` (dashboard maestro) exige la sesión que abre el PIN, guardada en una cookie HttpOnly con SameSite=Strict.
- No publicar este servidor de desarrollo como servidor de producción.

## Apartado Local (dashboard maestro, ícono de carpeta encima de Dirección)

- Está debajo de Inicio y se ve como un árbol de carpetas con explicaciones simples (sección "Mapa simple" arriba). Lee en vivo, desde `/_tdt/estructura` (`SYSTEM/runtime/estructura.mjs`, solo con la sesión del PIN), las carpetas de TDT NUEVO (3 niveles, sin node_modules ni archivos ocultos), las descripciones de la tabla "Carpetas" de este archivo, el estado de las direcciones locales y las carpetas de `~/TDT_REVISION`. Nunca muestra el contenido de los archivos.
- El mapa también muestra el avatar de cada IA sobre las carpetas donde trabaja, según el campo `archivos` de su entrada en el registro de IA. Para aparecer en una carpeta, la IA anota ahí sus archivos.
- Para que una carpeta tenga descripción en el Mapa, se agrega a la tabla "Carpetas" de este archivo.

## PIN de System

- `system.html` pide solo un PIN de 4 números. Lo valida el servidor local (`SYSTEM/runtime/pin.mjs`) y abre una sesión de 8 horas con cookie HttpOnly. 5 errores seguidos bloquean el PIN 10 minutos.
- El PIN se guarda solo como hash, en `~/.tdt/system-pin.json`, fuera del proyecto. Lo configura TT con `node SYSTEM/runtime/configurar-pin.mjs` (pide solo el PIN).
- Este PIN funciona solo en local. Para `app.tdt.systems` hará falta validarlo en un servidor (pendiente, cuando TT pida desplegar).

## Pruebas

- Raíz: `node --test SYSTEM/runtime/tests/*.test.mjs` (servidor y PIN)
