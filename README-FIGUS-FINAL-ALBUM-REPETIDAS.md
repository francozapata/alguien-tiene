# Figus Mundial 2026 - ZIP final álbum + repetidas

Cambios incluidos:

## Flujo nuevo
- Se elimina “Repetidas” como pantalla separada.
- `/figus/repetidas` redirige a `/figus/mi-album`.
- En `Mi álbum` ahora se cargan:
  - figuritas que el usuario tiene
  - repetidas que puede entregar
  - cantidades repetidas
- Luego se pasa directo al `Checkpoint`.

## Checkpoint
- Calcula automáticamente:
  - las que tiene
  - las que faltan
  - las repetidas que puede entregar
- Botones:
  - Confirmar checkpoint
  - Encontrar figus
  - Volver a Home Figus
  - Ver listado de intercambios

## Descubrir
- Botones:
  - Mi álbum
  - Home Figus

## Ubicación
- Se agrega aviso para solicitar ubicación desde Figus.
- Guarda lat/lng en localStorage para futura optimización por distancia.
- Si el usuario no acepta, puede seguir usando ciudad/barrio.

SQL:
- Sigue estando todo en `supabase/TODO_SUPABASE_COMPLETO.sql`.
