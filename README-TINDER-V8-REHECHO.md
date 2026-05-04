# Tinder v8 rehecho

Cambios aplicados:

- No se modificó el modo normal / Buscar intercambios.
- `getMyTinderData()` fue rearmado desde cero.
- Tinder ahora arma su propio mazo desde:
  - `user_album_progress.owned_figus`
  - `user_repeated_figus`
  - perfiles disponibles
- Para cada usuario calcula intercambio parejo 1x1:
  - lo que yo recibo = lo que el otro tiene repetido y a mí me falta
  - lo que el otro recibe = lo que yo tengo repetido y al otro le falta
  - cantidad final = mínimo de ambos lados
- Persiste cada tarjeta en `figu_matches` para conservar la esencia Tinder:
  - pasar / descartar
  - me interesa
  - match mutuo
  - chat solo si ambos dieron like
- Si el mazo queda vacío por descartes anteriores en pruebas, reofrece descartadas como fallback para no dejar Tinder muerto con pocos usuarios.
- Se agregó `stats.debug` en la respuesta para poder diagnosticar si faltan álbum, repetidas o candidatos.

No requiere SQL nuevo si ya corriste `supabase/FIX_MATCHES_REALES_V4.sql`.
