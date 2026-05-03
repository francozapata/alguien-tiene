# Planes, beneficios y admin completo

## Cambios incluidos

### Home Figus
- El bloque de estado de cuenta ahora muestra:
  - plan actual
  - vencimiento o renovación diaria
  - swipes diarios
  - perfiles manuales diarios
  - radio de búsqueda
  - matches inteligentes
  - ver likes
  - boosts
  - búsquedas instantáneas
  - radar cercano

### Modo gratis sugerido
- 10 swipes por día.
- 10 perfiles manuales por día.
- Radio base de 5 km.
- Matches básicos.
- Sin ver likes.
- Sin boosts, búsquedas instantáneas ni radar.

### Planes
- Gratis
- Premium
- Extras
- Pro Total

### Admin
En Usuarios ahora se ve:
- plan actual
- días restantes
- beneficios detallados
- vencimiento
- extras disponibles
- nota interna

Acciones nuevas:
- Dar Premium
- Dar Extras
- Dar Pro Total
- Sumar días
- Editar extras
- Quitar plan
- Resetear álbum
- Bloquear / desbloquear
- Reportar usuario

### Se ocultó el bloque de permisos en Home
El panel de permisos/ubicación ya no se muestra en Home Figus para no duplicar información.

## SQL
Ejecutar nuevamente:
`supabase/TODO_SUPABASE_COMPLETO.sql`

Agrega:
- free_swipes_used_today
- free_profiles_viewed_today
- free_usage_day
