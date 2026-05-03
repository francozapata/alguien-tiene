# Figus Mundial 2026 - Intercambio justo

Cambios incluidos:

## Dos caminos dentro de Figus

1. Camino principal / obligatorio:
   - Mi álbum
   - Mis repetidas
   - Crear solicitud
   - Intercambios

2. Modo Descubrir:
   - Nueva ruta: `/figus/descubrir`
   - Muestra propuestas en formato tarjeta tipo swipe.
   - Botón X para descartar.
   - Botón corazón para abrir chat.

## Regla nueva de intercambio justo

Un `Intercambio` siempre es parejo:
- Vos recibís 2 figuritas.
- Vos entregás 2 figuritas.

Si el sistema detecta:
- La otra persona te puede dar 4.
- Vos solo podés darle 2.

Entonces propone:
- Intercambio 2x2.

El resto puede quedar para otro intercambio.

## Ayuda simple

Cuando no hay paridad, se muestra como `Ayuda simple`.
Eso puede servir para:
- regalo
- venta
- arreglo manual

Pero no se presenta como intercambio justo.

## SQL

Usar:
`supabase/TODO_SUPABASE_COMPLETO.sql`

Agrega un constraint para evitar intercambios dobles desparejos:
`figu_matches_fair_double_check`
