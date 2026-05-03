# Chat, notificaciones y flujo Descubrir

## Error completed_count
Corregido:
- Se quitó `completed_count` del upsert de `user_album_progress`.
- Ya no debería aparecer:
  `Could not find the completed_count column`

## Chat en tiempo casi real
- El chat actualiza mensajes cada 4 segundos.
- La lista de chats actualiza cada 6 segundos.

## Nueva página
- `/figus/chats`
- Muestra:
  - nombre del usuario
  - qué se intercambia
  - último mensaje
  - botón para entrar al chat

## Navbar
- Se agregó acceso superior a “Chats”.

## Notificaciones
- Si llega un mensaje nuevo mientras la pestaña está abierta o en segundo plano, dispara notificación local del navegador.
- Esto requiere permiso de notificaciones.
- Para notificaciones push reales con la app cerrada hace falta Service Worker + Web Push/Firebase Cloud Messaging; eso queda como fase posterior.

## Descubrir / Tinder
- Si el usuario toca “Quiero este” y no hay match mutuo:
  - desaparece de Descubrir
  - solo vuelve a notificar/abrir chat si el otro también acepta.
- Si el usuario toca “No me sirve”:
  - se guarda como rechazado
  - no vuelve a aparecerle.

## SQL
Ejecutar nuevamente:
`supabase/TODO_SUPABASE_COMPLETO.sql`
