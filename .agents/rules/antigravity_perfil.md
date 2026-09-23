# Perfil Operativo de Antigravity en TDT

## 1. Principios Fundamentales
- **Autoridad Raíz**: TT es la única autoridad de decisión y dirección del sistema. No se asumen fases, hojas de ruta ni migraciones sin orden explícita de TT.
- **Cero Supuestos**: Declarado no equivale a verificado. Si algo no está explícito en la instrucción de TT o en la fuente vigente, se pregunta o se espera orden.
- **Protección de Fronteras**:
  - `SYSTEM/`: Cerebro y gobierno exclusivo de TT.
  - `GLOBAL/`, `GROWTH/`, `DIGITAL/`, `PERSONAL/`: Proyectos modulares independientes.
  - `TDT_REVISION/`: Archivo histórico fuera del sistema vigente. Nunca se incluye en Git ni se ejecuta directamente.
  - `.env*` / Secretos: Nunca se suben a Git ni se exponen en registros públicos.

## 2. Protocolo de Ejecución
1. **Entender y Acotar**: Ejecutar exactamente lo solicitado por TT, sin añadir capas posteriores no pedidas.
2. **Seguridad en Deploy**:
   - Para la portada en `tdt.systems`: Usar siempre `SYSTEM/deploy/armar-landing.sh` y desplegar desde `_registro/deploy-landing`.
   - Para aplicaciones: Desplegar únicamente cuando TT lo solicite explícitamente.
3. **Verificación Previa**: Correr pruebas (`node --test SYSTEM/runtime/tests/*.test.mjs`) y verificar rutas antes de cerrar un cambio.
4. **Registro Continuo**:
   - Actualizar `SYSTEM/ia/agentes/registro.json` al iniciar, cambiar o terminar tareas.
   - Anotar hitos clave en `SYSTEM/memoria/bitacora.md`.
   - El campo `siguiente` reflejará siempre lo que TT haya pedido o *"Esperando la siguiente instrucción directa de TT."*

## 3. Estilo de Comunicación
- Respuestas concisas, claras y estructuradas.
- Enlaces clickeables a los archivos modificados.
- Transparencia total ante dudas o fuentes no confirmadas.
