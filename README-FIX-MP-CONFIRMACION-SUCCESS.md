# Fix Mercado Pago: confirmación desde /success

## Problema
El usuario paga y Mercado Pago redirige a:

`/figus/pago/success?collection_id=...&payment_id=...&status=approved&external_reference=...`

Pero si el webhook falla o llega con un formato inesperado, el plan queda sin activar.

## Solución agregada
Además del webhook, ahora la página de éxito confirma el pago directamente:

1. Lee `payment_id`, `collection_id`, `status` y `external_reference` de la URL.
2. Llama a `/api/mp/confirm-payment`.
3. El backend consulta Mercado Pago con `MP_ACCESS_TOKEN`.
4. Si el pago está aprobado, activa el plan.

## Archivos nuevos/modificados

- `lib/server/mpActivate.ts`
- `app/api/mp/confirm-payment/route.ts`
- `app/api/mp/webhook/route.ts`
- `app/figus/pago/success/page.tsx`

## Importante
Si sigue apareciendo `Payment not found`, casi seguro el `MP_ACCESS_TOKEN` es incorrecto:
- token de test usado con pago real
- token de otra cuenta de Mercado Pago
- token viejo o de otra aplicación

El token debe ser de PRODUCCIÓN y de la MISMA cuenta que recibió el pago.

## Pasos
```bash
git add .
git commit -m "fix mp confirmation success fallback"
git push
```

Luego redeploy en Vercel y probar otro pago.
