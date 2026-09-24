# Reglas del proyecto TDT

## Objetivo

Construir TDT como un sistema claro, trazable y escalable sin volver a introducir interfaces, documentos o supuestos obsoletos.

## Orientación para IA

Si te pierdes o no sabes dónde guardar algo, lee `SYSTEM/memoria/LEEME.md`. Ahí están el mapa, el estado, las decisiones y la bitácora. Al terminar un cambio, anótalo en `SYSTEM/memoria/bitacora.md`. Las decisiones nuevas de TT van en `SYSTEM/memoria/decisiones.md`.

Toda IA que trabaje aquí (Claude Code, Antigravity IDE, GPT Work) registra lo que está haciendo en `SYSTEM/ia/agentes/registro.json`, dentro de `activos` de su herramienta: título, estado, qué hace ahora, qué hizo, siguiente paso, bloqueos y archivos. Se actualiza al empezar, al cambiar de tarea y al terminar; al terminar, pon estado `terminado` y actualiza `actualizado`. Lo que lleva más de 24 horas sin cambios o está terminado se ve atenuado en el dashboard. En `archivos` anota las carpetas donde trabajas: así apareces sobre ellas en el mapa. El dashboard maestro lo muestra en IA y automatización. Cada IA elige su propia identidad visual (`agente`: nombre, símbolo, color, forma y lema) y puede sumar `secciones` libres. Si TT te da el prompt "Ubicarse y dejar constancia" (sección Promt del dashboard), sigue ese prompt. Sin claves ni datos sensibles.

## Roles

Cada chat de IA trabaja con un rol. Los archivos de los roles están en `SYSTEM/roles/` (el del Guardián, en `SYSTEM/CLAUDE.md`), y cada uno dice su carril, lo que hace y lo que no.

- **System:** Guardián del sistema (orden, memoria, mapa y registro de IA), Dirección (prioridades y decisiones de TDT), Publicador (el único que sube a GitHub y publica) y Datos (el único que aplica migraciones).
- **Global:** Dirección, Producto, Operación y Experiencia, cada uno con su propia carpeta dentro de `GLOBAL/`.
- Un chat no edita fuera de su carril. Si necesita un cambio de otro rol, se lo dice a TT.
- Solo TT decide las prioridades.
- El rol se carga con el primer mensaje del chat, y el chat se registra en el registro de IA con el título exacto de su rol.

## Arquitectura objetivo

- `tdt.systems`: portada pública. `tdtsystem.html` (solo el logo) → `proyectos.html` (Global, Growth, Digital, System) → landing de cada proyecto, guardada en la carpeta de su proyecto: `GLOBAL/landing/global.html`, `GROWTH/landing/growth.html`, `DIGITAL/landing/digital.html`.
- `app.tdt.systems`: sistema de TT. Pantalla System con PIN (`system.html`) y dashboard maestro que controla todo.
- `<proyecto>.tdt.systems`: aplicación de cada proyecto con su propio login para su equipo. Ej.: `global.tdt.systems` → landing Global → `global.tdt.systems/login` (app en `GLOBAL/`).
- Hay dos logins distintos a propósito: el de TT (sistema/admin) y el de cada proyecto (equipo). No mezclarlos.
- En local: portada, landings y System en http://localhost:8790 (`./abrir.sh`); app Global en http://localhost:3000 (`cd GLOBAL && npm run dev`)). Cada app se abre por separado; System no arranca ninguna.
- Trabajo local por defecto: no desplegar a Vercel ni tocar dominios sin pedido explícito de TT.
- Ritmo ligero: en construcción no se sube cada cambio a GitHub (una vez al día o cuando TT lo pida) ni se anota cada detalle en la bitácora (un resumen por bloque de trabajo). Protocolo extra solo al publicar, cambiar la base de datos real o borrar.
- Para publicar la portada en `tdt.systems`, primero ejecutar `SYSTEM/deploy/armar-landing.sh` y desplegar desde `_registro/deploy-landing`. Nunca desplegar `SYSTEM/landing-sistema` directo: las landings de Global, Growth y Digital viven en sus carpetas y quedarían en 404.

Mientras continúen dentro de un solo repositorio, estas fronteras deben mantenerse conceptualmente separadas.

## Fuente vigente

- `SYSTEM/dashboard/dashboard-maestro.html` es el dashboard maestro de TT. Recorrido: proyectos → System → `system.html` (PIN de 4 números, validado por `SYSTEM/runtime/pin.mjs`) → `dashboard.html`, que lo carga protegido en `/sistema/dashboard-maestro.html`.
- `SYSTEM/landing-sistema/` contiene la portada (`tdtsystem.html`, `proyectos.html`), el logo compartido (`marca/`), la pantalla System con PIN (`system.html`) y `dashboard.html`, que protege el dashboard maestro.
- `PERSONAL/`: todo lo relacionado con la imagen de TT. Por ahora contiene el prototipo `PERSONAL/landing/operador-no-guru/personal.html` (local: `/personal.html`).
- Cada proyecto guarda su landing en `<PROYECTO>/landing/` y su aplicación en su propia carpeta (Global: `GLOBAL/`). Todo lo de un proyecto va en la carpeta de ese proyecto.
- `SYSTEM/runtime/server.mjs` sirve todo en http://localhost:8790 y sabe en qué carpeta está cada landing.
- `SYSTEM/documentos-internos/` conserva documentos fuente internos.
- `GROWTH/` contiene solo su landing. La app de prueba anterior está en `TDT_REVISION/growth-app-prueba-2026-09-23/`.
- `TDT_REVISION` contiene material histórico o pendiente de evaluación.

## Lo viejo (TDT_REVISION)

Lo viejo vive en `TDT_REVISION`, dentro de la carpeta pero ignorado por GitHub. No se usa ni se copia al sistema sin revisarlo antes, y nunca se ejecuta directo.

## Orden de construcción (sugerido)

1. App: estructura visual, acceso y navegación.
2. Dirección: presente, prioridades y decisiones.
3. Growth: clientes, ventas y caja.
4. Global: productos, proveedores y economía.
5. Digital: ofertas, ventas y entrega.
6. System: arquitectura, memoria e infraestructura.
7. Admin: permisos, fuentes, integraciones y auditoría.
8. Public: presentación externa definitiva.
9. IA y automatización.

Es una guía, no una obligación: TT decide el orden real de construcción.

## Gobierno

- Declarado no equivale a verificado.
- Capacidad descrita no equivale a disponibilidad actual.
- Activo potencial no equivale a activo confirmado.
- Una idea registrada no se convierte automáticamente en prioridad o tarea.
- Dirección Estratégica conserva la autoridad raíz.
- La IA puede leer, relacionar y proponer; no canoniza ni ejecuta decisiones sensibles sin autoridad delegada.

## Interfaz

- Mantener navegación simple y estable.
- El contenido interno de Global, Growth, Digital y System vive en el dashboard.

## Cambios y archivos

- No borrar material incierto: moverlo a `TDT_REVISION` con nombre y fecha claros.
- No modificar material archivado para hacerlo parecer vigente.
- Mantener `SYSTEM/dashboard/` limitado al dashboard maestro y sus dependencias reales.
- Actualizar rutas y pruebas cuando se mueva un archivo.
- No crear dos fuentes de verdad para el mismo dato.
- No incluir secretos, tokens o credenciales en el repositorio.

## Verificación

Solo al publicar en internet, cambiar la base de datos real o borrar. Antes de cerrar ese tipo de cambio:

- comprobar que la ruta activa sirve el archivo correcto;
- revisar visualmente la pantalla afectada;
- probar navegación y acción principal;
- ejecutar las pruebas relacionadas;
- confirmar que no quedan referencias activas a archivos movidos.

Para todo lo demás rige el ritmo ligero: se construye rápido y se corrige sobre la marcha.
