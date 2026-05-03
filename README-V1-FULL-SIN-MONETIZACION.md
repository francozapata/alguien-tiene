# V1 full sin monetización

Incluye estas mejoras:

## 1. Onboarding
- Tutorial inicial en Home Figus.
- Se guarda en localStorage para no mostrarlo siempre.

## 2. Usuarios cercanos aunque no haya match perfecto
- Nueva lógica en `/figus/guiado`.
- Si no hay intercambio perfecto, muestra usuarios cercanos dentro del radio elegido.

## 3. Radio de búsqueda
- Filtro de 1 km, 5 km, 10 km, 20 km y 50 km.
- Por defecto 10 km.

## 4. Reputación visible
- Se muestran datos de reputación:
  - rating promedio
  - intercambios cumplidos
- Se usa la vista `figu_user_reputation`.

## 5. Match inteligente más claro
- Lista ordenable por:
  - cercanía
  - mayor cantidad de intercambio

## 6. Chat mejorado
- Refresco automático + Supabase Realtime.
- Botón para proponer punto de encuentro.
- Notificaciones locales si llega mensaje nuevo mientras la app está abierta o en segundo plano.

## 7. Notificaciones internas
- Campana con panel descriptivo.
- Burbuja flotante para chats.
- Avisos visibles dentro de la app.

## 8. Skeleton/loading
- Componente de carga preparado para usar en listados.

## Limitaciones honestas
- Push reales con app completamente cerrada requieren Web Push/Firebase Cloud Messaging + Service Worker y configuración de claves. Queda preparado conceptualmente, pero no se puede dejar 100% funcional sin esas credenciales.
- Ubicación real en mobile requiere HTTPS/deploy o túnel HTTPS.

## Obligatorio
Ejecutar:
`supabase/TODO_SUPABASE_COMPLETO.sql`
