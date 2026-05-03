# Fix MP: pago confirmado pero plan seguía Gratis

## Problema

El pago se confirmaba, pero la app seguía mostrando `Gratis`.

## Causa probable

El plan `EXTRAS` estaba pensado como complemento y se guardaba con:
- `plan_type = EXTRAS`
- `is_premium = false`
- `premium_until = null`

Pero `normalizeSubscription()` consideraba activo solo cuando:
- `is_premium = true`
- `premium_until` futuro

Entonces `EXTRAS` se convertía visualmente en `FREE`.

## Corrección

Ahora:
- Todos los planes pagos guardan vencimiento de 7 días en `premium_until`.
- `EXTRAS` sigue con `is_premium = false`, pero se reconoce como plan activo.
- `PREMIUM` y `PRO_TOTAL` mantienen `is_premium = true`.
- La activación automática desde Mercado Pago guarda `premium_until` también para Extras.
- El admin también guarda vencimiento en Extras.

## Importante para pagos ya hechos

Si un pago anterior ya activó orden pero dejó el perfil mal:
- desde Admin podés dar el plan por 7 días, o
- en Supabase corregir manualmente el usuario:
  - `plan_type = EXTRAS/PREMIUM/PRO_TOTAL`
  - `premium_until = ahora + 7 días`
  - `is_premium = true` solo para PREMIUM/PRO_TOTAL

Después de subir este fix, los próximos pagos deberían reflejarse bien.
