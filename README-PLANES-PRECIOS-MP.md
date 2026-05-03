# Planes y precios implementados

## Planes configurados

### Gratis
- $0
- 10 swipes por día
- 10 perfiles manuales por día
- radio base 5 km
- matches básicos
- sin ver likes
- sin boosts, búsquedas instantáneas ni radar

### Premium
- $2.000 por semana
- swipes ilimitados
- perfiles manuales ilimitados
- radio ampliado 50 km
- matches inteligentes
- ver likes
- prioridad en resultados

### Extras
- $1.500 por semana
- beneficios se renuevan diariamente
- 3 boosts diarios
- 5 búsquedas instantáneas diarias
- 10 usos de radar cercano diarios
- mantiene límites gratis de swipes/perfiles, porque es complemento y no reemplaza Premium

### Pro Total
- $3.000 por semana
- Todo Premium
- Todo Extras
- máxima prioridad
- ciudad completa / máximo alcance
- 3 boosts diarios
- 5 búsquedas instantáneas diarias
- 10 usos de radar diario

## Variables necesarias en Vercel

Agregar en Project Settings > Environment Variables:

NEXT_PUBLIC_MP_LINK_PREMIUM=https://...
NEXT_PUBLIC_MP_LINK_EXTRAS=https://...
NEXT_PUBLIC_MP_LINK_PRO_TOTAL=https://...

Estas variables son para links simples de Mercado Pago. No requieren webhook todavía.

## Cómo crear links en Mercado Pago

1. Entrar a Mercado Pago.
2. Ir a cobrar / link de pago.
3. Crear tres links:
   - Premium semanal: $2.000
   - Extras semanal: $1.500
   - Pro Total semanal: $3.000
4. Copiar cada link en Vercel.
5. Redeploy.

## Activación del plan

Con link simple, Mercado Pago no activa automáticamente el plan.
Opciones:

### V1 recomendada
- Usuario paga.
- Te manda comprobante o email.
- Desde Admin le das el plan por 7 días.
- Ya está implementado en el panel admin.

### V2 automática
Hay que crear integración Mercado Pago real:
- MP_ACCESS_TOKEN en Vercel.
- Endpoint `/api/mp/create-preference`.
- Endpoint `/api/mp/webhook`.
- Webhook configurado en Mercado Pago.
- Cuando el pago se aprueba, la app activa el plan automáticamente.

## Variables para V2 automática futura

MP_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app

## Vercel / Firebase

En Vercel ya deben estar:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

En Firebase Authentication > Authorized domains:
- agregar dominio de Vercel
- agregar dominio propio si luego lo comprás

## SQL

Ejecutar nuevamente:
supabase/TODO_SUPABASE_COMPLETO.sql
