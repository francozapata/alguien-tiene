# Fix matches real v3

Cambios aplicados:

1. `services/figus.ts`
   - `serializeFigus` ahora valida contra `STICKER_CATALOG`, no contra numeración corrida histórica.
   - Se mantiene el guardado interno por ordinal, pero la nomenclatura visible sigue siendo la del álbum: `FWC`, `ARG`, `CC`, etc.
   - El cálculo de match ya no descarta usuarios por `distance_km === null`.
   - La ubicación ahora sirve para ordenar/filtrar cuando existe, pero no bloquea un intercambio real 1x1.
   - `selectFairExchange` limpia primero y recién después iguala cantidades.

2. `app/figus/guiado/page.tsx`
   - El filtro por radio solo aplica si el match tiene distancia numérica.
   - Si no hay distancia, se muestra como “Ubicación por confirmar”.

3. `getMyTinderData`
   - El radio del plan solo filtra distancias reales.
   - Si no hay distancia, la tarjeta no se descarta automáticamente.

Motivo del bug:
El sistema estaba generando cero resultados cuando faltaba ubicación de alguno de los usuarios o cuando la distancia era inválida. Eso mataba tanto el modo simple como el modo Tinder, aunque hubiera álbum/repetidas compatibles.

Para probar:
- Usuario A: tiene repetida ARG1 y le falta BRA1.
- Usuario B: tiene repetida BRA1 y le falta ARG1.
- Resultado esperado: match 1x1 en Buscar intercambio y tarjeta en Tinder.
