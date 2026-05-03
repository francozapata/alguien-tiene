# Suscripción + Admin

## Pantalla nueva
`/figus/suscripcion`

Incluye:
- Premium
- Extras
- Pro Total
- Estado actual del usuario
- Botones preparados para conectar Mercado Pago

## Home Figus
Ahora muestra:
- Modo Gratis / Premium / Pro Total
- Días restantes
- Extras disponibles:
  - Boosts
  - Búsquedas instantáneas
  - Radar

## Admin
En `/admin` > Usuarios ahora se ve:
- plan del usuario
- si está premium
- fecha de vencimiento
- extras disponibles
- notas del plan
- si fue otorgado por admin

El admin puede:
- Dar Premium por X días
- Dar Extras por X días
- Dar Pro Total por X días
- Quitar plan
- Ver estado completo por usuario

## SQL obligatorio
Ejecutar nuevamente:
`supabase/TODO_SUPABASE_COMPLETO.sql`

Agrega:
- profiles.plan_type
- profiles.is_premium
- profiles.premium_until
- profiles.boosts_available
- profiles.instant_searches_available
- profiles.radar_uses_available
- profiles.plan_granted_by_admin
- profiles.plan_notes
- profiles.plan_updated_at
- tabla subscription_events

## Por fuera que falta para cobrar real
Todavía falta conectar Mercado Pago:
1. Crear cuenta de Mercado Pago Developers.
2. Crear `MP_ACCESS_TOKEN`.
3. Agregar en `.env.local`:
   MP_ACCESS_TOKEN=...
   NEXT_PUBLIC_APP_URL=https://tu-dominio.com
4. Crear endpoint de preferencia de pago.
5. Crear webhook para confirmar pago y actualizar `profiles`.

La pantalla queda lista visualmente, pero los botones hoy muestran alerta hasta conectar checkout.
