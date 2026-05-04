# Tinder v12 - fix final de tarjetas vacías

Cambios aplicados:

- No se tocó el modo normal/simple.
- Tinder sigue recalculando desde álbum + repetidas.
- Se agregó normalización robusta de figuritas en `figus_user1_gets` y `figus_user2_gets` para aceptar:
  - arrays reales de Supabase,
  - strings tipo `{1,2}`,
  - JSON tipo `[1,2]`,
  - códigos tipo `FWC0, FWC1`.
- Tinder ya no descarta tarjetas por estado `CANCELADO` viejo de pruebas.
- Las tarjetas se muestran si hay figuritas reales o score positivo.
- El chat sigue abriéndose solamente si el like es mutuo.

No requiere SQL nuevo si ya ejecutaste el SQL de la v4.
