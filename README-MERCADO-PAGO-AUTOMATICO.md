# Mercado Pago automático

## Qué queda implementado

La pantalla `/figus/suscripcion` ya no depende de links manuales.
Ahora cada botón:
1. llama a `/api/mp/create-preference`
2. crea una preferencia real de Mercado Pago
3. redirige al usuario al checkout
4. Mercado Pago avisa al webhook `/api/mp/webhook`
5. la app valida el pago consultando la API de Mercado Pago
6. si el pago está `approved`, activa el plan automáticamente

## Planes

- Premium: $2.000 / semana
- Extras: $1.500 / semana
- Pro Total: $3.000 / semana

## Variables obligatorias en Vercel

Project > Settings > Environment Variables:

```env
NEXT_PUBLIC_APP_URL=https://TU-DOMINIO.vercel.app
MP_ACCESS_TOKEN=APP_USR...
SUPABASE_SERVICE_ROLE_KEY=...
```

Ya deberías tener también:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## De dónde sacar MP_ACCESS_TOKEN

Mercado Pago > Developers > Tus integraciones > Crear aplicación o elegir aplicación > Credenciales de producción > Access Token.

Usar el token de producción cuando publiques real.
Para pruebas, podés usar credenciales de test.

## De dónde sacar SUPABASE_SERVICE_ROLE_KEY

Supabase > Project Settings > API > service_role key.

MUY IMPORTANTE:
- No poner esta clave en el frontend.
- Solo va en Vercel como variable privada.
- No debe empezar con NEXT_PUBLIC.

## Configurar Webhook en Mercado Pago

En Mercado Pago Developers > Tu aplicación > Webhooks / Notificaciones:

URL:
```txt
https://TU-DOMINIO.vercel.app/api/mp/webhook
```

Evento recomendado:
- Pagos / payments

La app también manda `notification_url` en cada preferencia, pero configurar el webhook desde Mercado Pago ayuda a que quede estable.

## SQL a ejecutar

Ejecutar nuevamente en Supabase:

```sql
supabase/TODO_SUPABASE_COMPLETO.sql
```

Esto agrega:
- `subscription_orders`
- `subscription_events`

## Flujo de prueba

1. Entrar a la app online.
2. Ir a `/figus/suscripcion`.
3. Tocar Premium / Extras / Pro Total.
4. Pagar en Mercado Pago.
5. Volver a la app.
6. Revisar `/perfil`, apartado Suscripción.
7. Revisar en Supabase:
   - `subscription_orders`
   - `subscription_events`
   - campos del usuario en `profiles`

## Nota importante

La activación automática depende del webhook. Si Mercado Pago demora unos segundos, el usuario puede volver a la app y refrescar.

## Archivos nuevos

- `lib/mercadopago.ts`
- `lib/supabaseAdmin.ts`
- `app/api/mp/create-preference/route.ts`
- `app/api/mp/webhook/route.ts`
- `app/figus/pago/success/page.tsx`
- `app/figus/pago/failure/page.tsx`
- `app/figus/pago/pending/page.tsx`
