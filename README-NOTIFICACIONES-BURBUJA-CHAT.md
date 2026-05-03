# Notificaciones visibles + burbuja de chat + borrar chat

## Nuevo
- Campana de notificaciones arriba, al lado de Perfil/Cerrar sesión.
- Burbuja flotante de mensajes abajo a la derecha.
- Nueva cuenta visible de mensajes recientes/chats.
- Dentro del chat: botón “Borrar chat de mi lista”.
  - No borra para la otra persona.
  - Lo oculta solo para el usuario actual.

## Notificaciones
- Las notificaciones locales del navegador siguen funcionando si el permiso está activo.
- Además ahora hay notificación visual dentro de la app, aunque el navegador no muestre push.

## SQL
Ejecutar nuevamente:
`supabase/TODO_SUPABASE_COMPLETO.sql`

Agrega:
- `hidden_by_user1`
- `hidden_by_user2`
