# Checkpoint limpio + trade automático

## Checkpoint
- Se eliminaron:
  - Observaciones
  - Marcar como urgente
  - bloque inferior con tres botones
- Queda un flujo limpio:
  - revisar tenés/faltan/repetidas
  - botón “Siguiente: ver usuarios cercanos”
- Al avanzar se muestra overlay:
  “Calculando matches...”

## Intercambio cumplido
En el chat, cuando se marca reputación “Cumplió”:
- Se guarda la reputación.
- Se marca el match como INTERCAMBIADO.
- Se acredita automáticamente al álbum de cada usuario lo que recibió.
- Se descuenta automáticamente una unidad de las repetidas del usuario que entregó cada figu.
- Se marca `trade_applied = true` para no aplicar dos veces.

## SQL
Ejecutar nuevamente:
`supabase/TODO_SUPABASE_COMPLETO.sql`

Agrega:
- `figu_matches.trade_applied`
- `figu_matches.trade_applied_at`
