# Figus Location PRO

Cambios incluidos:
- Al aceptar ubicación, se guarda en Supabase en `profiles.lat`, `profiles.lng` y `location_updated_at`.
- El match ya no ordena solo por figuritas: también calcula distancia real entre usuarios.
- `figu_matches.distance_km` guarda distancia aproximada en km.
- El score pondera:
  1. cantidad de figuritas útiles
  2. intercambio justo
  3. cercanía real
  4. ciudad/barrio
  5. urgencia
- Listado de Intercambios muestra distancia.
- Descubrir tipo Tinder muestra distancia.
- Chat muestra distancia sugerida.

SQL:
- Ejecutar `supabase/TODO_SUPABASE_COMPLETO.sql`.

Importante:
- Para que la distancia aparezca, ambos usuarios deben aceptar ubicación.
- Si alguno no acepta ubicación, se sigue usando ciudad/barrio.
