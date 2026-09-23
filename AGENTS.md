# Reglas del proyecto TDT

## Objetivo

Construir TDT como un sistema claro, trazable y escalable sin volver a introducir interfaces, documentos o supuestos obsoletos.

## Orientación para IA

Si te pierdes o no sabes dónde guardar algo, lee `SYSTEM/memoria/LEEME.md`. Ahí están el mapa, el estado, las decisiones y la bitácora. Al terminar un cambio, anótalo en `SYSTEM/memoria/bitacora.md`. Las decisiones nuevas de TT van en `SYSTEM/memoria/decisiones.md`.

Toda IA que trabaje aquí (Claude Code, Antigravity IDE, GPT Work) registra lo que está haciendo en `SYSTEM/ia/agentes/registro.json`, dentro de `activos` de su herramienta: título, estado, qué hace ahora, qué hizo, siguiente paso, bloqueos y archivos. Se actualiza al empezar, al cambiar de tarea y al terminar. El dashboard maestro lo muestra en IA y automatización. Cada IA elige su propia identidad visual (`agente`: nombre, símbolo, color, forma y lema) y puede sumar `secciones` libres. Si TT te da el prompt "Ubicarse y dejar constancia" (sección Promt del dashboard), sigue ese prompt. Sin claves ni datos sensibles.

## Arquitectura objetivo

- `tdt.systems`: portada pública. `tdtsystem.html` (solo el logo) → `proyectos.html` (Global, Growth, Digital, System) → landing de cada proyecto, guardada en la carpeta de su proyecto: `GLOBAL/landing/global.html`, `GROWTH/landing/growth.html`, `DIGITAL/landing/digital.html`.
- `app.tdt.systems`: sistema de TT. Pantalla System con PIN (`system.html`) y dashboard maestro que controla todo.
- `<proyecto>.tdt.systems`: aplicación de cada proyecto con su propio login para su equipo. Ej.: `global.tdt.systems` → landing Global → `global.tdt.systems/login` (app en `GLOBAL/`).
- Hay dos logins distintos a propósito: el de TT (sistema/admin) y el de cada proyecto (equipo). No mezclarlos.
- En local: portada, landings y System en http://localhost:8790 (`./abrir.sh`); app Global en http://localhost:3000 (`cd GLOBAL && npm run dev`)). Cada app se abre por separado; System no arranca ninguna.
- Trabajo local por defecto: no desplegar a Vercel ni tocar dominios sin pedido explícito de TT.
- Para publicar la portada en `tdt.systems`, primero ejecutar `SYSTEM/deploy/armar-landing.sh` y desplegar desde `_registro/deploy-landing`. Nunca desplegar `SYSTEM/landing-sistema` directo: las landings de Global, Growth y Digital viven en sus carpetas y quedarían en 404.

Mientras continúen dentro de un solo repositorio, estas fronteras deben mantenerse conceptualmente separadas.

## Fuente vigente

- `SYSTEM/dashboard/dashboard-maestro.html` es el dashboard maestro de TT. Recorrido: proyectos → System → `system.html` (PIN de 4 números, validado por `SYSTEM/runtime/pin.mjs`) → `dashboard.html`, que lo carga protegido en `/sistema/dashboard-maestro.html`.
- `SYSTEM/landing-sistema/` contiene la portada (`tdtsystem.html`, `proyectos.html`), el logo compartido (`marca/`), la pantalla System con PIN (`system.html`) y `dashboard.html`, que protege el dashboard maestro.
- `PERSONAL/`: todo lo relacionado con la imagen de TT. Por ahora contiene el prototipo `PERSONAL/landing/operador-no-guru/personal.html` (local: `/personal.html`).
- Cada proyecto guarda su landing en `<PROYECTO>/landing/` y su aplicación en su propia carpeta (Global: `GLOBAL/`). Todo lo de un proyecto va en la carpeta de ese proyecto.
- `SYSTEM/runtime/server.mjs` sirve todo en http://localhost:8790 y sabe en qué carpeta está cada landing.
- `SYSTEM/documentos-internos/` conserva documentos fuente internos.
- `GROWTH/` contiene solo su landing. La app de prueba anterior pasa a `~/TDT_REVISION/growth-app-prueba-2026-09-23/`.
- `TDT_REVISION` está fuera del proyecto presente y contiene material histórico o pendiente de evaluación.

No restaurar código desde `TDT_REVISION` directamente dentro del sistema vigente.

## Regla para TDT_REVISION

Revisar material antiguo solamente cuando una pantalla o función actual lo necesite. Clasificar cada pieza antes de utilizarla:

- **VIGENTE**: representa correctamente el presente.
- **REUTILIZABLE**: contiene una parte útil que debe adaptarse.
- **REFERENCIA**: explica contexto histórico, pero no debe ejecutarse.
- **OBSOLETO**: fue reemplazado o contradice el presente.
- **DESCONOCIDO**: no existe evidencia suficiente para decidir.

Antes de migrar una pieza, responder:

1. ¿Resuelve una necesidad actual?
2. ¿Su información sigue siendo válida?
3. ¿Duplica una pieza vigente?
4. ¿Pertenece a Public, App, Admin o a un módulo?
5. ¿Reduce complejidad o vuelve a introducir desorden?

## Orden de construcción

1. App: estructura visual, acceso y navegación.
2. Dirección: presente, prioridades y decisiones.
3. Growth: clientes, ventas y caja.
4. Global: productos, proveedores y economía.
5. Digital: ofertas, ventas y entrega.
6. System: arquitectura, memoria e infraestructura.
7. Admin: permisos, fuentes, integraciones y auditoría.
8. Public: presentación externa definitiva.
9. IA y automatización.

No abrir una capa posterior para evitar cerrar una decisión pendiente de una capa anterior.

## Método de trabajo

Trabajar una pantalla o flujo por vez:

1. Definir qué pregunta debe responder.
2. Identificar la fuente de la información.
3. Separar hechos, declaraciones, hipótesis y pendientes.
4. Diseñar la vista mínima necesaria.
5. Implementar acciones y estados explícitos.
6. Verificar en navegador y comprobar el flujo completo.
7. Cerrar la pieza antes de comenzar otra.

## Contrato de información

Todo dato operativo debe poder expresar, cuando aplique:

- identidad estable;
- módulo o dominio;
- estado;
- responsable;
- fuente y procedencia;
- fecha de actualización;
- nivel de evidencia;
- siguiente paso.

Una interfaz no crea verdad. Representa una fuente identificable.

## Gobierno

- Declarado no equivale a verificado.
- Capacidad descrita no equivale a disponibilidad actual.
- Activo potencial no equivale a activo confirmado.
- Una idea registrada no se convierte automáticamente en prioridad o tarea.
- Dirección Estratégica conserva la autoridad raíz.
- La IA puede leer, relacionar y proponer; no canoniza ni ejecuta decisiones sensibles sin autoridad delegada.
- Toda automatización debe declarar señal, condición, acción permitida, límite, evidencia y escalamiento.

## Interfaz

- Mantener navegación simple y estable.
- Mostrar primero presente, decisión y siguiente acción.
- Evitar duplicar el mismo contenido en la web pública y el dashboard.
- Global y Growth no deben enlazar a páginas públicas vacías.
- El contenido interno de Global, Growth, Digital y System vive en el dashboard.
- No reincorporar estilos o componentes del dashboard anterior salvo decisión explícita.

## Cambios y archivos

- No borrar material incierto: moverlo a `TDT_REVISION` con nombre y fecha claros.
- No modificar material archivado para hacerlo parecer vigente.
- Mantener `SYSTEM/dashboard/` limitado al dashboard maestro y sus dependencias reales.
- Actualizar rutas y pruebas cuando se mueva un archivo.
- No crear dos fuentes de verdad para el mismo dato.
- No incluir secretos, tokens o credenciales en el repositorio.

## Verificación mínima

Antes de cerrar un cambio:

- comprobar que la ruta activa sirve el archivo correcto;
- revisar visualmente la pantalla afectada;
- probar navegación y acción principal;
- ejecutar las pruebas relacionadas;
- confirmar que no quedan referencias activas a archivos movidos.

