# Cambios permisos + TyC final

## Login / TyC
- El botón de Google ya no exige TyC antes de abrir login.
- Si el usuario ya existe y aceptó TyC/+18, entra directo.
- Si es usuario nuevo o pendiente, se redirige a `/figus/tyc`.
- En `/figus/tyc` acepta:
  - Términos y privacidad
  - Mayor de 18 años

## Ubicación inteligente
- Ya no se pide al entrar en cualquier página.
- Se pide/refresca al entrar a:
  - `/figus/matches`
  - `/figus/descubrir`
- Si ya aceptó en el dispositivo, se actualiza silenciosamente.
- Panel de permisos en Figus, Intercambios y Descubrir.

## Notificaciones
- Se agrega botón para pedir permiso de notificaciones.
- Se guarda estado básico en localStorage.
- Preparado para futuras notificaciones reales de nuevos matches.

## Navbar
- Logo más grande.
- Mantiene layout mobile compacto.

## SQL
- Ejecutar `supabase/TODO_SUPABASE_COMPLETO.sql`.
