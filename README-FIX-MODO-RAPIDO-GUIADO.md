# Fix modo rápido vs búsqueda manual

## Problema
La búsqueda manual mostraba usuarios con intercambio posible, pero el modo rápido decía:
`No hay más propuestas por ahora`.

## Causa
`/figus/descubrir` tenía un filtro extra: ocultaba propuestas si el usuario ya había dado like y todavía no había match mutuo. Eso podía dejar vacío el modo rápido mientras `/figus/guiado` seguía mostrando la compatibilidad.

## Corrección
- Modo rápido ahora usa el mismo criterio base que búsqueda manual.
- Solo oculta:
  - intercambios completados
  - cancelados
  - rechazados por el usuario
- Ya no oculta propuestas por tener un like propio pendiente.
- Búsqueda manual también oculta rechazados para mantener consistencia.

## Archivos modificados
- `app/figus/descubrir/page.tsx`
- `app/figus/guiado/page.tsx`
