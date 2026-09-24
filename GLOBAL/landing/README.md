# Landing pública de TDT Global

- `global.html`: portada principal de Global con los 3 segmentos comerciales (Shop, Atacado, Imports) y el acceso a Oficina.
- `shop.html`: canal de venta unitaria y compra rápida.
- `atacado.html`: canal B2B, ventas por lote y revendedores.
- `imports.html`: canal de comercio exterior, sourcing en fábrica y logística.

`SYSTEM/runtime/server.mjs` las sirve en http://localhost:8790/{global,shop,atacado,imports}.html.

`atacadista.html` solo redirige a `atacado.html` (nombre anterior).
