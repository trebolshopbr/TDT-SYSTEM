# Estado por proyecto

Actualizado: 2026-09-23

- HECHO: acceso local directo al dashboard maestro durante la construcción. El PIN permanece implementado, pero está desactivado en `SYSTEM/runtime/start.mjs`.

## Portada TDT
- HECHO 2026-09-23: publicada en `tdt.systems` (portada, proyectos, System solo con pantalla de PIN, landings de Global, Growth y Digital).
- HECHO 2026-09-23: Login de Global en la landing de `tdt.systems` apunta a `https://global.tdt.systems/login`. `app.tdt.systems` queda reservado para System (sin publicar todavía).
- HECHO: `tdtsystem.html` → `proyectos.html` → landings en las carpetas de cada proyecto.
- PENDIENTE (propuesto, sin confirmar por TT): usar en Growth y Digital el mismo botón "Login →" que Global; indicar que el logo se puede clicar; hacer que "← TDT" vuelva a proyectos.

## Global (app de socios, portugués de Brasil, moneda BRL)
- HECHO 2026-09-23: Sugerencias contiene los cinco candidatos G1 ordenados, con estado, evidencia, ficha editable y conversión controlada al catálogo. Papa-Bolinhas tiene dos imágenes históricas asociadas como REFERENCIA; los otros cuatro conservan imagen pendiente. Ningún candidato está aprobado todavía.
- HECHO 2026-09-23: las dos sugerencias investigadas (Suporte Magnético Automotivo y Papa-Bolinhas Portátil) están cargadas y verificadas en la base remota mediante la migración `0020`.
- HECHO: login, Meu escritório (KPIs de toda la empresa por Dia/Semana/Mês/Ano), Financeiro (bruto → comisiones → líquido → costo → gastos → lucro), Despesas (USD/BRL con el cambio del día), Fechamento de caixa, Pedidos (ligados a stock, comisión, método de pago), Produtos (imagen, canal, costo en USD, stock negativo = vendido sin stock, margens, sugestões), Catálogo, Plataformas, Sócios (solo admin). Galería de 73 fotos reales de productos disponible en `GLOBAL/public/products/`.
- HECHO: estética negro/blanco en toda la app, autenticación rápida (`getClaims` + `cache`).
- HECHO 2026-09-23: Dominio `global.tdt.systems` activo para la app de Global. `app.tdt.systems` queda reservado para System.
- Datos reales: 13 pedidos de Shopee cargados. Nada ficticio.

- IDEAS sin pedir: estado de cobro (Pendente/Transferido); unir Produtos y Catálogo.

## Growth
- Solo la landing. Sin app todavía. La app de prueba anterior (fichas Canary, nunca se usó de verdad) va a `~/TDT_REVISION/growth-app-prueba-2026-09-23/`.

## Digital
- Solo la landing. Sin app todavía.

## System / Admin
- HECHO 2026-09-23: Dirección es editable y persistente: Ahora, horizontes, inbox y decisiones recientes. Cada guardado conserva la versión anterior en un historial local.
- HECHO 2026-09-23: IA y automatización tiene el subapartado temporal `Promt`, con registros vacíos para preparados por sector y usos.
- HECHO 2026-09-23: el apartado IA y automatización muestra el inventario actual de herramientas: GPT Work, Claude Code local y Antigravity IDE.
- HECHO 2026-09-23: Global, Growth y Digital tienen vistas administrativas diferenciadas en el dashboard maestro. La operación detallada queda en la aplicación propia de cada negocio; Growth y Digital reflejan que todavía no tienen app.
- PENDIENTE (TT): configurar el PIN con `node SYSTEM/runtime/configurar-pin.mjs` y reiniciar `./abrir.sh`.
- HECHO 2026-09-23: acceso proyectos → System → login admin → dashboard maestro limpio, con los 4 proyectos y sus enlaces. Sin datos todavía.
- Dashboard de TT: `SYSTEM/dashboard/dashboard-maestro.html`, protegido por `SYSTEM/landing-sistema/dashboard.html` (se entra por `system.html` con el PIN).
- HECHO 2026-09-23: se desactivaron y archivaron las tareas automáticas rotas y los restos de code-review-graph, y se corrigió `GLOBAL/landing/README.md`. Ver `revision.md`.
