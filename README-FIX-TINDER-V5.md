# Fix Tinder v5

Cambio aplicado:

- El modo Tinder ya no exige `status === "PENDIENTE"` de forma estricta.
- Ahora usa la misma lógica visible del modo simple: muestra matches activos siempre que no estén en `HABLANDO`, `ACORDADO`, `INTERCAMBIADO` o `CANCELADO`, y que no tengan interés mutuo ya confirmado.
- Esto corrige el caso donde el modo simple mostraba intercambios reales, pero Tinder quedaba vacío porque algunos registros venían con estados heredados/no estrictamente `PENDIENTE`.

No requiere SQL nuevo si ya ejecutaste `supabase/FIX_MATCHES_REALES_V4.sql`.
