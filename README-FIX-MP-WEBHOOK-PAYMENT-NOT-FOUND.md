# Fix Mercado Pago webhook: Payment not found

## Problema

El pago se cobró, pero la suscripción no se activó.

Log:
`MP webhook error Error: Payment not found`

## Causa

Mercado Pago puede enviar notificaciones como:
- `payment`
- `merchant_order`

El webhook anterior trataba cualquier `id` como si fuera siempre un payment id. Si Mercado Pago enviaba un merchant_order id, la consulta `/v1/payments/{id}` devolvía `Payment not found`.

## Corrección

`app/api/mp/webhook/route.ts` ahora:
- detecta `type` o `topic`
- soporta `payment`
- soporta `merchant_order`
- si un payment no aparece, prueba como merchant_order
- busca el pago aprobado dentro de merchant_order
- consulta el pago real
- activa el plan

## Pasos

1. Reemplazar proyecto con este ZIP.
2. Git:
   git add .
   git commit -m "fix mercado pago webhook merchant order"
   git push

3. Esperar deploy en Vercel.

## Para el pago que ya se cobró

Ese pago anterior probablemente no se activará solo porque el webhook falló en ese momento.

Opciones:
- Activarlo manualmente desde Admin por 7 días.
- O reenviar la notificación desde Mercado Pago Developers si el panel lo permite.

