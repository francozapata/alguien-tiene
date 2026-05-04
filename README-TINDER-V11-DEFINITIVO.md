# Tinder v11 definitivo

Cambios aplicados:

- No se tocó el modo normal/simple.
- El modo Tinder ya no depende de matches viejos o vacíos guardados en `figu_matches`.
- Cada ingreso a `/figus/descubrir` recalcula propuestas desde la fuente real:
  - `user_album_progress.owned_figus`
  - `user_repeated_figus`
  - catálogo real de figuritas Mundial 2026
- Luego actualiza/crea las filas necesarias en `figu_matches` para conservar ID, likes, rechazos y match mutuo.
- La distancia ya no bloquea tarjetas; solo ordena.
- El chat sigue abriéndose solo si ambos usuarios dan “Me interesa”.
- No requiere SQL nuevo si ya se ejecutó `supabase/FIX_MATCHES_REALES_V4.sql`.

Diagnóstico esperado si hay 1 usuario compatible:

```json
{
  "generatedRealtime": 1,
  "rowsRead": 1,
  "usableCards": 1,
  "finalQueue": 1
}
```
