# FIX MATCHES REALES V4

Se corrigió el motivo por el que no aparecían matches aunque dos usuarios fueran compatibles.

Cambios:
- `services/figus.ts` ya no oculta errores de Supabase al crear/upsert de `figu_matches`.
- Si falta una columna o política de Supabase, ahora la app muestra el error real en pantalla.
- Se agregó `supabase/FIX_MATCHES_REALES_V4.sql` con columnas, constraints y políticas necesarias.
- Se actualizó el SQL base para Mundial 2026 a 994 figuritas.

IMPORTANTE:
Antes de probar en Vercel, ejecutar en Supabase SQL Editor:

```sql
-- copiar y ejecutar todo el contenido de:
supabase/FIX_MATCHES_REALES_V4.sql
```

Sin ese SQL, el front puede compilar perfecto pero no crear matches porque la tabla `figu_matches` puede no tener columnas como `liked_by_user1`, `mutual_interest`, `distance_km`, `trade_applied`, etc.
