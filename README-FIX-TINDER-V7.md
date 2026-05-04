# Fix Tinder v7

Se revisó completo el modo Tinder.

Cambio principal:
- Tinder ahora usa la misma base de matches reales 1x1 que el modo simple.
- Se eliminó el filtro SQL estricto por estado que podía dejar la cola vacía.
- Se valida que el intercambio sea real y parejo: recibís N y entregás N.
- La distancia solo filtra si es válida; si no existe, no elimina la tarjeta.
- Si no hay cola fresca, reofrece descartados/no finales para evitar que con pocos usuarios el modo quede vacío en pruebas.
- Se agregaron contadores internos en `stats.debug` para controlar: activeMatches, realExchangeMatches, tinderCandidates, strictQueue y fallbackQueue.

No requiere SQL nuevo si ya se ejecutó el SQL de la v4.
