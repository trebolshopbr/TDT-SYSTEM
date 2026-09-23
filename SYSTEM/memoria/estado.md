# Estado por proyecto

Actualizado: 2026-09-23

- HECHO: acceso local directo al dashboard maestro durante la construcción. El PIN permanece implementado, pero está desactivado en `SYSTEM/runtime/start.mjs`.

## Portada TDT
- HECHO: `tdtsystem.html` → `proyectos.html` → landings en las carpetas de cada proyecto.
- PENDIENTE (propuesto, sin confirmar por TT): usar en Growth y Digital el mismo botón "Login →" que Global; indicar que el logo se puede clicar; hacer que "← TDT" vuelva a proyectos.

## Global (app de socios, portugués de Brasil, moneda BRL)
- HECHO: login, Meu escritório (KPIs de toda la empresa por Dia/Semana/Mês/Ano), Financeiro (bruto → comisiones → líquido → costo → gastos → lucro), Despesas (USD/BRL con el cambio del día), Fechamento de caixa, Pedidos (ligados a stock, comisión, método de pago), Produtos (imagen, canal, costo en USD, stock negativo = vendido sin stock, margens, sugestões), Catálogo, Plataformas, Sócios (solo admin). Galería de 73 fotos reales de productos disponible en `GLOBAL/public/products/`.
- HECHO: estética negro/blanco en toda la app, autenticación rápida (`getClaims` + `cache`).
- Datos reales: 13 pedidos de Shopee cargados. Nada ficticio.
- PENDIENTE: al desplegar, mover la app de `app.tdt.systems` a `global.tdt.systems`.
- IDEAS sin pedir: estado de cobro (Pendente/Transferido); unir Produtos y Catálogo.

## Growth
- Solo la landing. Sin app todavía. La app de prueba anterior (fichas Canary, nunca se usó de verdad) va a `~/TDT_REVISION/growth-app-prueba-2026-09-23/`.

## Digital
- Solo la landing. Sin app todavía.

## System / Admin
- HECHO 2026-09-23: Global, Growth y Digital tienen vistas administrativas diferenciadas en el dashboard maestro. La operación detallada queda en la aplicación propia de cada negocio; Growth y Digital reflejan que todavía no tienen app.
- PENDIENTE (TT): configurar el PIN con `node SYSTEM/runtime/configurar-pin.mjs` y reiniciar `./abrir.sh`.
- HECHO 2026-09-23: acceso proyectos → System → login admin → dashboard maestro limpio, con los 4 proyectos y sus enlaces. Sin datos todavía.
- Dashboard de TT: `SYSTEM/dashboard/dashboard-maestro.html`, protegido por `SYSTEM/landing-sistema/dashboard.html` (se entra por `system.html` con el PIN).
- HECHO 2026-09-23: se desactivaron y archivaron las tareas automáticas rotas y los restos de code-review-graph, y se corrigió `GLOBAL/landing/README.md`. Ver `revision.md`.
