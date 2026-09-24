# Decisiones de TT

La más nueva va arriba. Cada una tiene fecha. No se cambian sin que TT lo pida.

## 2026-09-23
- Claude se representa en **naranja** en todos sus cuadros del dashboard maestro. Cada herramienta tendrá su propio color de familia.
- Growth no tiene plan aprobado: hoy es solo su landing. Ninguna "Fase 2" ni embudo sale de aquí; si aparece en el registro de alguna IA, no viene de TT. Se decide cuando TT lo pida.
- Durante la construcción local, System abre directamente sin pedir el PIN. La protección queda implementada para reactivarla cuando TT lo decida.
- Al tocar System se ve solo "System" y un campo tipo contraseña para 4 números (PIN).
- System aparece en `proyectos.html`. Lleva a mi login y de ahí al dashboard maestro, que se rehace limpio en blanco y negro. El anterior quedó en revisión.
- `PERSONAL/` guarda todo lo relacionado con la imagen de TT. El prototipo actual se conserva.
- `AGENTS.md` se queda en la raíz, porque es el archivo que las IA leen al entrar. El detalle está en `SYSTEM/memoria/`.
- Cada proyecto guarda lo suyo en su propia carpeta ("todo va en cada carpeta donde corresponde su proyecto").
- Dominios: `tdt.systems` = portada con solo el logo → Global, Growth y Digital. `app.tdt.systems` = sistema y login de TT. `<proyecto>.tdt.systems` = landing y login del equipo de ese proyecto.
- Se trabaja en local. No se despliega ni se tocan dominios sin que TT lo pida.
- Estética básica: fondo negro y texto blanco, en las landings y en los logins. Todo debe responder rápido.
- Global tiene dos apartados más: Catálogo y Plataformas.
- En Despesas, los gastos en USD se guardan con el cambio del día en que se pagaron.

## Antes (sistema Global)
- Base de datos en Supabase, no en Drive.
- La oficina de los socios va toda en portugués de Brasil, con moneda BRL.
- No hay datos ficticios; solo datos reales.
- Los socios ven lo mismo que el admin, salvo el apartado Sócios.
- Las sugerencias de productos van dentro de Produtos.
