#!/bin/bash
# Arma en _registro/deploy-landing lo que se publica en tdt.systems.
# Junta la portada (SYSTEM/landing-sistema) con la landing de cada proyecto, que vive en su propia carpeta.
# NO publica: después, desde esa carpeta, se ejecuta `npx vercel deploy --prod`.
# No incluye dashboard.html, config.js ni el dashboard maestro: solo funcionan en local.
set -e
cd "$(dirname "$0")/../.."
OUT="_registro/deploy-landing"
L="SYSTEM/landing-sistema"
# global.tdt.systems en producción.
LOGIN_GLOBAL="${LOGIN_GLOBAL:-https://global.tdt.systems/login}"


rm -rf "$OUT"; mkdir -p "$OUT"
cp "$L/tdtsystem.html" "$L/proyectos.html" "$L/system.html" "$L/vercel.json" "$OUT/"
cp -R "$L/marca" "$OUT/marca"
cp GLOBAL/landing/global.html GROWTH/landing/growth.html DIGITAL/landing/digital.html "$OUT/"
[ -d "$L/.vercel" ] && cp -R "$L/.vercel" "$OUT/.vercel"
sed -i '' "s#https://global.tdt.systems/login#$LOGIN_GLOBAL#" "$OUT/global.html"

# Comprobación: cada enlace de la portada debe tener su archivo.
for f in $(grep -o 'href="[a-z-]*\.html"' "$OUT/proyectos.html" | sed 's/href="//;s/"//'); do
  [ -f "$OUT/$f" ] || { echo "FALTA $f"; exit 1; }
done
echo "Listo en $OUT:"; ls "$OUT"
echo "Publicar: cd $OUT && npx vercel deploy --prod --yes"
