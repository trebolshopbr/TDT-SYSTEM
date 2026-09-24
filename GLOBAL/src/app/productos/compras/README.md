# Compras y costos · entrega a Datos y Operación

Estado 2026-09-24: **guardado activado por autorización explícita de TT**. Migración aplicada: `supabase/migrations/20260924063146_compras_lotes.sql`. La app muestra ahora «Salvar compra» habilitado y permite preparar registros con pendientes. No guarda en almacenamiento local ni introduce compras ficticias.

## Alcance

`/productos/compras` → `/nova` → `/[id]`. Un producto por lote, compra con un pago, seis categorías de movimiento con múltiples pagos por categoría. Descuento total en moneda de compra. Cada gasto USD conserva fecha y cambio del pago, nunca cotización actual. Importes originales son strings decimales exactos; cálculo en centavos y cambio hasta seis decimales. BRL usa factor 1. Cantidad entera >0. Vacío es pendiente; cero necesita declaración. Concluir una categoría sin pagos declara que no tuvo gasto.

Hay subtotal provisional y costo unitario solamente cuando se completan proveedor, cantidad, compra, descuento, fecha, comprobantes, cambios necesarios, criterios de asignación y revisión de seis categorías. “Datos preenchidos” no afirma verificación del comprobante. Los comprobantes aceptan PDF/JPG/PNG/WebP de hasta 10 MB y se envían al guardar. El almacenamiento es privado; la ficha conserva el camino estable y genera acceso temporal al abrir. Las referencias antiguas siguen legibles. El reparto entre lotes es manual y documentado: no hay conciliación automática ni garantía contra imputación repetida del mismo comprobante. No usar para compras con varios pagos/cambios hasta ampliar ese detalle.

## Contrato de almacenamiento

`compras_lotes`: id estable creado al abrir formulario (reintentos no crean otro registro), producto FK, datos JSON validado, revision, autor original, último editor y fechas. Un único INSERT/UPDATE hace atómica la ficha completa. UPDATE compara revision; trigger exige incremento unitario. `compras_lotes_revisiones`: una copia inmutable por revisión, escrita exclusivamente por trigger. Sin permisos DELETE. Miembros autenticados leen y colaboran; autor original/producto no cambian. RLS exige identidad de sesión del editor, nunca service_role desde app.

La ausencia específica de tabla muestra activación pendiente. Otros fallos (permisos/red) muestran error y reintento, nunca lista vacía. Un guardado sin fila confirmada no se anuncia como éxito.

## Datos: antes de activar

Revisar permisos colaborativos con el esquema real de socios; aplicar primero en entorno de prueba. Probar anonimato sin lectura/escritura, alta por socio con autor correcto, rechazo de autor falso, edición por otro socio con su propio editor, rechazo de modificación de identidad, de revisión vieja, de JSON inválido y de escrituras/borrados del historial. Confirmar que cada alta/edición crea una única revisión y que el historial revierte si falla la operación. Validar dos sesiones editando la misma revisión: solo una debe guardar. Comprobar lectura/guardado/reapertura desde app con un socio autorizado. Estas verificaciones de base **no fueron ejecutadas**, ya que Producto no aplica migraciones.

## Operación: conexión posterior

No se escribe `productos.costo`, stock, pedidos, ventas ni gastos. Registrar compra no significa recepción de stock ni costo vendido. Para contribución, asociar unidades vendidas a lote + revisión y conservar costo de compra y movimiento por separado; repartir residuos de centavos al asignar unidades. Nunca recalcular ventas históricas usando el costo actual del producto. Evitar descontar nuevamente movimiento ya incluido en el costo completo.

Comisión ya deducida en `monto_neto` no se resta otra vez. Venta, entrega, riesgos y costos fijos siguen en el carril de Operación. Una devolución es un evento con efectos diferenciados, no dos gastos idénticos. Contribución de pedidos y resultado del mismo período necesitan cobertura completa, sin tratar faltantes como cero. Esta entrega no anuncia esa integración como terminada.

## Verificación local

Tests aislados en `model.test.cjs` y `actions.test.cjs`: cálculo, distintos cambios por pago, centavos, descuento, pendientes, asignación, validación, sesión, payload atómico, revisión y fallos de guardado. Browser: navegación, campos USD, añadir movimiento, pendientes, escritorio y 375px. Persistencia real pendiente de Datos.

## Entrega de activación — 2026-09-24

TT autorizó avanzar con el orden propuesto: activar guardado con Datos, completar primer lote con Paulo y conectar una venta con Operación. Producto volvió a consultar `/productos/compras`: sigue mostrando activación pendiente. No se aplicó la migración ni se crearon compras.

Se agregó `verificar-activacion.sql`, dos bloques de solo lectura para Datos: estructura/permisos/triggers y once casos del validador sin insertar filas. Ejecutar el segundo bloque solo después de instalar la migración. No se ejecutaron estos bloques; no acreditan todavía permisos efectivos ni persistencia. Completar además los ensayos con dos sesiones detallados arriba. Antes de cargar datos reales, verificar una cuenta de socio, guardar, recargar y retomar pendientes en entorno de prueba.

## Activación realizada — 2026-09-24

TT indicó: «no es necesario datos solo yo y si te dejo que actives». Esta autorización reemplaza para esta activación la restricción del rol. Migración aplicada a la base configurada de Global, versión remota 20260924063146; archivo local sincronizado con esa versión. Las secciones previas de entrega describen el estado anterior.

Ejecutadas y pasadas las 21 comprobaciones de estructura, privilegios y validación. Verificado en navegador con sesión admin: desapareció el aviso y se habilitó Salvar compra. No se guardaron registros comerciales. Intentos de prueba transaccional rechazados por la herramienta: no permite SET ROLE authenticated y opera consultas en transacción de solo lectura. Conteo final: 0 compras y 0 revisiones. Pendiente comprobar guardar/reabrir desde la aplicación con la primera compra real y luego con el acceso de Paulo; no se afirma que ese recorrido esté probado.

## Proveedores y comprobantes — 2026-09-24

Pedido de TT: quitar identificación por lote, proveedores registrados y seleccionables, etiqueta Desconto y comprobantes adjuntos persistidos. Aplicada migración `20260924065146_fornecedores_comprovantes.sql`: proveedores con nombre único normalizado y autor, FK en compras y bucket privado de 10 MB. Identificación manual retirada del formulario y de las pendientes; campo legacy conservado para compatibilidad.

Alta de proveedor desde la ficha; se guarda al pulsar Cadastrar e selecionar. Archivos quedan pendientes en memoria hasta Salvar compra; cada envío exitoso conserva su referencia si luego falla guardar la ficha, para reintentar sin repetir el archivo. Sustituir no borra el anterior, preservando referencias de revisiones. Si se abandona después de un envío exitoso y falla la ficha, puede quedar un archivo sin vincular; no se anuncia como compra guardada. Links firmados por 60 segundos solo tras autenticar; ningún archivo es público. No se cargaron proveedores ni documentos ficticios en la base.

50 pruebas aisladas pasadas (incluyen sesión, proveedor, formato/tamaño, upload rechazado y apertura privada); build, ESLint y TypeScript correctos. Interfaz verificada a 375px y escritorio. Bucket y permisos revisados en base real. El primer recorrido de subir un comprobante real, guardar y reabrir con usuario sigue pendiente.
