# Cambios finales - grilla + admin

## Mi álbum
- Se eliminó la carga rápida y el bloque “cómo cargar repetidas”.
- Solo queda la grilla.
- Al tocar una figurita se selecciona y aparece un panel con `-` y `+`.
- La cantidad total aparece debajo del número en la grilla, por ejemplo `#25 / x3`.
- Cantidad 1 = la tiene.
- Cantidad 2 o más = la tiene y el excedente son repetidas.

## Admin
- El correo `francogonzalozapata@gmail.com` queda como administrador.
- En la navbar aparece botón Admin solo para ese correo.
- En `/admin` se agregó pestaña Usuarios:
  - bloquear/desbloquear cuentas
  - reportar usuarios
  - resetear álbum de usuario
- Resetear álbum borra progreso, repetidas, solicitudes activas y matches activos del álbum Mundial 2026.

## Reportar usuarios
- En el chat de Figus se agregó botón `Reportar usuario`.
- Se crea tabla `user_reports`.

## SQL
- Usar el único archivo:
  `supabase/TODO_SUPABASE_COMPLETO.sql`
