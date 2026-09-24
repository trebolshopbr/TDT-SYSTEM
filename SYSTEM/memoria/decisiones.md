# Decisiones de TT

La más nueva va arriba. Cada una tiene fecha. No se cambian sin que TT lo pida.

## 2026-09-24
- **Global — definición oficial de las 4 áreas (Shop, Atacado, Imports, Login)**:
  - **Shop**: Para consumidor final · Vende/resuelve: productos por unidad a precio minorista · Acción principal: **Comprar**.
  - **Atacado**: Para revendedores, tiendas y empresas · Vende/resuelve: productos en cantidad con precio y condiciones diferenciadas · Acción principal: **Comprar para revender / Cotizar volumen**.
  - **Imports**: Para empresas con operaciones mayores · Vende/resuelve: estructuración de operaciones comerciales internacionales · Acción principal: **Estructurar operación**.
  - **Login**: Para socios / equipo de Global · Vende/resuelve: gestión interna de toda la empresa · Acción principal: **Entrar**.
- Reglamento (`AGENTS.md`), revisión regla por regla con TT: (1) se quitó "Global y Growth no deben enlazar a páginas públicas vacías"; (2) la verificación de 5 pasos aplica solo al publicar, tocar la base real o borrar; (3) el orden de construcción pasa a ser una sugerencia y TT decide el orden real; (4) se quitaron "Método de trabajo" (una pantalla a la vez) y "Contrato de información" (8 campos por dato); (5) la regla de TDT_REVISION se simplificó a una sola idea: lo viejo no se usa ni se ejecuta sin revisarlo; (6) se quitó la regla de automatizaciones, y de Interfaz solo quedan navegación simple y lo interno en el dashboard; los principios de Gobierno se mantienen; (7) se agregó una sección corta de Roles. Las reglas heredadas se revisan de a pocas y solo queda lo que TT elige.
- **Global — costos mínimos por operación, definidos por TT**:
  - Producto: precio de compra, descuentos, cantidad, moneda y cambio real utilizado.
  - Movimiento: transporte, importación, impuestos/aranceles cuando correspondan, almacenamiento, seguros e intermediarios.
  - Venta: comisión de marketplace/plataforma, procesamiento de pago, descuentos, publicidad atribuible a la venta y comisión comercial si existe.
  - Entrega: preparación, embalaje, envío al cliente y devolución.
  - Riesgo: producto perdido, defectuoso, devolución, fraude, diferencia de inventario y otros costos realmente ocurridos.
  - Todo expresado finalmente en BRL y con datos reales. TT reafirmó que los gastos pagados en USD guardan el cambio del día del pago.
  - Fórmula planteada por TT: ingreso neto menos costo del producto, de moverlo, venderlo, entregarlo y otros variables/pérdidas = contribución real; contribución real menos costos fijos de Global = resultado.
- TT aprobó comenzar Catálogo como espacio interno para que los socios preparen la oferta y su presentación antes de usarla con clientes. Primer prototipo con productos existentes, fotos, ficha comercial y datos faltantes explícitos; costos y gestión permanecen en Productos. Sustituye la instrucción temporal de dejar Catálogo vacío.
- TT indicó que Catálogo tiene otra intención y por ahora debe quedar vacío; completar costos y gestionar productos corresponde a Productos. Esta instrucción reemplaza el acceso a costos añadido antes en Catálogo.
- Global — costos de productos: TT indicó que los completará Paulo cuando tenga acceso; TT no compró esos productos y no dispone de los costos. La carga actual fue un prototipo basado en las ventas que TT pudo observar en Shopee. TT autorizó preparar el recorrido para completar los costos más adelante; los valores faltantes permanecen pendientes.

## 2026-09-23
- Ritmo de construcción: se trabaja en local sin subir cada cambio; GitHub una vez al día o cuando TT lo pida; publicar en internet solo a pedido. Cuidado extra solo donde equivocarse cuesta caro y no se deshace: publicar, cambiar la base de datos real y borrar. No se sube ni publica todo: qué va al dominio se decide sobre la marcha. Lo principal es mantener el orden.
- Segundo rol: Dirección, con GPT Chrome. Ordena presente, prioridades y decisiones con las palabras de TT; no decide. Lo que produce lo guarda el Guardián del sistema en `SYSTEM/direccion`.
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

## 2026-09-24 — Autorización directa para activar Compras

TT: «no es necesario datos solo yo y si te dejo que actives». Autoriza a Global Producto a aplicar la migración de Compras y costos directamente, sin requerir intervención de Datos. Excepción concreta para esta activación; no autoriza publicaciones ni cambios de otras áreas.
